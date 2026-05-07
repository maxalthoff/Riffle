<script lang="ts">
  import { onMount } from 'svelte';
  import { getDb, type MediaEntry } from '$lib/db';

  let status = $state('Connecting to database...');
  let entries: MediaEntry[] = $state([]);

  onMount(async () => {
    try {
      const db = await getDb();
      const result = await db.select<MediaEntry[]>('SELECT * FROM core_media');
      entries = result;
      status = `Connected. ${entries.length} entries in database.`;
    } catch (e) {
      status = `Error: ${e}`;
    }
  });
</script>

<main>
  <h1>Riffle</h1>
  <p>{status}</p>
</main>

<style>
  main {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }
</style>
