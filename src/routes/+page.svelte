<script lang="ts">
  import { onMount } from 'svelte';
  import { getDb, type MediaEntry } from '$lib/db';
  import { seedDatabase } from '$lib/seed';
  import { loadEnabledCategories, setCategoryEnabled } from '$lib/settings';
  import { CATEGORIES } from '$lib/types';
  import EntryDialog from '$lib/components/EntryDialog.svelte';
  import EntryList from '$lib/components/EntryList.svelte';

  let seeded = $state(false);
  let entries: MediaEntry[] = $state([]);
  let dbError = $state('');
  let editingEntry = $state<MediaEntry | null | undefined>(undefined);
  let enabledCategories = $state<Set<string>>(new Set(CATEGORIES));

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
    await loadCategories();
    await loadEntries();
  });
</script>

<main>
  <h1>Riffle</h1>

  {#if dbError}
    <p class="error">Database error: {dbError}</p>
  {:else}
    <button class="add-btn" onclick={() => editingEntry = null}>+ Add Entry</button>
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
    padding: 2.5rem 3rem;
    font-family: var(--font);
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: 1.5rem;
  }

  .add-btn {
    margin-bottom: 0.75rem;
    padding: 0.4rem 0.8rem;
    font-size: 0.95rem;
    cursor: pointer;
    border: 1px solid var(--primary);
    background: var(--primary);
    color: #fff;
    border-radius: 4px;
  }

  .add-btn:hover {
    background: var(--primary-hover);
  }

  .error {
    color: var(--danger);
  }
</style>
