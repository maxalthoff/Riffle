import type Database from '@tauri-apps/plugin-sql';
import { CATEGORIES } from './types';

export async function loadEnabledCategories(db: Database): Promise<Set<string>> {
  const rows = await db.select<{ category: string; enabled: number }[]>('SELECT * FROM category_settings');
  if (rows.length === 0) {
    for (const cat of CATEGORIES) {
      await db.execute('INSERT INTO category_settings (category, enabled) VALUES ($1, 1)', [cat]);
    }
    return new Set(CATEGORIES);
  }
  return new Set(rows.filter(r => r.enabled).map(r => r.category));
}

export async function setCategoryEnabled(db: Database, category: string, enabled: boolean): Promise<void> {
  await db.execute(
    'UPDATE category_settings SET enabled = $1 WHERE category = $2',
    [enabled ? 1 : 0, category]
  );
}
