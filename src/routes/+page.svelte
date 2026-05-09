<script lang="ts">
  import { onMount } from 'svelte';
  import { getDb, type MediaEntry } from '$lib/db';
  import { seedDatabase } from '$lib/seed';
  import { loadEnabledCategories, setCategoryEnabled } from '$lib/settings';
  import { CATEGORIES } from '$lib/types';
  import Icon from '$lib/components/Icon.svelte';
  import EntryDialog from '$lib/components/EntryDialog.svelte';
  import EntryList from '$lib/components/EntryList.svelte';

  let seeded = $state(false);
  let entries: MediaEntry[] = $state([]);
  let dbError = $state('');
  let editingEntry = $state<MediaEntry | null | undefined>(undefined);
  let enabledCategories = $state<Set<string>>(new Set(CATEGORIES));
  let isDark = $state(false);

  function toggleTheme() {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('riffle-theme', isDark ? 'dark' : 'light');
  }

  let enabledEntries = $derived(entries.filter(e => {
    const cat = e.media_category;
    return !cat || enabledCategories.has(cat);
  }));

  let totalCount = $derived(enabledEntries.length);
  let completedCount = $derived(enabledEntries.filter(e => e.status === 'Completed').length);

  async function loadEntries() {
    try {
      const db = await getDb();
      if (!seeded) {
        await seedDatabase(db);
        seeded = true;
      }
      entries = await db.select<MediaEntry[]>('SELECT * FROM core_media ORDER BY date_added DESC');
      dbError = '';
    } catch (e) {
      dbError = String(e);
    }
  }

  async function loadCategories() {
    try {
      const db = await getDb();
      enabledCategories = await loadEnabledCategories(db);
    } catch (e) {
      dbError = String(e);
    }
  }

  async function handleCategoryToggled(category: string, enabled: boolean) {
    const db = await getDb();
    await setCategoryEnabled(db, category, enabled);
    enabledCategories = await loadEnabledCategories(db);
  }

  function handleClose() {
    editingEntry = undefined;
    loadEntries();
  }

  onMount(async () => {
    if (localStorage.getItem('riffle-theme') === 'dark') {
      isDark = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    await loadCategories();
    await loadEntries();
  });
</script>

<main>
  {#if dbError}
    <p class="error">Database error: {dbError}</p>
  {:else}
      <div class="header">
        <div>
          <span class="app-name">Riffle</span>
          <p class="stats">{totalCount} entries &middot; {completedCount} completed</p>
        </div>
        <div class="header-actions">
          <button class="theme-btn" onclick={toggleTheme} title="Toggle dark mode">
            <Icon name={isDark ? 'sun' : 'moon'} />
          </button>
          <button class="add-btn" onclick={() => editingEntry = null}>+ Add Entry</button>
        </div>
      </div>
    <EntryList {entries} {enabledCategories} onEntriesChanged={loadEntries} onEdit={(e) => editingEntry = e} onCategoryToggled={handleCategoryToggled} />
  {/if}
</main>

{#if editingEntry !== undefined}
  <EntryDialog entry={editingEntry} {enabledCategories} onClose={handleClose} />
{/if}

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 2.5rem;
    font-family: var(--font);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .app-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
  }

  .stats {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0.15rem 0 0 0;
  }

  .add-btn {
    padding: 0.45rem 0.9rem;
    font-size: 0.9rem;
    cursor: pointer;
    border: none;
    background: var(--primary);
    color: #fff;
    border-radius: var(--radius);
    font-weight: 500;
  }

  .add-btn:hover {
    background: var(--primary-hover);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .theme-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.4rem 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    color: var(--text);
    line-height: 1;
  }

  .theme-btn:hover {
    background: var(--surface);
  }

  .error {
    color: var(--danger);
  }
</style>
