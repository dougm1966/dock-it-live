# Dock-It.live (Modernization of PCPL ScoreBoard)

## ⚠️ THE THREE LAWS (MANDATORY)
1. **MODULAR SKELETON**: All new code in `src/`. Logic must be split between `src/core` (Universal) and `src/modules/billiards` (Sport-specific). No dumping files in the root.
2. **DATABASE TRUTH**: This project uses **IndexedDB** (`pcplscoreboard`), managed by the `PCPLImageDB` class. We are migrating to **Dexie.js** with zero data loss. Ignore all references to localStorage for state.
3. **MODERN STANDARDS**: ES6 Modules + Dexie.js + Tailwind CSS. NO jQuery in the new `src/` directory.

## Project Status: PHASE 1 (Foundation)
- **Goal**: Initializing the 'Universal Core' and migrating the Database.
- **State Pattern**: Reactive Database-first state. (BroadcastChannel messages are triggers, the Database is the data carrier).

## Directory Tree (The Gold Standard)
- `src/core/database/`: Dexie.js initialization & `pcplscoreboard` migration logic.
- `src/core/state/`: Centralized StateManager (Single Source of Truth).
- `src/core/messaging/`: BroadcastChannel (`g4-main`) logic.
- `src/modules/billiards/`: Shot-clock and Score logic refactored from legacy.
- `common/`: LEGACY CODE ONLY (Reference for refactoring).

## Legacy Reference (To be Refactored)
- **Original DB**: `PCPLImageDB` (IndexedDB) in `common/js/idb_images.js`.
- **Original Messaging**: `BroadcastChannel` (channel: `g4-main`).
- **Original Logic**: jQuery-based DOM manipulation in `common/js/control_panel.js`.


# PCPL ScoreBoard

A professional billiard/pool scoreboard solution for OBS Studio streamers.

## Project Overview

- **Type**: JavaScript/HTML/CSS web application for OBS browser sources
- **Purpose**: Provides a scoreboard overlay with shot clock for pool/billiards live streams
- **Platform**: OBS Studio (browser dock + browser source)

## Architecture

### Main HTML Files
- `control_panel.html` - OBS dock interface for controlling the scoreboard
- `browser_source.html` - Main scoreboard overlay (1920x1080)
- `browser_compact.html` - Compact scoreboard variant
- `shot_clock_display.html` - Standalone shot clock display

### JavaScript (common/js/)
- `control_panel.js` / `control_panel_post.js` - Control panel logic
- `browser_source.js` / `browser_source_post.js` - Browser source display logic
- `jquery.js` - jQuery library
- `hotkeys.js` - Hotkey definitions

### CSS Themes (common/css/)
- `control_panel/` - OBS theme variants (yami, acri, dark, grey, rachni, light)
- `browser_source/` - Display scaling (100%, 125%, 150%, 200%)

### OBS Integration
- `PCPL ScoreBoard_hotkeys.lua` - Lua script for OBS hotkey bindings

## Key Features

- Shot clock (30s/60s timers with extensions)
- Player scores and race tracking
- Custom logo upload and slideshow
- Multiple OBS themes supported
- Hotkey support via Lua script

## Code Style

- Uses jQuery for DOM manipulation
- localStorage for data persistence between control panel and browser source
- CSS for theming and responsive scaling

## Development Notes

- Test changes with OBS browser dock and browser source
- Browser sources use file:// protocol in OBS v27.2+
- Shot clock audio alerts are local (beep2.mp3, buzz.mp3)
