<script lang="ts">
  import { onMount } from 'svelte';
  import { getDb, type MediaEntry } from '$lib/db';
  import { seedDatabase } from '$lib/seed';
  import EntryDialog from '$lib/components/EntryDialog.svelte';
  import EntryList from '$lib/components/EntryList.svelte';

  let seeded = $state(false);
  let entries: MediaEntry[] = $state([]);
  let dbError = $state('');
  let editingEntry = $state<MediaEntry | null | undefined>(undefined);

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

  function handleClose() {
    editingEntry = undefined;
    loadEntries();
  }

  onMount(loadEntries);
</script>

<main>
  <h1>Riffle</h1>

  {#if dbError}
    <p class="error">Database error: {dbError}</p>
  {:else}
    <button class="add-btn" onclick={() => editingEntry = null}>+ Add Entry</button>
    <EntryList {entries} onEntriesChanged={loadEntries} onEdit={(e) => editingEntry = e} />
  {/if}
</main>

{#if editingEntry !== undefined}
  <EntryDialog entry={editingEntry} onClose={handleClose} />
{/if}

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, sans-serif;
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
    border: 1px solid #396cd8;
    background: #396cd8;
    color: #fff;
    border-radius: 4px;
  }

  .add-btn:hover {
    background: #2d5abf;
  }

  .error {
    color: #c00;
  }
</style>
