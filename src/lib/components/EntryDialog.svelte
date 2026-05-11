<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { getDb, type MediaEntry } from '$lib/db';
  import { CATEGORIES, STATUSES, CREATOR_LABEL, CURRENT_LABEL, statusDisplayLabel } from '$lib/types';
  import { CATEGORY_DETAILS } from '$lib/schema';
  import Icon from '$lib/components/Icon.svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { invoke } from '@tauri-apps/api/core';

  let { entry, onClose, enabledCategories }: { entry: MediaEntry | null; onClose: () => void; enabledCategories: Set<string> } = $props();

  let editing = $derived(entry !== null);
  let saving = $state(false);
  let error = $state('');

  let title = $state('');
  let category = $state('');
  let status = $state('Want to Start');
  let year = $state('');
  let creator = $state('');
  let detailsState = $state<Record<string, string>>({});
  let dateStarted = $state('');
  let dateCompleted = $state('');
  let imageUrl = $state('');
  let fileInput: HTMLInputElement | undefined = $state(undefined);
  let tags = $state<string[]>([]);
  let tagInput = $state('');
  let allTags = $state<string[]>([]);
  let current = $state('');
  let isDragging = $state(false);
  let notes = $state('');
  let today = new Date().toISOString().substring(0, 10);

  let creatorLabel = $derived(CREATOR_LABEL[category] ?? 'Creator');
  let currentLabel = $derived(CURRENT_LABEL[category] ?? '');

  function resetForm(e: MediaEntry | null) {
    if (e) {
      title = e.title;
      category = e.media_category ?? CATEGORIES.find(c => enabledCategories.has(c)) ?? 'Movie';
      status = e.status ?? 'Want to Start';
      year = e.year?.toString() ?? '';
      creator = e.creator ?? '';
      dateStarted = e.date_started ? e.date_started.substring(0, 10) : '';
      dateCompleted = e.date_completed ? e.date_completed.substring(0, 10) : '';
      imageUrl = e.image ?? '';
      tags = parseTags(e.tags);
      current = e.current?.toString() ?? '';
      notes = e.user_review ?? '';
      resetDetails(e.details);
    } else {
      title = '';
      category = CATEGORIES.find(c => enabledCategories.has(c)) ?? 'Movie';
      status = 'Want to Start';
      year = '';
      creator = '';
      detailsState = {};
      dateStarted = '';
      dateCompleted = '';
      imageUrl = '';
      tags = [];
      current = '';
      notes = '';
    }
    error = '';
    loadAllTags();
  }

  function parseTags(raw: string | null): string[] {
    if (!raw) return [];
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }

  async function loadAllTags() {
    try {
      const db = await getDb();
      const rows = await db.select<{ tags: string | null }[]>('SELECT tags FROM core_media WHERE tags IS NOT NULL');
      const all: string[] = [];
      for (const r of rows) {
        const t = parseTags(r.tags);
        for (const tag of t) {
          if (!all.includes(tag)) all.push(tag);
        }
      }
      allTags = all.sort();
    } catch { /* silent */ }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    tags = [...tags, t];
    tagInput = '';
  }

  function removeTag(t: string) {
    tags = tags.filter(x => x !== t);
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

  async function readFileAsDataURL(path: string): Promise<string> {
    return invoke<string>('read_image_as_data_url', { path });
  }

  onMount(() => {
    resetForm(entry);
    let unlisten: (() => void) | undefined;
    getCurrentWindow().onDragDropEvent(async (event) => {
      if (event.payload.type === 'over') {
        isDragging = true;
      } else if (event.payload.type === 'leave') {
        isDragging = false;
      } else if (event.payload.type === 'drop') {
        isDragging = false;
        const path = event.payload.paths?.[0];
        if (!path) return;
        const ext = path.split('.').pop()?.toLowerCase() ?? '';
        if (!['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return;
        imageUrl = await readFileAsDataURL(path);
      }
    }).then(fn => { unlisten = fn; });
    return () => { unlisten?.(); };
  });

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
          'UPDATE core_media SET title = $1, media_category = $2, status = $3, year = $4, creator = $5, details = $6, date_started = $7, date_completed = $8, image = $9, tags = $10, current = $11, user_review = $12 WHERE id = $13',
          [trimmed, category, status, year ? Number(year) : null, creator.trim() || null, detailsJson, ds, dc, imageUrl || null, tags.length > 0 ? JSON.stringify(tags) : null, current ? Number(current) : null, notes.trim() || null, entry!.id]
        );
      } else {
        await db.execute(
          `INSERT INTO core_media (title, media_category, status, year, creator, details, date_started, date_completed, image, tags, current, user_review)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [trimmed, category, status, year ? Number(year) : null, creator.trim() || null, detailsJson, ds, dc, imageUrl || null, tags.length > 0 ? JSON.stringify(tags) : null, current ? Number(current) : null, notes.trim() || null]
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
      <h2>
        {editing ? `Edit ` : 'Add Entry'}
        {#if editing}
          <Icon name={entry!.media_category?.toLowerCase()} />
          {entry!.title}
        {/if}
      </h2>
      <button class="close" onclick={onClose} disabled={saving}>✕</button>
    </div>

    <form onsubmit={handleSubmit}>
      <label>
        Title
        <input type="text" bind:value={title} required disabled={saving} />
      </label>

      <div class="cover-section">
        {#if imageUrl}
          <div class="cover-dropzone has-image"
            class:dragover={isDragging}
          >
            <img src={imageUrl} alt="Cover" class="cover-preview" />
            <span class="cover-status">Cover added</span>
            <button type="button" class="cover-remove" onclick={removeCover} disabled={saving}>✕</button>
          </div>
        {:else}
          <div
            class="cover-dropzone"
            class:dragover={isDragging}
            onclick={() => fileInput?.click()}
          >
            <span class="cover-icon">            <Icon name="image" size={24} /></span>
            <span class="cover-label">Add Cover</span>
          </div>
        {/if}
        <input type="file" accept="image/*" bind:this={fileInput} hidden onchange={handleCoverSelect} />
      </div>

      <div class="row">
        <label>
          Category
          <select bind:value={category} onchange={handleCategoryChange} disabled={saving}>
            {#each CATEGORIES.filter(c => enabledCategories.has(c)) as c}
              <option value={c}>{c}</option>
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
        {#if currentLabel}
          <label>
            Current {currentLabel}
            <input type="number" bind:value={current} placeholder={currentLabel} min="0" disabled={saving} />
          </label>
        {/if}
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

      {#if (CATEGORY_DETAILS[category] ?? []).filter(f => !f.fromEntry).length > 0}
        <fieldset>
          <legend>{category} Details</legend>
          <div class="row">
            {#each (CATEGORY_DETAILS[category] ?? []).filter(f => !f.fromEntry) as field}
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

      <div class="tags-section">
        <label for="tag-input">Tags</label>
        <div class="tag-input-row">
          <input
            id="tag-input"
            type="text"
            bind:value={tagInput}
            placeholder="Type and press Enter to add"
            list="tag-suggestions"
            onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            disabled={saving}
          />
          <datalist id="tag-suggestions">
            {#each allTags.filter(t => !tags.includes(t)) as tag}
              <option value={tag}></option>
            {/each}
          </datalist>
        </div>
        {#if tags.length > 0}
          <div class="tag-chips">
            {#each tags as tag}
              <span class="tag-chip">
                {tag}
                <button type="button" class="tag-remove" onclick={() => removeTag(tag)} disabled={saving}>×</button>
              </span>
            {/each}
          </div>
        {/if}
      </div>

      <div class="notes-section">
        <label for="notes">Notes</label>
        <textarea id="notes" bind:value={notes} disabled={saving} rows="3" placeholder="Any notes about this entry..."></textarea>
      </div>

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
    background: var(--overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .dialog {
    background: var(--card);
    border-radius: var(--radius);
    padding: 1.75rem;
    width: 90%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    color: var(--text);
    font-family: var(--font);
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
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    color: var(--text-secondary);
    border-radius: 4px;
  }
  .close:hover {
    color: var(--text);
    background: var(--surface);
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
    border: 1px solid var(--input-border);
    border-radius: var(--radius);
    background: var(--input-bg);
    color: var(--text);
  }
  input::placeholder {
    color: var(--text-secondary);
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
    border-radius: var(--radius);
    padding: 0.75rem;
    background: var(--surface);
  }
  legend {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .date-section {
    border-top: 1px solid var(--border);
    padding-top: 0.75rem;
  }
  .error {
    color: var(--danger);
    margin: 0;
    font-size: 0.85rem;
  }
  .notes-section {
    border-top: 1px solid var(--border);
    padding-top: 0.75rem;
  }
  .notes-section textarea {
    width: 100%;
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
    border: 1px solid var(--input-border);
    border-radius: var(--radius);
    background: var(--input-bg);
    color: var(--text);
    resize: vertical;
    font-family: var(--font);
    box-sizing: border-box;
  }
  .notes-section textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent);
  }
  .tags-section {
    border-top: 1px solid var(--border);
    padding-top: 0.75rem;
  }
  .tags-section label {
    margin-bottom: 0.25rem;
  }
  .tag-input-row {
    display: flex;
    gap: 0.4rem;
  }
  .tag-input-row input {
    flex: 1;
  }
  .tag-chips {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }
  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    background: var(--surface);
    color: var(--text);
    padding: 2px 8px;
    border-radius: 4px;
  }
  .tag-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
    line-height: 1;
    color: var(--text-secondary);
  }
  .tag-remove:hover {
    color: var(--danger);
  }
  .cover-section {
    margin-bottom: 0.25rem;
  }
  .cover-dropzone {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
    text-align: center;
    cursor: pointer;
    color: var(--text-secondary);
    transition: border-color 0.15s, background 0.15s;
    user-select: none;
  }
  .cover-dropzone:hover {
    border-color: var(--primary);
    background: var(--surface);
  }
  .cover-dropzone.dragover {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 8%, transparent);
  }
  .cover-dropzone.has-image {
    border: 2px solid var(--border);
    padding: 0.5rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-align: left;
  }
  .cover-icon {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  .cover-label {
    font-size: 0.85rem;
    font-weight: 500;
  }
  .cover-preview {
    width: 48px;
    height: 64px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid var(--border);
    flex-shrink: 0;
  }
  .cover-status {
    font-size: 0.85rem;
    color: var(--text-secondary);
    flex: 1;
  }
  .cover-remove {
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.2rem 0.45rem;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1;
  }
  .cover-remove:hover {
    color: var(--danger);
    border-color: var(--danger);
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    border-top: 1px solid var(--border);
    padding-top: 0.75rem;
    margin-top: 0.25rem;
  }
  .actions button {
    padding: 0.4rem 1rem;
    font-size: 0.95rem;
    border-radius: var(--radius);
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    transition: background 0.1s;
  }
  .actions button:hover {
    background: var(--surface);
  }
  .actions button[type="submit"] {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
  }
  .actions button[type="submit"]:hover {
    background: var(--primary-hover);
  }
  .actions button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
