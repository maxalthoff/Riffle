<script lang="ts">
  import { getDb, type MediaEntry } from '$lib/db';
  import { CATEGORIES, STATUSES } from '$lib/types';
  import { CATEGORY_DETAILS, parseDetails, type DetailField } from '$lib/schema';

  let { entries, onEntriesChanged, onEdit }: { entries: MediaEntry[]; onEntriesChanged: () => void; onEdit: (entry: MediaEntry) => void } = $props();

  let saving = $state(false);
  let confirmingId = $state<number | null>(null);

  let sortBy = $state('date');
  let sortDir = $state<'asc' | 'desc'>('desc');
  let searchQuery = $state('');
  let filterCategory = $state('');
  let filterStatus = $state('');

  const STATUS_COLORS: Record<string, string> = {
    'Want to Consume': '#3b82f6',
    'In Progress': '#f59e0b',
    'Completed': '#22c55e',
    'On Hold': '#6b7280',
    'Dropped': '#ef4444',
  };

  const CATEGORY_ICON: Record<string, string> = {
    Movie: '🎬', Book: '📖', Show: '📺', Game: '🎮', Podcast: '🎙️',
  };

  function formatDate(raw: string | null): string {
    if (!raw) return '—';
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return raw;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[+m[2] - 1]} ${+m[3]}`;
  }

  let detailColumns = $derived<DetailField[]>(
    filterCategory && CATEGORY_DETAILS[filterCategory] ? CATEGORY_DETAILS[filterCategory] : []
  );

  const filteredEntries = $derived(entries.filter(e => {
    const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || e.media_category === filterCategory;
    const matchesStatus = !filterStatus || e.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }));

  const sortedEntries = $derived([...filteredEntries].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'title':
        cmp = (a.title ?? '').localeCompare(b.title ?? '');
        break;
      case 'category':
        cmp = (a.media_category ?? '').localeCompare(b.media_category ?? '');
        break;
      case 'status':
        cmp = (a.status ?? '').localeCompare(b.status ?? '');
        break;
      case 'date':
        cmp = (a.date_added ?? '').localeCompare(b.date_added ?? '');
        break;
      default: {
        const aVal = parseDetails(a.details)[sortBy];
        const bVal = parseDetails(b.details)[sortBy];
        if (aVal == null && bVal == null) cmp = 0;
        else if (aVal == null) cmp = 1;
        else if (bVal == null) cmp = -1;
        else cmp = Number(aVal) - Number(bVal) || String(aVal).localeCompare(String(bVal));
      }
    }
    return sortDir === 'desc' ? -cmp : cmp;
  }));

  function toggleSort(key: string) {
    if (sortBy === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = key;
      sortDir = 'desc';
    }
  }

  async function markComplete(id: number) {
    saving = true;
    try {
      const db = await getDb();
      await db.execute(
        "UPDATE core_media SET status = 'Completed', date_completed = datetime('now') WHERE id = $1",
        [id]
      );
      onEntriesChanged();
    } finally {
      saving = false;
    }
  }

  function requestDelete(id: number) {
    if (confirmingId === id) {
      executeDelete(id);
    } else {
      confirmingId = id;
    }
  }

  async function executeDelete(id: number) {
    saving = true;
    confirmingId = null;
    try {
      const db = await getDb();
      await db.execute('DELETE FROM core_media WHERE id = $1', [id]);
      onEntriesChanged();
    } finally {
      saving = false;
    }
  }
</script>

{#if entries.length === 0}
  <p class="empty">No entries yet. Add your first movie or book above.</p>
{:else}
  <div class="filters">
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Search by title..."
    />
    <select bind:value={filterCategory}>
      <option value="">All Categories</option>
      {#each CATEGORIES as c}
        <option value={c}>{c}</option>
      {/each}
    </select>
    <select bind:value={filterStatus}>
      <option value="">All Statuses</option>
      {#each STATUSES as s}
        <option value={s}>{s}</option>
      {/each}
    </select>
  </div>

  {#if filteredEntries.length === 0}
    <p class="empty">No entries match your filters.</p>
  {:else}
  <table>
    <thead>
      <tr>
        <th class="sortable" onclick={() => toggleSort('title')}>
          Title {sortBy === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </th>
        <th class="sortable" onclick={() => toggleSort('category')}>
          Category {sortBy === 'category' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </th>
        <th class="sortable" onclick={() => toggleSort('status')}>
          Status {sortBy === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </th>
        {#each detailColumns as col}
          <th class="sortable" onclick={() => toggleSort(col.key)}>
            {col.label} {sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </th>
        {/each}
        <th class="sortable" onclick={() => toggleSort('date')}>
          Added {sortBy === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each sortedEntries as entry (entry.id)}
        <tr>
          <td class="title-cell">{entry.title}</td>
          <td>{CATEGORY_ICON[entry.media_category ?? ''] ?? ''} {entry.media_category ?? '—'}</td>
          <td>
            {#if entry.status}
              <span class="badge" style="background: {STATUS_COLORS[entry.status] ?? '#6b7280'}">
                {entry.status}
              </span>
            {:else}
              —
            {/if}
          </td>
          {#each detailColumns as col}
            <td class="detail-cell">{parseDetails(entry.details)[col.key] ?? '—'}</td>
          {/each}
          <td class="date-cell">{formatDate(entry.date_added)}</td>
          <td class="actions-cell">
            {#if entry.status !== 'Completed'}
              <button class="icon-btn complete-btn" onclick={() => markComplete(entry.id)} disabled={saving} title="Mark Complete">
                {saving ? '...' : '✓'}
              </button>
            {:else}
              <span class="done">✓</span>
            {/if}
            <button class="icon-btn" onclick={() => onEdit(entry)} disabled={saving} title="Edit">✎</button>
            <button
              class="icon-btn delete-btn"
              class:confirm={confirmingId === entry.id}
              onclick={() => requestDelete(entry.id)}
              disabled={saving}
              title={confirmingId === entry.id ? 'Confirm delete' : 'Delete'}
            >
              {confirmingId === entry.id ? 'Delete?' : '✕'}
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  {/if}
{/if}

<style>
  .empty {
    color: #666;
    margin-top: 1rem;
    font-size: 0.95rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0.75rem;
  }
  thead th {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
    padding: 0.5rem 0.6rem;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #6b7280;
  }
  th, td {
    text-align: left;
    padding: 0.5rem 0.6rem;
    border-bottom: 1px solid #f0f0f0;
  }
  th.sortable {
    cursor: pointer;
    user-select: none;
  }
  th.sortable:hover {
    color: #374151;
  }
  tbody tr {
    transition: background 0.12s;
  }
  tbody tr:hover {
    background: #f9fafb;
  }
  .title-cell {
    font-weight: 500;
    color: #111827;
  }
  .detail-cell {
    color: #6b7280;
    font-size: 0.9rem;
  }
  .date-cell {
    color: #9ca3af;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
  }
  .done {
    color: #22c55e;
    font-weight: bold;
    font-size: 1rem;
    display: inline-block;
    width: 28px;
    text-align: center;
  }
  .actions-cell {
    white-space: nowrap;
    text-align: right;
  }
  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    padding: 4px 6px;
    border-radius: 4px;
    color: #6b7280;
    transition: background 0.1s, color 0.1s;
    line-height: 1;
  }
  .icon-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }
  .icon-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .complete-btn {
    color: #22c55e;
  }
  .complete-btn:hover {
    background: #f0fdf4;
    color: #16a34a;
  }
  .delete-btn:hover {
    color: #ef4444;
  }
  .delete-btn.confirm {
    color: #ef4444;
    font-weight: 600;
  }
  .filters {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }
  .filters input,
  .filters select {
    padding: 0.35rem 0.5rem;
    font-size: 0.9rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: #fff;
  }
  .filters input {
    flex: 1;
    min-width: 160px;
  }
  .filters input:focus,
  .filters select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
  }
</style>
