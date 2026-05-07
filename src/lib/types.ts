export const CATEGORIES = ['Movie', 'Book', 'Show', 'Game', 'Podcast'] as const;
export type Category = typeof CATEGORIES[number];

export const STATUSES = ['Want to Consume', 'In Progress', 'Completed', 'On Hold', 'Dropped'] as const;
export type Status = typeof STATUSES[number];

export const FORM_STATUSES = STATUSES.filter(s => s !== 'Completed');

export const CREATOR_LABEL: Record<string, string> = {
  Movie: 'Director',
  Book: 'Author',
  Show: 'Creator',
  Game: 'Developer',
  Podcast: 'Host',
};
