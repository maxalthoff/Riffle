<script lang="ts">
  import { getDb } from '$lib/db';
  import { CATEGORIES, FORM_STATUSES } from '$lib/types';

  let { onEntryAdded }: { onEntryAdded: () => void } = $props();

  let title = $state('');
  let category = $state('Movie');
  let status = $state('Want to Consume');
  let saving = $state(false);
  let error = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    saving = true;
    error = '';
    try {
      const db = await getDb();
      await db.execute(
        'INSERT INTO core_media (title, media_category, status) VALUES ($1, $2, $3)',
        [trimmed, category, status]
      );
      title = '';
      category = 'Movie';
      status = 'Want to Consume';
      onEntryAdded();
    } catch (e) {
      error = String(e);
    } finally {
      saving = false;
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <div class="row">
    <input
      type="text"
      bind:value={title}
      placeholder="Title"
      required
      disabled={saving}
    />
    <select bind:value={category} disabled={saving}>
      {#each CATEGORIES as c}
        <option value={c}>{c}</option>
      {/each}
    </select>
    <select bind:value={status} disabled={saving}>
      {#each FORM_STATUSES as s}
        <option value={s}>{s}</option>
      {/each}
    </select>
    <button type="submit" disabled={saving}>
      {saving ? 'Adding...' : 'Add Entry'}
    </button>
  </div>
  {#if error}
    <p class="error">{error}</p>
  {/if}
</form>

<style>
  .row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  input, select, button {
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
  }
  input {
    flex: 1;
    min-width: 160px;
  }
  .error {
    color: #c00;
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
  }
</style>
