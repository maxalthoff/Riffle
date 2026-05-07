export interface DetailField {
  key: string;
  label: string;
  type: 'text' | 'number';
}

export const CATEGORY_DETAILS: Record<string, DetailField[]> = {
  Movie:   [{ key: 'runtime',  label: 'Runtime (min)', type: 'number' }],
  Book:    [{ key: 'pages',    label: 'Pages',         type: 'number' }],
  Show:    [{ key: 'seasons',  label: 'Seasons',       type: 'number' }],
  Game:    [{ key: 'platform', label: 'Platform',      type: 'text'   }],
  Podcast: [{ key: 'episodes', label: 'Episodes',      type: 'number' }],
};

export function parseDetails(raw: string | null): Record<string, string | number> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
