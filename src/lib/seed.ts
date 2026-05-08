import type Database from '@tauri-apps/plugin-sql';

const seeds = [
  { title: 'The Matrix', category: 'Movie', status: 'Completed', daysAgo: 10, year: 1999, creator: 'The Wachowskis', genre: 'Sci-Fi', details: { runtime: 136, language: 'English', country: 'USA' }, dateStarted: '2026-03-15', dateCompleted: '2026-03-28' },
  { title: 'Dune: Part Two', category: 'Movie', status: 'Want to Consume', daysAgo: 2, year: 2024, creator: 'Denis Villeneuve', genre: 'Sci-Fi', details: { runtime: 166, language: 'English', country: 'USA' } },
  { title: 'Sapiens', category: 'Book', status: 'In Progress', daysAgo: 5, year: 2011, creator: 'Yuval Noah Harari', genre: 'History', details: { pages: 498, language: 'English', format: 'Paperback' }, dateStarted: '2026-04-01' },
  { title: '1984', category: 'Book', status: 'Want to Consume', daysAgo: 1, year: 1949, creator: 'George Orwell', genre: 'Dystopian', details: { pages: 328, language: 'English', format: 'Paperback' } },
  { title: 'Succession', category: 'Show', status: 'In Progress', daysAgo: 7, year: 2018, creator: 'Jesse Armstrong', genre: 'Drama', details: { seasons: 4, network: 'HBO', status: 'Finished' }, dateStarted: '2026-04-20' },
  { title: 'The Boys', category: 'Show', status: 'Completed', daysAgo: 14, year: 2019, creator: 'Eric Kripke', genre: 'Superhero', details: { seasons: 4, network: 'Prime Video', status: 'Ongoing' } },
  { title: 'Elden Ring', category: 'Game', status: 'On Hold', daysAgo: 20, year: 2022, creator: 'FromSoftware', genre: 'Action RPG', details: { platform: 'PS5', publisher: 'Bandai Namco' } },
  { title: 'The Last of Us', category: 'Game', status: 'Completed', daysAgo: 30, year: 2013, creator: 'Naughty Dog', genre: 'Action-Adventure', details: { platform: 'PS3', publisher: 'Sony' } },
  { title: 'Serial', category: 'Podcast', status: 'Completed', daysAgo: 60, creator: 'Sarah Koenig', genre: 'True Crime', details: { episodes: 12, frequency: 'Weekly', website: 'https://serialpodcast.org' } },
  { title: 'How I Built This', category: 'Podcast', status: 'In Progress', daysAgo: 3, creator: 'Guy Raz', genre: 'Business', details: { episodes: 200, frequency: 'Weekly', website: 'https://npr.org/howibuiltthis' } },
];

export async function seedDatabase(db: Database) {
  const row = await db.select<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM core_media'
  );
  if (row[0].count > 0) return;

  for (const s of seeds) {
    await db.execute(
      `INSERT INTO core_media (title, media_category, status, date_added, year, creator, genre, details, date_started, date_completed)
       VALUES ($1, $2, $3, datetime('now', $4), $5, $6, $7, $8, $9, $10)`,
      [s.title, s.category, s.status, `-${s.daysAgo} days`, s.year ?? null, s.creator ?? null, s.genre ?? null, JSON.stringify(s.details), s.dateStarted ?? null, s.dateCompleted ?? null]
    );
  }
}
