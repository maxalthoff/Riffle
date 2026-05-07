import type Database from '@tauri-apps/plugin-sql';

const seeds = [
  { title: 'The Matrix', category: 'Movie', status: 'Completed', daysAgo: 10 },
  { title: 'Dune: Part Two', category: 'Movie', status: 'Want to Consume', daysAgo: 2 },
  { title: 'Sapiens', category: 'Book', status: 'In Progress', daysAgo: 5 },
  { title: '1984', category: 'Book', status: 'Want to Consume', daysAgo: 1 },
  { title: 'Succession', category: 'Show', status: 'In Progress', daysAgo: 7 },
  { title: 'The Boys', category: 'Show', status: 'Completed', daysAgo: 14 },
  { title: 'Elden Ring', category: 'Game', status: 'On Hold', daysAgo: 20 },
  { title: 'The Last of Us', category: 'Game', status: 'Completed', daysAgo: 30 },
  { title: 'Serial', category: 'Podcast', status: 'Completed', daysAgo: 60 },
  { title: 'How I Built This', category: 'Podcast', status: 'In Progress', daysAgo: 3 },
];

export async function seedDatabase(db: Database) {
  const row = await db.select<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM core_media'
  );
  if (row[0].count > 0) return;

  for (const s of seeds) {
    await db.execute(
      `INSERT INTO core_media (title, media_category, status, date_added)
       VALUES ($1, $2, $3, datetime('now', $4))`,
      [s.title, s.category, s.status, `-${s.daysAgo} days`]
    );
  }
}
