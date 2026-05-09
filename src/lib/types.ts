export const CATEGORIES = ['Movie', 'Book', 'Show', 'Game', 'Podcast'] as const;
export type Category = typeof CATEGORIES[number];

export const STATUSES = ['Want to Start', 'In Progress', 'Completed', 'On Hold', 'Dropped'] as const;
export type Status = typeof STATUSES[number];

export const FORM_STATUSES = STATUSES.filter(s => s !== 'Completed');

export const CREATOR_LABEL: Record<string, string> = {
  Movie: 'Director',
  Book: 'Author',
  Show: 'Creator',
  Game: 'Developer',
  Podcast: 'Host',
};

export function statusDisplayLabel(status: string, category?: string | null): string {
  if (status !== 'Want to Start' || !category) return status;
  const map: Record<string, string> = {
    Movie: 'Want to Watch',
    Show: 'Want to Watch',
    Book: 'Want to Read',
    Game: 'Want to Play',
    Podcast: 'Want to Listen',
  };
  return map[category] ?? status;
}
