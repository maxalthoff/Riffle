export interface DetailField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  fromEntry?: boolean;
}

export const CATEGORY_DETAILS: Record<string, DetailField[]> = {
  Movie: [
    { key: 'runtime',  label: 'Runtime (min)', type: 'number' },
    { key: 'creator',  label: 'Director',      type: 'text', fromEntry: true },
    { key: 'country',  label: 'Country',       type: 'text'   },
  ],
  Book: [
    { key: 'pages',    label: 'Pages',   type: 'number' },
    { key: 'creator',  label: 'Author',  type: 'text', fromEntry: true },
    { key: 'format',   label: 'Format',   type: 'select', options: ['Hardcover', 'Paperback', 'Audiobook', 'Ebook'] },
  ],
  Show: [
    { key: 'seasons',  label: 'Seasons',          type: 'number' },
    { key: 'network',  label: 'Network/Streamer', type: 'text'   },
    { key: 'status',   label: 'Status',           type: 'select', options: ['Ongoing', 'Cancelled', 'Finished'] },
  ],
  Game: [
    { key: 'platform',  label: 'Platform',  type: 'text' },
    { key: 'creator',   label: 'Developer', type: 'text', fromEntry: true },
  ],
  Podcast: [
    { key: 'episodes',  label: 'Episodes',  type: 'number' },
    { key: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Seasonal', 'Irregular'] },
    { key: 'website',   label: 'Website',   type: 'text'   },
  ],
};

export function parseDetails(raw: string | null): Record<string, string | number> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
