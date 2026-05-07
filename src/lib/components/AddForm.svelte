<script lang="ts">
  import { getDb } from '$lib/db';
  import { CATEGORIES, FORM_STATUSES, CREATOR_LABEL } from '$lib/types';
  import { CATEGORY_DETAILS } from '$lib/schema';

  let { onEntryAdded }: { onEntryAdded: () => void } = $props();

  let title = $state('');
  let category = $state('Movie');
  let status = $state('Want to Consume');
  let year = $state('');
  let creator = $state('');
  let genre = $state('');
  let detailsState = $state<Record<string, string>>({});
  let saving = $state(false);
  let error = $state('');

  let creatorLabel = $derived(CREATOR_LABEL[category] ?? 'Creator');

  $effect(() => {
    category;
    detailsState = {};
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    saving = true;
    error = '';
    try {
      const db = await getDb();
      const detailsObj: Record<string, string | number> = {};
      for (const field of CATEGORY_DETAILS[category] ?? []) {
        const val = detailsState[field.key];
        if (val !== undefined && val !== '') {
          detailsObj[field.key] = field.type === 'number' ? Number(val) : val;
        }
      }
      const detailsJson = Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : null;
      await db.execute(
        `INSERT INTO core_media (title, media_category, status, year, creator, genre, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [trimmed, category, status, year ? Number(year) : null, creator.trim() || null, genre.trim() || null, detailsJson]
      );
      title = '';
      category = 'Movie';
      status = 'Want to Consume';
      year = '';
      creator = '';
      genre = '';
      detailsState = {};
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
  <div class="row secondary">
    <input
      type="number"
      bind:value={year}
      placeholder="Year"
      min="1000"
      max="2100"
      disabled={saving}
    />
    <input
      type="text"
      bind:value={creator}
      placeholder={creatorLabel}
      disabled={saving}
    />
    <input
      type="text"
      bind:value={genre}
      placeholder="Genre"
      disabled={saving}
    />
  </div>
  {#if CATEGORY_DETAILS[category]}
    <div class="row tertiary">
      {#each CATEGORY_DETAILS[category] as field}
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          bind:value={detailsState[field.key]}
          placeholder={field.label}
          disabled={saving}
        />
      {/each}
    </div>
  {/if}
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
  .secondary {
    margin-top: 0.4rem;
  }
  .tertiary {
    margin-top: 0.4rem;
  }
  input, select, button {
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
  }
  input {
    flex: 1;
    min-width: 160px;
  }
  input[type="number"] {
    max-width: 100px;
    flex: 0 1 auto;
  }
  .error {
    color: #c00;
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
  }
</style>
