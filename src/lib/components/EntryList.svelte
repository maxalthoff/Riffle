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
          <td>{entry.title}</td>
          <td>{entry.media_category ?? '—'}</td>
          <td>{entry.status ?? '—'}</td>
          {#each detailColumns as col}
            <td>{parseDetails(entry.details)[col.key] ?? '—'}</td>
          {/each}
          <td>{entry.date_added}</td>
          <td>
            {#if entry.status !== 'Completed'}
              <button onclick={() => markComplete(entry.id)} disabled={saving}>
                {saving ? '...' : 'Mark Complete'}
              </button>
            {:else}
              <span class="done">✓</span>
            {/if}
            <button onclick={() => onEdit(entry)} disabled={saving}>Edit</button>
            <button onclick={() => requestDelete(entry.id)} disabled={saving}>
              {confirmingId === entry.id ? 'Confirm?' : 'Delete'}
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
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  th, td {
    text-align: left;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid #ddd;
  }
  th {
    font-weight: 600;
  }
  th.sortable {
    cursor: pointer;
    user-select: none;
  }
  th.sortable:hover {
    background: #eee;
  }
  .done {
    color: #090;
    font-weight: bold;
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
  }
  .filters input {
    flex: 1;
    min-width: 160px;
  }
</style>
