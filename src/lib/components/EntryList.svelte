<script lang="ts">
  import { getDb, type MediaEntry } from '$lib/db';
  import { CATEGORIES, STATUSES, CREATOR_LABEL } from '$lib/types';
  import { CATEGORY_DETAILS, parseDetails, type DetailField } from '$lib/schema';

  let { entries, onEntriesChanged }: { entries: MediaEntry[]; onEntriesChanged: () => void } = $props();

  let saving = $state(false);
  let editingId = $state<number | null>(null);
  let confirmingId = $state<number | null>(null);
  let editTitle = $state('');
  let editCategory = $state('');
  let editStatus = $state('');
  let editYear = $state('');
  let editCreator = $state('');
  let editGenre = $state('');
  let editDetails = $state<Record<string, string>>({});

  let sortBy = $state('date');
  let sortDir = $state<'asc' | 'desc'>('desc');
  let searchQuery = $state('');
  let filterCategory = $state('');
  let filterStatus = $state('');

  let editCreatorLabel = $derived(CREATOR_LABEL[editCategory] ?? 'Creator');
  let detailColumns = $derived<DetailField[]>(
    filterCategory && CATEGORY_DETAILS[filterCategory] ? CATEGORY_DETAILS[filterCategory] : []
  );
  let columnCount = $derived(5 + detailColumns.length);

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

  function startEdit(entry: MediaEntry) {
    editingId = entry.id;
    editTitle = entry.title;
    editCategory = entry.media_category ?? 'Movie';
    editStatus = entry.status ?? 'Want to Consume';
    editYear = entry.year?.toString() ?? '';
    editCreator = entry.creator ?? '';
    editGenre = entry.genre ?? '';
    const parsed = parseDetails(entry.details);
    editDetails = {};
    for (const field of CATEGORY_DETAILS[editCategory] ?? []) {
      const val = parsed[field.key];
      editDetails[field.key] = val !== undefined ? String(val) : '';
    }
    confirmingId = null;
  }

  function cancelEdit() {
    editingId = null;
    confirmingId = null;
  }

  async function saveEdit() {
    if (!editTitle.trim() || editingId === null) return;
    saving = true;
    try {
      const db = await getDb();
      const detailsObj: Record<string, string | number> = {};
      for (const field of CATEGORY_DETAILS[editCategory] ?? []) {
        const val = editDetails[field.key];
        if (val !== undefined && val !== '') {
          detailsObj[field.key] = field.type === 'number' ? Number(val) : val;
        }
      }
      const detailsJson = Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : null;
      await db.execute(
        'UPDATE core_media SET title = $1, media_category = $2, status = $3, year = $4, creator = $5, genre = $6, details = $7 WHERE id = $8',
        [editTitle.trim(), editCategory, editStatus, editYear ? Number(editYear) : null, editCreator.trim() || null, editGenre.trim() || null, detailsJson, editingId]
      );
      editingId = null;
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
          {#if editingId === entry.id}
            <td colspan={columnCount}>
              <div class="edit-fields">
                <input type="text" bind:value={editTitle} disabled={saving} />
                <select bind:value={editCategory} disabled={saving}>
                  {#each CATEGORIES as c}
                    <option value={c}>{c}</option>
                  {/each}
                </select>
                <select bind:value={editStatus} disabled={saving}>
                  {#each STATUSES as s}
                    <option value={s}>{s}</option>
                  {/each}
                </select>
                <input type="number" bind:value={editYear} placeholder="Year" min="1000" max="2100" disabled={saving} />
                <input type="text" bind:value={editCreator} placeholder={editCreatorLabel} disabled={saving} />
                <input type="text" bind:value={editGenre} placeholder="Genre" disabled={saving} />
                {#each CATEGORY_DETAILS[editCategory] ?? [] as field}
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    bind:value={editDetails[field.key]}
                    placeholder={field.label}
                    disabled={saving}
                  />
                {/each}
                <button onclick={saveEdit} disabled={saving || !editTitle.trim()}>Save</button>
                <button onclick={cancelEdit} disabled={saving}>Cancel</button>
              </div>
            </td>
          {:else}
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
              <button onclick={() => startEdit(entry)} disabled={saving}>Edit</button>
              <button onclick={() => requestDelete(entry.id)} disabled={saving}>
                {confirmingId === entry.id ? 'Confirm?' : 'Delete'}
              </button>
            </td>
          {/if}
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
  input, select {
    padding: 0.25rem 0.4rem;
    font-size: 0.9rem;
  }
  .edit-fields {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .edit-fields input,
  .edit-fields select {
    flex: 1;
    min-width: 100px;
  }
  .edit-fields input[type="number"] {
    max-width: 90px;
    flex: 0 1 auto;
  }
</style>
