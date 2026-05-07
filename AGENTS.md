# AGENTS.md

## Tech stack
- **Desktop shell:** Tauri 2.0 (Rust)
- **Frontend:** SvelteKit + TypeScript (SPA mode via `@sveltejs/adapter-static`)
- **Database:** SQLite via `tauri-plugin-sql` (database file: `sqlite:riffle.db`)

## Commands
```bash
npm install              # install frontend deps
npm run dev              # Vite dev server (port 1420)
npm run build            # Vite production build → /build
npm run tauri dev        # Tauri dev (frontend + native window)
npm run tauri build      # Tauri production build → .app bundle
npm run precommit        # typecheck frontend + Rust before committing
```

## Git conventions
- **Commit style**: Conventional Commits — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`
- One logical change per commit (no mixed concerns)
- Before every commit, run: `npm run precommit`
- Keep `.gitignore` current — when adding new dependencies or tooling, run `git status --ignored` and add any new artifact directories
- Never commit secrets, keys, `.env` files, or build artifacts

## Changelog
- `CHANGELOG.md` is generated from commit history before each release
- Build agent runs: `git log --oneline --no-decorate <last-tag>..HEAD` and formats a plain-English summary grouped by Conventional Commit type
- Keep it brief — bullet points, one per feature/fix

## Semantic versioning
- Version lives in 3 files that must stay in sync:
  - `package.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/tauri.conf.json`
- To bump: run `npm version [patch|minor|major]` (updates package.json + creates git tag), then mirror the new version in Cargo.toml and tauri.conf.json
- Pre-1.0: minor bumps are compatible, patch bumps are bugfix-only

## Architecture

### Rust backend (`src-tauri/`)
- `src-tauri/src/lib.rs` — app entrypoint, plugin registration, DB migrations
- `src-tauri/tauri.conf.json` — app config (product name, bundle id, window settings)
- `src-tauri/capabilities/default.json` — permission grants for plugins (sql, opener, core)
- DB migrations run automatically on first app launch via `tauri_plugin_sql::Builder::add_migrations()`

### Frontend (`src/`)
- `src/routes/+page.svelte` — main page
- `src/routes/+layout.ts` — `export const ssr = false` (required for Tauri SPA mode)
- `src/lib/db.ts` — DB helper: `getDb()` returns a singleton `Database` handle
- SvelteKit `$lib` alias maps to `src/lib/`

### Database
- Identifier: `sqlite:riffle.db` (how you reference it in both Rust migrations and JS `Database.load()`)
- `core_media` table schema: `id`, `title`, `media_category`, `status`, `rating`, `user_review`, `date_added`, `date_completed`
- To query from frontend: `const db = await getDb(); db.select('SELECT * FROM core_media');`

## Gotchas
- **No SSR**: SvelteKit is in SPA mode (`adapter-static` with `ssr = false`). Server-only APIs won't work.
- **Permissions**: SQL plugin needs explicit permission grants in `capabilities/default.json` (`sql:default`, `sql:allow-load`, `sql:allow-execute`, `sql:allow-select`, `sql:allow-close`).
- **Bundle identifier**: Must not end with `.app` on macOS (use e.g. `com.riffle.desktop`).
- **Vite port**: Fixed at 1420 (`strictPort: true`). Tauri's `devUrl` must match.
- **`svelte-kit sync`**: Required before `svelte-check` (the `check` script in `package.json` does this).
- **Version sync**: `package.json`, `Cargo.toml`, and `tauri.conf.json` all carry the version number. Bump all three together.
- **Pre-commit**: Always run `npm run precommit` before committing — it runs `npm run check` (frontend typecheck) then `cargo check` (Rust compile check).
