<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { getDb, type MediaEntry } from '$lib/db';
  import { CATEGORIES, STATUSES, CREATOR_LABEL, statusDisplayLabel } from '$lib/types';
  import { CATEGORY_DETAILS } from '$lib/schema';

  let { entry, onClose, enabledCategories }: { entry: MediaEntry | null; onClose: () => void; enabledCategories: Set<string> } = $props();

  let editing = $derived(entry !== null);
  let saving = $state(false);
  let error = $state('');

  let title = $state('');
  let category = $state('');
  let status = $state('Want to Consume');
  let year = $state('');
  let creator = $state('');
  let genre = $state('');
  let detailsState = $state<Record<string, string>>({});
  let dateStarted = $state('');
  let dateCompleted = $state('');
  let imageUrl = $state('');
  let fileInput: HTMLInputElement | undefined = $state(undefined);
  let today = new Date().toISOString().substring(0, 10);

  const CATEGORY_ICON: Record<string, string> = {
    Movie: '🎬', Book: '📖', Show: '📺', Game: '🎮', Podcast: '🎙️',
  };

  let creatorLabel = $derived(CREATOR_LABEL[category] ?? 'Creator');
  let dialogTitle = $derived(
    editing
      ? `Edit ${CATEGORY_ICON[entry!.media_category ?? ''] ?? ''} ${entry!.title}`
      : 'Add Entry'
  );

  function resetForm(e: MediaEntry | null) {
    if (e) {
      title = e.title;
      category = e.media_category ?? CATEGORIES.find(c => enabledCategories.has(c)) ?? 'Movie';
      status = e.status ?? 'Want to Consume';
      year = e.year?.toString() ?? '';
      creator = e.creator ?? '';
      genre = e.genre ?? '';
      dateStarted = e.date_started ? e.date_started.substring(0, 10) : '';
      dateCompleted = e.date_completed ? e.date_completed.substring(0, 10) : '';
      imageUrl = e.image ?? '';
      resetDetails(e.details);
    } else {
      title = '';
      category = CATEGORIES.find(c => enabledCategories.has(c)) ?? 'Movie';
      status = 'Want to Consume';
      year = '';
      creator = '';
      genre = '';
      detailsState = {};
      dateStarted = '';
      dateCompleted = '';
      imageUrl = '';
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

  function handleCoverSelect() {
    const file = fileInput?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { imageUrl = reader.result as string; };
    reader.readAsDataURL(file);
    fileInput!.value = '';
  }

  function removeCover() { imageUrl = ''; }

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
          'UPDATE core_media SET title = $1, media_category = $2, status = $3, year = $4, creator = $5, genre = $6, details = $7, date_started = $8, date_completed = $9, image = $10 WHERE id = $11',
          [trimmed, category, status, year ? Number(year) : null, creator.trim() || null, genre.trim() || null, detailsJson, ds, dc, imageUrl || null, entry!.id]
        );
      } else {
        await db.execute(
          `INSERT INTO core_media (title, media_category, status, year, creator, genre, details, date_started, date_completed, image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [trimmed, category, status, year ? Number(year) : null, creator.trim() || null, genre.trim() || null, detailsJson, ds, dc, imageUrl || null]
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
<div class="overlay" transition:fade={{ duration: 120 }} onclick={handleOverlayClick}>
  <div class="dialog" transition:scale={{ start: 0.95, duration: 120 }} onclick={(e) => e.stopPropagation()}>
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
            {#each CATEGORIES.filter(c => enabledCategories.has(c)) as c}
              <option value={c}>{CATEGORY_ICON[c]} {c}</option>
            {/each}
          </select>
        </label>
        <label>
          Status
          <select bind:value={status} disabled={saving}>
            {#each STATUSES as s}
              <option value={s}>{statusDisplayLabel(s, category)}</option>
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

      <div class="row date-section">
        <label>
          Started on
          <input type="date" bind:value={dateStarted} max={today} disabled={saving} />
        </label>
        <label>
          Completed on
          <input type="date" bind:value={dateCompleted} max={today} disabled={saving} />
        </label>
      </div>

      <div class="cover-section">
        {#if imageUrl}
          <img src={imageUrl} alt="Cover" class="cover-preview" />
          <button type="button" onclick={removeCover} disabled={saving}>Remove Cover</button>
        {:else}
          <button type="button" onclick={() => fileInput?.click()} disabled={saving}>Add Cover</button>
        {/if}
        <input type="file" accept="image/*" bind:this={fileInput} hidden onchange={handleCoverSelect} />
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
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .dialog {
    background: #fff;
    border-radius: var(--radius);
    padding: 1.75rem;
    width: 90%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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
    color: var(--text-secondary);
  }
  .close:hover {
    color: var(--text);
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
    font-size: 0.78rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--text-secondary);
    flex: 1;
  }
  input, select {
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  input:focus, select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent);
  }
  .row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  fieldset {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.75rem;
  }
  legend {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .date-section {
    border-top: 1px solid var(--surface);
    padding-top: 0.75rem;
  }
  .error {
    color: var(--danger);
    margin: 0;
    font-size: 0.85rem;
  }
  .cover-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid var(--surface);
    padding-top: 0.75rem;
  }
  .cover-preview {
    width: 80px;
    height: 120px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid var(--border);
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    border-top: 1px solid var(--surface);
    padding-top: 0.75rem;
    margin-top: 0.25rem;
  }
  .actions button {
    padding: 0.4rem 1rem;
    font-size: 0.95rem;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid var(--border);
  }
  .actions button[type="submit"] {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
  }
  .actions button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .actions button[type="button"]:hover {
    background: var(--surface);
  }
</style>
