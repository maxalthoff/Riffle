import type Database from '@tauri-apps/plugin-sql';

const seeds = [
  { title: 'The Matrix', category: 'Movie', status: 'Completed', daysAgo: 10, year: 1999, creator: 'The Wachowskis', genre: 'Sci-Fi', details: { runtime: 136, language: 'English', country: 'USA' }, dateStarted: '2026-03-15', dateCompleted: '2026-03-28' },
  { title: 'Dune: Part Two', category: 'Movie', status: 'Want to Start', daysAgo: 2, year: 2024, creator: 'Denis Villeneuve', genre: 'Sci-Fi', details: { runtime: 166, language: 'English', country: 'USA' } },
  { title: 'Everything Everywhere All at Once', category: 'Movie', status: 'Completed', daysAgo: 25, year: 2022, creator: 'Daniel Kwan & Daniel Scheinert', genre: 'Sci-Fi', details: { runtime: 139, language: 'English', country: 'USA' }, dateStarted: '2026-04-01', dateCompleted: '2026-04-03' },
  { title: 'Back to the Future Part II', category: 'Movie', status: 'Want to Start', daysAgo: 1, year: 1989, creator: 'Robert Zemeckis', genre: 'Adventure', details: { runtime: 108, language: 'English', country: 'USA' } },
  { title: 'The Shawshank Redemption', category: 'Movie', status: 'In Progress', daysAgo: 4, year: 1994, creator: 'Frank Darabont', genre: 'Drama', details: { runtime: 142, language: 'English', country: 'USA' }, dateStarted: '2026-05-03' },
  { title: 'Interstellar', category: 'Movie', status: 'Completed', daysAgo: 40, year: 2014, creator: 'Christopher Nolan', genre: 'Sci-Fi', details: { runtime: 169, language: 'English', country: 'USA' }, dateStarted: '2026-03-20', dateCompleted: '2026-03-22' },
  { title: 'Sapiens: A Brief History of Humankind', category: 'Book', status: 'In Progress', daysAgo: 5, year: 2011, creator: 'Yuval Noah Harari', genre: 'History', details: { pages: 498, language: 'English', format: 'Paperback' }, dateStarted: '2026-04-01' },
  { title: '1984', category: 'Book', status: 'Want to Start', daysAgo: 1, year: 1949, creator: 'George Orwell', genre: 'Dystopian', details: { pages: 328, language: 'English', format: 'Paperback' } },
  { title: 'Thinking, Fast and Slow', category: 'Book', status: 'Completed', daysAgo: 35, year: 2011, creator: 'Daniel Kahneman', genre: 'Psychology', details: { pages: 512, language: 'English', format: 'Hardcover' }, dateStarted: '2026-03-25', dateCompleted: '2026-04-10' },
  { title: 'The Hitchhiker\'s Guide to the Galaxy', category: 'Book', status: 'Dropped', daysAgo: 50, year: 1979, creator: 'Douglas Adams', genre: 'Comedy', details: { pages: 224, language: 'English', format: 'Paperback' } },
  { title: 'The Name of the Wind', category: 'Book', status: 'In Progress', daysAgo: 8, year: 2007, creator: 'Patrick Rothfuss', genre: 'Fantasy', details: { pages: 662, language: 'English', format: 'Paperback' }, dateStarted: '2026-04-28' },
  { title: 'The Art of War', category: 'Book', status: 'Completed', daysAgo: 500, year: -500, creator: 'Sun Tzu', genre: 'Philosophy', details: { pages: 68, language: 'English', format: 'Paperback' }, dateStarted: '2024-12-01', dateCompleted: '2024-12-15' },
  { title: 'Succession', category: 'Show', status: 'In Progress', daysAgo: 7, year: 2018, creator: 'Jesse Armstrong', genre: 'Drama', details: { seasons: 4, network: 'HBO', status: 'Finished' }, dateStarted: '2026-04-20' },
  { title: 'The Boys', category: 'Show', status: 'Completed', daysAgo: 14, year: 2019, creator: 'Eric Kripke', genre: 'Superhero', details: { seasons: 4, network: 'Prime Video', status: 'Ongoing' }, dateStarted: '2026-04-05', dateCompleted: '2026-04-18' },
  { title: 'Stranger Things', category: 'Show', status: 'On Hold', daysAgo: 45, year: 2016, creator: 'The Duffer Brothers', genre: 'Horror', details: { seasons: 4, network: 'Netflix', status: 'Ongoing' }, dateStarted: '2026-03-10' },
  { title: 'The Crown', category: 'Show', status: 'Want to Start', daysAgo: 3, year: 2016, creator: 'Peter Morgan', genre: 'Drama', details: { seasons: 6, network: 'Netflix', status: 'Finished' } },
  { title: 'Better Call Saul', category: 'Show', status: 'Completed', daysAgo: 300, year: 2015, creator: 'Vince Gilligan & Peter Gould', genre: 'Drama', details: { seasons: 6, network: 'AMC', status: 'Finished' }, dateStarted: '2025-07-01', dateCompleted: '2025-08-20' },
  { title: 'Breaking Bad', category: 'Show', status: 'Completed', daysAgo: 400, year: 2008, creator: 'Vince Gilligan', genre: 'Drama', details: { seasons: 5, network: 'AMC', status: 'Finished' }, dateStarted: '2025-03-01', dateCompleted: '2025-04-15' },
  { title: 'Elden Ring', category: 'Game', status: 'On Hold', daysAgo: 20, year: 2022, creator: 'FromSoftware', genre: 'Action RPG', details: { platform: 'PS5', publisher: 'Bandai Namco' }, dateStarted: '2026-04-10' },
  { title: 'The Last of Us', category: 'Game', status: 'Completed', daysAgo: 180, year: 2013, creator: 'Naughty Dog', genre: 'Action-Adventure', details: { platform: 'PS3', publisher: 'Sony' }, dateStarted: '2025-11-01', dateCompleted: '2025-11-15' },
  { title: 'Baldur\'s Gate 3', category: 'Game', status: 'In Progress', daysAgo: 6, year: 2023, creator: 'Larian Studios', genre: 'RPG', details: { platform: 'PC', publisher: 'Larian Studios' }, dateStarted: '2026-04-30' },
  { title: 'Red Dead Redemption 2', category: 'Game', status: 'On Hold', daysAgo: 70, year: 2018, creator: 'Rockstar Studios', genre: 'Action-Adventure', details: { platform: 'Xbox', publisher: 'Rockstar Games' }, dateStarted: '2026-02-20' },
  { title: 'Celeste', category: 'Game', status: 'Completed', daysAgo: 60, year: 2018, creator: 'Maddy Makes Games', genre: 'Platformer', details: { platform: 'Switch', publisher: 'Maddy Makes Games' }, dateStarted: '2026-03-01', dateCompleted: '2026-03-10' },
  { title: 'Hollow Knight', category: 'Game', status: 'Want to Start', daysAgo: 1, year: 2017, creator: 'Team Cherry', genre: 'Metroidvania', details: { platform: 'Switch', publisher: 'Team Cherry' } },
  { title: 'Serial', category: 'Podcast', status: 'Completed', daysAgo: 60, creator: 'Sarah Koenig', genre: 'True Crime', details: { episodes: 12, frequency: 'Weekly', website: 'https://serialpodcast.org' }, dateStarted: '2026-02-01', dateCompleted: '2026-04-01' },
  { title: 'How I Built This', category: 'Podcast', status: 'In Progress', daysAgo: 3, creator: 'Guy Raz', genre: 'Business', details: { episodes: 200, frequency: 'Weekly', website: 'https://npr.org/howibuiltthis' }, dateStarted: '2026-04-28' },
  { title: 'Hardcore History', category: 'Podcast', status: 'In Progress', daysAgo: 12, creator: 'Dan Carlin', genre: 'History', details: { episodes: 68, frequency: 'Irregular', website: 'https://dancarlin.com' }, dateStarted: '2026-04-15' },
  { title: 'The Daily', category: 'Podcast', status: 'Want to Start', daysAgo: 1, creator: 'Michael Barbaro', genre: 'News', details: { episodes: 5000, frequency: 'Daily', website: 'https://nytimes.com/thedaily' } },
  { title: 'Radiolab', category: 'Podcast', status: 'Completed', daysAgo: 250, creator: 'Jad Abumrad & Robert Krulwich', genre: 'Science', details: { episodes: 200, frequency: 'Weekly', website: 'https://radiolab.org' }, dateStarted: '2025-09-01', dateCompleted: '2025-10-01' },
  { title: '99% Invisible', category: 'Podcast', status: 'Dropped', daysAgo: 200, creator: 'Roman Mars', genre: 'Design', details: { episodes: 600, frequency: 'Weekly', website: 'https://99percentinvisible.org' } },
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
