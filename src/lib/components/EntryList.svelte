<script lang="ts">
  import { getDb, type MediaEntry } from '$lib/db';

  let { entries, onMarkComplete }: { entries: MediaEntry[]; onMarkComplete: () => void } = $props();

  let updating = $state<number | null>(null);

  async function markComplete(id: number) {
    updating = id;
    try {
      const db = await getDb();
      await db.execute(
        "UPDATE core_media SET status = 'Completed', date_completed = datetime('now') WHERE id = $1",
        [id]
      );
      onMarkComplete();
    } finally {
      updating = null;
    }
  }
</script>

{#if entries.length === 0}
  <p class="empty">No entries yet. Add your first movie or book above.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Category</th>
        <th>Status</th>
        <th>Added</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each entries as entry (entry.id)}
        <tr>
          <td>{entry.title}</td>
          <td>{entry.media_category ?? '—'}</td>
          <td>{entry.status ?? '—'}</td>
          <td>{entry.date_added}</td>
          <td>
            {#if entry.status !== 'Completed'}
              <button
                onclick={() => markComplete(entry.id)}
                disabled={updating === entry.id}
              >
                {updating === entry.id ? '...' : 'Mark Complete'}
              </button>
            {:else}
              <span class="done">✓</span>
            {/if}
          </td>
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
  .done {
    color: #090;
    font-weight: bold;
  }
</style>
