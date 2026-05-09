use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create core_media table",
            sql: "CREATE TABLE IF NOT EXISTS core_media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                media_category TEXT,
                status TEXT,
                rating INTEGER,
                user_review TEXT,
                date_added TEXT NOT NULL DEFAULT (datetime('now')),
                date_completed TEXT
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add year, creator columns",
            sql: "ALTER TABLE core_media ADD COLUMN year INTEGER;
                  ALTER TABLE core_media ADD COLUMN creator TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add details JSON column",
            sql: "ALTER TABLE core_media ADD COLUMN details TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add date_started column",
            sql: "ALTER TABLE core_media ADD COLUMN date_started TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add image column for cover art",
            sql: "ALTER TABLE core_media ADD COLUMN image TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "create category_settings table",
            sql: "CREATE TABLE IF NOT EXISTS category_settings (
                category TEXT PRIMARY KEY,
                enabled INTEGER NOT NULL DEFAULT 1
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "rename Want to Consume to Want to Start",
            sql: "UPDATE core_media SET status = 'Want to Start' WHERE status = 'Want to Consume';",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add tags JSON column",
            sql: "ALTER TABLE core_media ADD COLUMN tags TEXT;",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:riffle.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
