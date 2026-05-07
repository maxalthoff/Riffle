<script lang="ts">
  import { getDb, type MediaEntry } from '$lib/db';
  import { CATEGORIES, STATUSES } from '$lib/types';

  let { entries, onEntriesChanged }: { entries: MediaEntry[]; onEntriesChanged: () => void } = $props();

  let saving = $state(false);
  let editingId = $state<number | null>(null);
  let confirmingId = $state<number | null>(null);
  let editTitle = $state('');
  let editCategory = $state('');
  let editStatus = $state('');

  type SortKey = 'title' | 'category' | 'status' | 'date';
  let sortBy = $state<SortKey>('date');
  let sortDir = $state<'asc' | 'desc'>('desc');

  const sortedEntries = $derived([...entries].sort((a, b) => {
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
    }
    return sortDir === 'desc' ? -cmp : cmp;
  }));

  function toggleSort(key: SortKey) {
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
      await db.execute(
        'UPDATE core_media SET title = $1, media_category = $2, status = $3 WHERE id = $4',
        [editTitle.trim(), editCategory, editStatus, editingId]
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
            <td>
              <input type="text" bind:value={editTitle} disabled={saving} />
            </td>
            <td>
              <select bind:value={editCategory} disabled={saving}>
                {#each CATEGORIES as c}
                  <option value={c}>{c}</option>
                {/each}
              </select>
            </td>
            <td>
              <select bind:value={editStatus} disabled={saving}>
                {#each STATUSES as s}
                  <option value={s}>{s}</option>
                {/each}
              </select>
            </td>
            <td>{entry.date_added}</td>
            <td>
              <button onclick={saveEdit} disabled={saving || !editTitle.trim()}>Save</button>
              <button onclick={cancelEdit} disabled={saving}>Cancel</button>
            </td>
          {:else}
            <td>{entry.title}</td>
            <td>{entry.media_category ?? '—'}</td>
            <td>{entry.status ?? '—'}</td>
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
  input, select {
    padding: 0.25rem 0.4rem;
    font-size: 0.9rem;
  }
</style>
