export const CATEGORIES = ['Movie', 'Book'] as const;
export type Category = typeof CATEGORIES[number];

export const STATUSES = ['Want to Consume', 'In Progress', 'Completed', 'On Hold', 'Dropped'] as const;
export type Status = typeof STATUSES[number];

export const FORM_STATUSES = STATUSES.filter(s => s !== 'Completed');
