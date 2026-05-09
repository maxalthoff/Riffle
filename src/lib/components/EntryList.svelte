<script lang="ts">
  import { getDb, type MediaEntry } from '$lib/db';
  import { CATEGORIES, STATUSES, statusDisplayLabel } from '$lib/types';
  import { CATEGORY_DETAILS, parseDetails, type DetailField } from '$lib/schema';
  import Icon from '$lib/components/Icon.svelte';

  let { entries, onEntriesChanged, onEdit, enabledCategories, onCategoryToggled }: { entries: MediaEntry[]; onEntriesChanged: () => void; onEdit: (entry: MediaEntry) => void; enabledCategories: Set<string>; onCategoryToggled: (category: string, enabled: boolean) => void } = $props();

  let saving = $state(false);
  let confirmingId = $state<number | null>(null);
  let showManage = $state(false);
  let changingStatusId = $state<number | null>(null);
  let changingStatusValue = $state('');

  let sortBy = $state('date');
  let sortDir = $state<'asc' | 'desc'>('desc');
  let searchQuery = $state('');
  let filterCategory = $state('');
  let filterStatus = $state('');
  let wasSingle = false;

  const STATUS_COLORS: Record<string, string> = {
    'Want to Start': '#3b82f6',
    'In Progress': '#f59e0b',
    'Completed': '#22c55e',
    'On Hold': '#6b7280',
    'Dropped': '#ef4444',
  };

  function formatDate(raw: string | null): string {
    if (!raw) return '—';
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return raw;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const label = `${months[+m[2] - 1]} ${+m[3]}`;
    return +m[1] === new Date().getFullYear() ? label : `${label}, ${+m[1]}`;
  }

  function parseTags(raw: string | null): string[] {
    if (!raw) return [];
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }

  function isLastEnabled(cat: string): boolean {
    return enabledCategories.size === 1 && enabledCategories.has(cat);
  }

  function toggleManage() {
    showManage = !showManage;
  }

  function handleManageOverlay() {
    showManage = false;
  }

  $effect(() => {
    const n = enabledCategories.size;
    if (n === 1 && !wasSingle) {
      wasSingle = true;
      filterCategory = [...enabledCategories][0];
    } else if (n > 1) {
      if (wasSingle) filterCategory = '';
      wasSingle = false;
    }
  });

  const TABLE_HIDDEN_KEYS = ['frequency'];

  let detailColumns = $derived<DetailField[]>(
    filterCategory && CATEGORY_DETAILS[filterCategory]
      ? CATEGORY_DETAILS[filterCategory].filter(d => !TABLE_HIDDEN_KEYS.includes(d.key))
      : []
  );

  const filteredEntries = $derived(entries.filter(e => {
    const cat = e.media_category;
    if (cat && !enabledCategories.has(cat)) return false;
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
        const detailKey = sortBy.startsWith('_d.') ? sortBy.slice(3) : null;
        const col = detailKey ? detailColumns.find(d => d.key === detailKey) : null;
        let aVal, bVal;
        if (col?.fromEntry && detailKey) {
          aVal = (a as any)[detailKey];
          bVal = (b as any)[detailKey];
        } else if (detailKey) {
          aVal = parseDetails(a.details)[detailKey];
          bVal = parseDetails(b.details)[detailKey];
        } else {
          aVal = parseDetails(a.details)[sortBy];
          bVal = parseDetails(b.details)[sortBy];
        }
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

  function startStatusChange(entry: MediaEntry) {
    changingStatusId = entry.id;
    changingStatusValue = entry.status ?? 'Want to Start';
  }

  async function saveStatus(id: number) {
    saving = true;
    try {
      const db = await getDb();
      await db.execute(
        "UPDATE core_media SET status = $1, date_completed = CASE WHEN $1 = 'Completed' THEN datetime('now') ELSE date_completed END WHERE id = $2",
        [changingStatusValue, id]
      );
      changingStatusId = null;
      onEntriesChanged();
    } finally {
      saving = false;
    }
  }

  function cancelStatusChange() {
    changingStatusId = null;
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

{#if showManage}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="manage-overlay" onclick={handleManageOverlay}></div>
{/if}

<div class="card">
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
        {#each CATEGORIES.filter(c => enabledCategories.has(c)) as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
      <select bind:value={filterStatus}>
        <option value="">All Statuses</option>
        {#each STATUSES as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
      <div class="manage-wrapper">
        <button class="manage-btn" onclick={toggleManage}>Manage</button>
        {#if showManage}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="manage-panel" onclick={(e) => e.stopPropagation()}>
            {#each CATEGORIES as cat}
              <label>
                <input
                  type="checkbox"
                  checked={enabledCategories.has(cat)}
                  disabled={isLastEnabled(cat)}
                  onchange={() => onCategoryToggled(cat, !enabledCategories.has(cat))}
                />
                <Icon name={cat.toLowerCase()} /> {cat}
              </label>
            {/each}
          </div>
        {/if}
      </div>
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
            <th class="sortable" onclick={() => toggleSort('_d.' + col.key)}>
              {col.label} {sortBy === '_d.' + col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
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
            <td class="title-cell">
              {#if entry.image}
                <img src={entry.image} alt="" class="cover-thumb" />
              {/if}
              <div class="title-block">
                <span>{entry.title}</span>
                {#if entry.tags}
                  <div class="title-tags">
                    {#each parseTags(entry.tags) as tag}
                      <span class="tag-chip">{tag}</span>
                    {/each}
                  </div>
                {/if}
              </div>
            </td>
            <td><Icon name={entry.media_category?.toLowerCase()} /> {entry.media_category ?? '—'}</td>
            <td>
              {#if entry.status}
                {#if changingStatusId === entry.id}
                  <!-- svelte-ignore a11y_autofocus -->
                  <select
                    bind:value={changingStatusValue}
                    onchange={() => saveStatus(entry.id)}
                    onblur={cancelStatusChange}
                    autofocus
                    class="status-select"
                  >
                    {#each STATUSES as s}
                      <option value={s}>{statusDisplayLabel(s, entry.media_category)}</option>
                    {/each}
                  </select>
                {:else}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <span
                    class="badge"
                    style="background: {STATUS_COLORS[entry.status] ?? '#6b7280'}; cursor: pointer"
                    onclick={() => startStatusChange(entry)}
                  >
                    {statusDisplayLabel(entry.status, entry.media_category)}
                  </span>
                {/if}
              {:else}
                —
              {/if}
            </td>
            {#each detailColumns as col}
              <td class="detail-cell">{(col.fromEntry ? (entry as any)[col.key] : parseDetails(entry.details)[col.key]) ?? '—'}</td>
            {/each}
            <td class="date-cell">{formatDate(entry.date_added)}</td>
            <td class="actions-cell">
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
</div>

<style>
  .card {
    background: var(--card);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 1.25rem 1.5rem;
  }

  .empty {
    color: var(--text-secondary);
    text-align: center;
    padding: 2rem 0;
    margin: 0;
    font-size: 0.9rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    border-bottom: 1px solid var(--border);
    padding: 0.45rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
    user-select: none;
  }

  th.sortable {
    cursor: pointer;
  }

  th.sortable:hover {
    color: var(--text-secondary);
  }

  th, td {
    text-align: left;
    padding: 0.45rem 0.6rem;
  }

  tbody tr {
    transition: background 0.12s;
  }

  tbody tr:nth-child(even) {
    background: var(--zebra);
  }

  tbody tr:hover {
    background: var(--hover-bg);
  }

  .title-cell {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-weight: 500;
    color: var(--text);
    font-size: 0.9rem;
  }
  .title-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .title-tags {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    margin-top: 0.15rem;
  }
  .tag-chip {
    font-size: 0.7rem;
    background: var(--surface);
    color: var(--text-secondary);
    padding: 1px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .cover-thumb {
    width: 24px;
    height: 36px;
    object-fit: cover;
    border-radius: 3px;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }
  .detail-cell {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .date-cell {
    color: var(--text-secondary);
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
  }

  .status-select {
    padding: 1px 4px;
    font-size: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
  }

  .actions-cell {
    white-space: nowrap;
    text-align: right;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 4px 5px;
    border-radius: 4px;
    color: var(--text-secondary);
    transition: background 0.1s, color 0.1s;
    line-height: 1;
  }

  .icon-btn:hover {
    background: var(--hover-bg);
    color: var(--text);
  }

  .icon-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .delete-btn:hover {
    color: var(--danger);
  }

  .delete-btn.confirm {
    color: var(--danger);
    font-weight: 600;
  }

  .filters {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .filters input,
  .filters select,
  .manage-btn {
    padding: 0.4rem 0.5rem;
    font-size: 0.85rem;
    border: 1px solid var(--input-border);
    border-radius: var(--radius);
    background: var(--input-bg);
    color: var(--text);
  }

  .filters input {
    flex: 1;
    min-width: 140px;
  }

  .filters input::placeholder {
    color: var(--text-secondary);
  }

  .filters input:focus,
  .filters select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 12%, transparent);
  }

  .manage-btn {
    cursor: pointer;
    white-space: nowrap;
  }

  .manage-btn:hover {
    background: var(--surface);
  }

  .manage-wrapper {
    position: relative;
  }

  .manage-overlay {
    position: fixed;
    inset: 0;
    z-index: 5;
  }

  .manage-panel {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.25rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 10;
    white-space: nowrap;
  }

  .manage-panel label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
    font-size: 0.85rem;
    border-radius: 4px;
  }

  .manage-panel label:hover {
    background: var(--surface);
  }

  .manage-panel input[type="checkbox"] {
    margin: 0;
  }
</style>
