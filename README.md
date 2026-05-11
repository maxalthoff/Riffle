# Riffle

A local-first media consumption tracker. All your movies, books, shows, games, podcasts, and comics — stored locally on your machine. No accounts, no cloud, no data leaving your computer.

## Installation

### macOS

1. **Download** the latest `Riffle_x.x.x_aarch64.dmg` from [github.com/maxalthoff/Riffle](https://github.com/maxalthoff/Riffle)
2. **Open** the DMG file
3. **Drag** the Riffle app into your Applications folder
4. **Launch** Riffle from Applications

**Note:** The first time you open Riffle, macOS may show a warning that the app is from an unidentified developer. This is because the app isn't code-signed with an Apple Developer account. To open it anyway:

- **Option A:** Right-click (or Control-click) Riffle in Applications and select **Open**, then click **Open** in the dialog
- **Option B:** Go to **System Settings → Privacy & Security**, scroll down and click **Open Anyway** next to Riffle

This only needs to be done once. Subsequent launches work normally.

### Building from source

```bash
# Prerequisites: Node.js 18+, Rust toolchain
git clone https://github.com/maxalthoff/Riffle.git
cd Riffle
npm install
npm run tauri build
```

The built app will be at `src-tauri/target/release/bundle/`.

## Features

- Track 6 media categories: Movie, Book, Show, Game, Podcast, Comic
- Per-category detail fields (runtime, pages, seasons, platform, episodes, issues, etc.)
- Cover images with drag-and-drop support
- Tagging system with autocomplete
- Current episode/issue/season tracking
- Sortable, filterable table view with expandable info panel
- Customizable categories (hide/unhide any category)
- Contextual status labels (Want to Watch / Read / Play / Listen)
- Light and Dark mode
- Full data portability — everything in a single SQLite database

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2.0 (Rust) |
| Frontend | SvelteKit + TypeScript |
| Database | SQLite via tauri-plugin-sql |
| Styling | CSS custom properties (Light/Dark themes) |

## License

MIT © Max Althoff
