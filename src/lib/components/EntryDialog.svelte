<script lang="ts">
  import { onMount } from 'svelte';
  import { getDb, type MediaEntry } from '$lib/db';
  import { CATEGORIES, STATUSES, CREATOR_LABEL } from '$lib/types';
  import { CATEGORY_DETAILS } from '$lib/schema';

  let { entry, onClose }: { entry: MediaEntry | null; onClose: () => void } = $props();

  let editing = $derived(entry !== null);
  let saving = $state(false);
  let error = $state('');

  let title = $state('');
  let category = $state('Movie');
  let status = $state('Want to Consume');
  let year = $state('');
  let creator = $state('');
  let genre = $state('');
  let detailsState = $state<Record<string, string>>({});
  let dateStarted = $state('');
  let dateCompleted = $state('');
  let today = new Date().toISOString().substring(0, 10);

  let creatorLabel = $derived(CREATOR_LABEL[category] ?? 'Creator');
  let dialogTitle = $derived(editing ? `Edit ${entry!.title}` : 'Add Entry');

  function resetForm(e: MediaEntry | null) {
    if (e) {
      title = e.title;
      category = e.media_category ?? 'Movie';
      status = e.status ?? 'Want to Consume';
      year = e.year?.toString() ?? '';
      creator = e.creator ?? '';
      genre = e.genre ?? '';
      dateStarted = e.date_started ? e.date_started.substring(0, 10) : '';
      dateCompleted = e.date_completed ? e.date_completed.substring(0, 10) : '';
      resetDetails(e.details);
    } else {
      title = '';
      category = 'Movie';
      status = 'Want to Consume';
      year = '';
      creator = '';
      genre = '';
      detailsState = {};
      dateStarted = '';
      dateCompleted = '';
    }
    error = '';
  }

  function resetDetails(raw: string | null) {
    detailsState = {};
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      for (const field of CATEGORY_DETAILS[category] ?? []) {
        const val = parsed[field.key];
        if (val !== undefined) detailsState[field.key] = String(val);
      }
    } catch { /* ignore */ }
  }

  function handleCategoryChange() {
    detailsState = {};
  }

  onMount(() => { resetForm(entry); });

  function handleOverlayClick() {
    if (!saving) onClose();
  }

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
      const ds = dateStarted || null;
      const dc = dateCompleted || null;

      if (editing) {
        await db.execute(
          'UPDATE core_media SET title = $1, media_category = $2, status = $3, year = $4, creator = $5, genre = $6, details = $7, date_started = $8, date_completed = $9 WHERE id = $10',
          [trimmed, category, status, year ? Number(year) : null, creator.trim() || null, genre.trim() || null, detailsJson, ds, dc, entry!.id]
        );
      } else {
        await db.execute(
          `INSERT INTO core_media (title, media_category, status, year, creator, genre, details, date_started, date_completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [trimmed, category, status, year ? Number(year) : null, creator.trim() || null, genre.trim() || null, detailsJson, ds, dc]
        );
      }
      onClose();
    } catch (e) {
      error = String(e);
    } finally {
      saving = false;
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={handleOverlayClick}>
  <div class="dialog" onclick={(e) => e.stopPropagation()}>
    <div class="header">
      <h2>{dialogTitle}</h2>
      <button class="close" onclick={onClose} disabled={saving}>✕</button>
    </div>

    <form onsubmit={handleSubmit}>
      <label>
        Title
        <input type="text" bind:value={title} required disabled={saving} />
      </label>

      <div class="row">
        <label>
          Category
          <select bind:value={category} onchange={handleCategoryChange} disabled={saving}>
            {#each CATEGORIES as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </label>
        <label>
          Status
          <select bind:value={status} disabled={saving}>
            {#each STATUSES as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="row">
        <label>
          Year
          <input type="number" bind:value={year} placeholder="Year" min="1000" max="2100" disabled={saving} />
        </label>
        <label>
          {creatorLabel}
          <input type="text" bind:value={creator} disabled={saving} />
        </label>
        <label>
          Genre
          <input type="text" bind:value={genre} disabled={saving} />
        </label>
      </div>

      <div class="row">
        <label>
          Started on
          <input type="date" bind:value={dateStarted} max={today} disabled={saving} />
        </label>
        <label>
          Completed on
          <input type="date" bind:value={dateCompleted} max={today} disabled={saving} />
        </label>
      </div>

      {#if CATEGORY_DETAILS[category]}
        <fieldset>
          <legend>{category} Details</legend>
          <div class="row">
            {#each CATEGORY_DETAILS[category] as field}
              <label>
                {field.label}
                {#if field.type === 'select'}
                  <select bind:value={detailsState[field.key]} disabled={saving}>
                    <option value="">—</option>
                    {#each field.options ?? [] as opt}
                      <option value={opt}>{opt}</option>
                    {/each}
                  </select>
                {:else}
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    bind:value={detailsState[field.key]}
                    disabled={saving}
                  />
                {/if}
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <div class="actions">
        <button type="button" onclick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .dialog {
    background: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .header h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  .close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    color: #666;
  }
  .close:hover {
    color: #000;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: #333;
    flex: 1;
  }
  input, select {
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  input:focus, select:focus {
    outline: none;
    border-color: #396cd8;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  fieldset {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 0.75rem;
  }
  legend {
    font-size: 0.85rem;
    font-weight: 600;
    color: #555;
  }
  .error {
    color: #c00;
    margin: 0;
    font-size: 0.85rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
  .actions button {
    padding: 0.4rem 1rem;
    font-size: 0.95rem;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #ccc;
    background: #fff;
  }
  .actions button[type="submit"] {
    background: #396cd8;
    color: #fff;
    border-color: #396cd8;
  }
  .actions button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .actions button[type="button"]:hover {
    background: #f0f0f0;
  }
</style>
