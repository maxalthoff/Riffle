<script lang="ts">
  import { onMount } from 'svelte';
  import { getDb, type MediaEntry } from '$lib/db';
  import { seedDatabase } from '$lib/seed';
  import AddForm from '$lib/components/AddForm.svelte';
  import EntryList from '$lib/components/EntryList.svelte';

  let seeded = $state(false);
  let entries: MediaEntry[] = $state([]);
  let dbError = $state('');

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

  onMount(loadEntries);
</script>

<main>
  <h1>Riffle</h1>

  {#if dbError}
    <p class="error">Database error: {dbError}</p>
  {:else}
    <AddForm onEntryAdded={loadEntries} />
    <EntryList {entries} onEntriesChanged={loadEntries} />
  {/if}
</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  h1 {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
  }

  .error {
    color: #c00;
  }
</style>
