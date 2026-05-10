import type Database from '@tauri-apps/plugin-sql';

const seeds = [
  { title: 'The Matrix', category: 'Movie', status: 'Completed', daysAgo: 10, year: 1999, creator: 'The Wachowskis', details: { runtime: 136, language: 'English', country: 'USA' }, dateStarted: '2026-03-15', dateCompleted: '2026-03-28', tags: ['sci-fi', 'classic', "90s"] },
  { title: 'Dune: Part Two', category: 'Movie', status: 'Want to Start', daysAgo: 2, year: 2024, creator: 'Denis Villeneuve', details: { runtime: 166, language: 'English', country: 'USA' }, tags: ['sci-fi', 'epic', 'adaptation'] },
  { title: 'Everything Everywhere All at Once', category: 'Movie', status: 'Completed', daysAgo: 25, year: 2022, creator: 'Daniel Kwan & Daniel Scheinert', details: { runtime: 139, language: 'English', country: 'USA' }, dateStarted: '2026-04-01', dateCompleted: '2026-04-03', tags: ['sci-fi', 'multiverse', 'comedy'] },
  { title: 'Back to the Future Part II', category: 'Movie', status: 'Want to Start', daysAgo: 1, year: 1989, creator: 'Robert Zemeckis', details: { runtime: 108, language: 'English', country: 'USA' }, tags: ['adventure', 'time-travel', 'classic'] },
  { title: 'The Shawshank Redemption', category: 'Movie', status: 'In Progress', daysAgo: 4, year: 1994, creator: 'Frank Darabont', details: { runtime: 142, language: 'English', country: 'USA' }, dateStarted: '2026-05-03', tags: ['drama', 'prison', 'classic'] },
  { title: 'Interstellar', category: 'Movie', status: 'Completed', daysAgo: 40, year: 2014, creator: 'Christopher Nolan', details: { runtime: 169, language: 'English', country: 'USA' }, dateStarted: '2026-03-20', dateCompleted: '2026-03-22', tags: ['sci-fi', 'space', 'emotional'] },
  { title: 'Sapiens: A Brief History of Humankind', category: 'Book', status: 'In Progress', daysAgo: 5, year: 2011, creator: 'Yuval Noah Harari', details: { pages: 498, language: 'English', format: 'Paperback' }, dateStarted: '2026-04-01', tags: ['non-fiction', 'history', 'anthropology'] },
  { title: '1984', category: 'Book', status: 'Want to Start', daysAgo: 1, year: 1949, creator: 'George Orwell', details: { pages: 328, language: 'English', format: 'Paperback' }, tags: ['dystopian', 'classic', 'political'] },
  { title: 'Thinking, Fast and Slow', category: 'Book', status: 'Completed', daysAgo: 35, year: 2011, creator: 'Daniel Kahneman', details: { pages: 512, language: 'English', format: 'Hardcover' }, dateStarted: '2026-03-25', dateCompleted: '2026-04-10', tags: ['non-fiction', 'psychology', 'behavioral'] },
  { title: 'The Hitchhiker\'s Guide to the Galaxy', category: 'Book', status: 'Dropped', daysAgo: 50, year: 1979, creator: 'Douglas Adams', details: { pages: 224, language: 'English', format: 'Paperback' }, tags: ['comedy', 'sci-fi', 'cult'] },
  { title: 'The Name of the Wind', category: 'Book', status: 'In Progress', daysAgo: 8, year: 2007, creator: 'Patrick Rothfuss', details: { pages: 662, language: 'English', format: 'Paperback' }, dateStarted: '2026-04-28', tags: ['fantasy', 'epic', 'magic'] },
  { title: 'The Art of War', category: 'Book', status: 'Completed', daysAgo: 500, year: -500, creator: 'Sun Tzu', details: { pages: 68, language: 'English', format: 'Paperback' }, dateStarted: '2024-12-01', dateCompleted: '2024-12-15', tags: ['philosophy', 'warfare', 'classic'] },
  { title: 'Succession', category: 'Show', status: 'In Progress', daysAgo: 7, year: 2018, creator: 'Jesse Armstrong', details: { seasons: 4, network: 'HBO', status: 'Finished' }, dateStarted: '2026-04-20', tags: ['drama', 'family', 'business'], current: 2 },
  { title: 'The Boys', category: 'Show', status: 'Completed', daysAgo: 14, year: 2019, creator: 'Eric Kripke', details: { seasons: 4, network: 'Prime Video', status: 'Ongoing' }, dateStarted: '2026-04-05', dateCompleted: '2026-04-18', tags: ['superhero', 'dark-comedy', 'action'] },
  { title: 'Stranger Things', category: 'Show', status: 'On Hold', daysAgo: 45, year: 2016, creator: 'The Duffer Brothers', details: { seasons: 4, network: 'Netflix', status: 'Ongoing' }, dateStarted: '2026-03-10', tags: ['horror', 'retro', 'sci-fi'], current: 3 },
  { title: 'The Crown', category: 'Show', status: 'Want to Start', daysAgo: 3, year: 2016, creator: 'Peter Morgan', details: { seasons: 6, network: 'Netflix', status: 'Finished' }, tags: ['drama', 'historical', 'royalty'] },
  { title: 'Better Call Saul', category: 'Show', status: 'Completed', daysAgo: 300, year: 2015, creator: 'Vince Gilligan & Peter Gould', details: { seasons: 6, network: 'AMC', status: 'Finished' }, dateStarted: '2025-07-01', dateCompleted: '2025-08-20', tags: ['drama', 'legal', 'prequel'] },
  { title: 'Breaking Bad', category: 'Show', status: 'Completed', daysAgo: 400, year: 2008, creator: 'Vince Gilligan', details: { seasons: 5, network: 'AMC', status: 'Finished' }, dateStarted: '2025-03-01', dateCompleted: '2025-04-15', tags: ['drama', 'crime', 'classic'] },
  { title: 'Elden Ring', category: 'Game', status: 'On Hold', daysAgo: 20, year: 2022, creator: 'FromSoftware', details: { platform: 'PS5', publisher: 'Bandai Namco' }, dateStarted: '2026-04-10', tags: ['rpg', 'open-world', 'dark-fantasy'] },
  { title: 'The Last of Us', category: 'Game', status: 'Completed', daysAgo: 180, year: 2013, creator: 'Naughty Dog', details: { platform: 'PS3', publisher: 'Sony' }, dateStarted: '2025-11-01', dateCompleted: '2025-11-15', tags: ['action', 'survival', 'post-apocalyptic'] },
  { title: 'Baldur\'s Gate 3', category: 'Game', status: 'In Progress', daysAgo: 6, year: 2023, creator: 'Larian Studios', details: { platform: 'PC', publisher: 'Larian Studios' }, dateStarted: '2026-04-30', tags: ['rpg', 'fantasy', 'tactical'] },
  { title: 'Red Dead Redemption 2', category: 'Game', status: 'On Hold', daysAgo: 70, year: 2018, creator: 'Rockstar Studios', details: { platform: 'Xbox', publisher: 'Rockstar Games' }, dateStarted: '2026-02-20', tags: ['action', 'open-world', 'western'] },
  { title: 'Celeste', category: 'Game', status: 'Completed', daysAgo: 60, year: 2018, creator: 'Maddy Makes Games', details: { platform: 'Switch', publisher: 'Maddy Makes Games' }, dateStarted: '2026-03-01', dateCompleted: '2026-03-10', tags: ['platformer', 'indie', 'challenging'] },
  { title: 'Hollow Knight', category: 'Game', status: 'Want to Start', daysAgo: 1, year: 2017, creator: 'Team Cherry', details: { platform: 'Switch', publisher: 'Team Cherry' }, tags: ['metroidvania', 'indie', 'atmospheric'] },
  { title: 'Serial', category: 'Podcast', status: 'Completed', daysAgo: 60, creator: 'Sarah Koenig', details: { episodes: 12, frequency: 'Weekly', status: 'Finished' }, dateStarted: '2026-02-01', dateCompleted: '2026-04-01', tags: ['true-crime', 'investigative'], current: 12 },
  { title: 'How I Built This', category: 'Podcast', status: 'In Progress', daysAgo: 3, creator: 'Guy Raz', details: { episodes: 200, frequency: 'Weekly', status: 'Ongoing' }, dateStarted: '2026-04-28', tags: ['business', 'interviews'] },
  { title: 'Hardcore History', category: 'Podcast', status: 'In Progress', daysAgo: 12, creator: 'Dan Carlin', details: { episodes: 68, frequency: 'Irregular', status: 'Ongoing' }, dateStarted: '2026-04-15', tags: ['history', 'deep-dive'], current: 45 },
  { title: 'The Daily', category: 'Podcast', status: 'Want to Start', daysAgo: 1, creator: 'Michael Barbaro', details: { episodes: 5000, frequency: 'Daily', status: 'Ongoing' }, tags: ['news', 'daily'] },
  { title: 'Radiolab', category: 'Podcast', status: 'Completed', daysAgo: 250, creator: 'Jad Abumrad & Robert Krulwich', details: { episodes: 200, frequency: 'Weekly', status: 'Ongoing' }, dateStarted: '2025-09-01', dateCompleted: '2025-10-01', tags: ['science', 'storytelling'] },
  { title: '99% Invisible', category: 'Podcast', status: 'Dropped', daysAgo: 200, creator: 'Roman Mars', details: { episodes: 600, frequency: 'Weekly', status: 'Ongoing' }, tags: ['design', 'architecture'] },
  { title: 'Watchmen', category: 'Comic', status: 'Completed', daysAgo: 100, year: 1986, creator: 'Alan Moore & Dave Gibbons', details: { issues: 12, publisher: 'DC', format: 'Trade Paperback' }, dateStarted: '2026-01-01', dateCompleted: '2026-01-15', tags: ['superhero', 'classic', 'deconstruction'], current: 12 },
  { title: 'Saga', category: 'Comic', status: 'In Progress', daysAgo: 15, year: 2012, creator: 'Brian K. Vaughan & Fiona Staples', details: { issues: 66, publisher: 'Image', format: 'Trade Paperback' }, dateStarted: '2026-04-15', tags: ['sci-fi', 'fantasy', 'ongoing'], current: 42 },
  { title: 'The Sandman', category: 'Comic', status: 'Completed', daysAgo: 200, year: 1989, creator: 'Neil Gaiman', details: { issues: 75, publisher: 'DC', format: 'Omnibus' }, dateStarted: '2025-10-01', dateCompleted: '2025-12-01', tags: ['fantasy', 'classic', 'vertigo'] },
  { title: 'Scott Pilgrim', category: 'Comic', status: 'Want to Start', daysAgo: 5, year: 2004, creator: 'Bryan Lee O\'Malley', details: { issues: 6, publisher: 'Oni Press', format: 'Trade Paperback' }, tags: ['comedy', 'indie', 'romance'] },
];

export async function seedDatabase(db: Database) {
  const row = await db.select<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM core_media'
  );
  if (row[0].count > 0) return;

  for (const s of seeds) {
    await db.execute(
      `INSERT INTO core_media (title, media_category, status, date_added, year, creator, details, date_started, date_completed, tags, current)
       VALUES ($1, $2, $3, datetime('now', $4), $5, $6, $7, $8, $9, $10, $11)`,
      [s.title, s.category, s.status, `-${s.daysAgo} days`, s.year ?? null, s.creator ?? null, JSON.stringify(s.details), s.dateStarted ?? null, s.dateCompleted ?? null, s.tags ? JSON.stringify(s.tags) : null, s.current ?? null]
    );
  }
}
