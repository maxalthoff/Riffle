export const CATEGORIES = ['Movie', 'Book', 'Show', 'Game', 'Podcast', 'Comic'] as const;
export type Category = typeof CATEGORIES[number];

export const STATUSES = ['Want to Start', 'In Progress', 'Completed', 'On Hold', 'Dropped'] as const;
export type Status = typeof STATUSES[number];

export const FORM_STATUSES = STATUSES.filter(s => s !== 'Completed');

export const CREATOR_LABEL: Record<string, string> = {
  Movie: 'Director',
  Book: 'Author',
  Show: 'Creator',
  Game: 'Developer',
  Podcast: 'Host(s)',
  Comic: 'Writer/Artist',
};

export const CURRENT_LABEL: Record<string, string> = {
  Show: 'Episode',
  Comic: 'Issue',
  Podcast: 'Episode',
};

export function statusDisplayLabel(status: string, category?: string | null): string {
  if (status !== 'Want to Start' || !category) return status;
  const map: Record<string, string> = {
    Movie: 'Want to Watch',
    Show: 'Want to Watch',
    Book: 'Want to Read',
    Game: 'Want to Play',
    Podcast: 'Want to Listen',
    Comic: 'Want to Read',
  };
  return map[category] ?? status;
}
