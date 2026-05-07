import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:riffle.db');
  }
  return db;
}

export interface MediaEntry {
  id: number;
  title: string;
  media_category: string | null;
  status: string | null;
  rating: number | null;
  user_review: string | null;
  date_added: string;
  date_completed: string | null;
  year: number | null;
  creator: string | null;
  genre: string | null;
  details: string | null;
}
