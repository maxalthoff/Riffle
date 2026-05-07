import type Database from '@tauri-apps/plugin-sql';

const seeds = [
  { title: 'The Matrix', category: 'Movie', status: 'Completed', daysAgo: 10, year: 1999, creator: 'The Wachowskis', genre: 'Sci-Fi', details: { runtime: 136 } },
  { title: 'Dune: Part Two', category: 'Movie', status: 'Want to Consume', daysAgo: 2, year: 2024, creator: 'Denis Villeneuve', genre: 'Sci-Fi', details: { runtime: 166 } },
  { title: 'Sapiens', category: 'Book', status: 'In Progress', daysAgo: 5, year: 2011, creator: 'Yuval Noah Harari', genre: 'History', details: { pages: 498 } },
  { title: '1984', category: 'Book', status: 'Want to Consume', daysAgo: 1, year: 1949, creator: 'George Orwell', genre: 'Dystopian', details: { pages: 328 } },
  { title: 'Succession', category: 'Show', status: 'In Progress', daysAgo: 7, year: 2018, creator: 'Jesse Armstrong', genre: 'Drama', details: { seasons: 4 } },
  { title: 'The Boys', category: 'Show', status: 'Completed', daysAgo: 14, year: 2019, creator: 'Eric Kripke', genre: 'Superhero', details: { seasons: 4 } },
  { title: 'Elden Ring', category: 'Game', status: 'On Hold', daysAgo: 20, year: 2022, creator: 'FromSoftware', genre: 'Action RPG', details: { platform: 'PS5' } },
  { title: 'The Last of Us', category: 'Game', status: 'Completed', daysAgo: 30, year: 2013, creator: 'Naughty Dog', genre: 'Action-Adventure', details: { platform: 'PS3' } },
  { title: 'Serial', category: 'Podcast', status: 'Completed', daysAgo: 60, creator: 'Sarah Koenig', genre: 'True Crime', details: { episodes: 12 } },
  { title: 'How I Built This', category: 'Podcast', status: 'In Progress', daysAgo: 3, creator: 'Guy Raz', genre: 'Business', details: { episodes: 200 } },
];

export async function seedDatabase(db: Database) {
  const row = await db.select<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM core_media'
  );
  if (row[0].count > 0) return;

  for (const s of seeds) {
    await db.execute(
      `INSERT INTO core_media (title, media_category, status, date_added, year, creator, genre, details)
       VALUES ($1, $2, $3, datetime('now', $4), $5, $6, $7, $8)`,
      [s.title, s.category, s.status, `-${s.daysAgo} days`, s.year ?? null, s.creator ?? null, s.genre ?? null, JSON.stringify(s.details)]
    );
  }
}
