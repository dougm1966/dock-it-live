# File Organization - Gold Standard

## Directory Tree

```
dock-it-live/
├── src/                                    # Modern ES6+ source code
│   │
│   ├── core/                               # Universal Core (Phase 1)
│   │   ├── database/                       # Dexie.js wrapper & schema
│   │   │   ├── DexieWrapper.js            # Dexie.js initialization & schema definition
│   │   │   ├── migrations.js              # Migration utilities from native IndexedDB
│   │   │   ├── stores/                    # Store-specific modules
│   │   │   │   ├── matchState.js         # match_state table operations
│   │   │   │   ├── sponsors.js           # sponsors table operations
│   │   │   │   └── assets.js             # assets table operations (wraps PCPLImageDB)
│   │   │   └── index.js                  # Public API exports
│   │   │
│   │   ├── state/                         # Centralized state management
│   │   │   ├── StateManager.js           # Single source of truth state manager
│   │   │   ├── UndoRedoManager.js        # History-based undo/redo system
│   │   │   ├── reactivity.js             # Reactive state listeners
│   │   │   └── index.js                  # Public API exports
│   │   │
│   │   ├── messaging/                     # BroadcastChannel protocol
│   │   │   ├── MessageBus.js             # BroadcastChannel wrapper (g4-main)
│   │   │   ├── messageTypes.js           # SCORE_UPDATE, UI_REFRESH, AD_TRIGGER constants
│   │   │   ├── validators.js             # Envelope validation
│   │   │   └── index.js                  # Public API exports
│   │   │
│   │   ├── ads/                           # Ad platform foundation
│   │   │   ├── AdManager.js              # Sponsor asset management
│   │   │   ├── RotationEngine.js         # Ad rotation logic
│   │   │   ├── AssetUploader.js          # Upload, crop, optimize
│   │   │   └── index.js                  # Public API exports
│   │   │
│   │   ├── themes/                        # Theme engine
│   │   │   ├── ThemeManager.js           # Theme switching & persistence
│   │   │   ├── themes/                   # Theme definitions
│   │   │   │   ├── yami.js
│   │   │   │   ├── dark.js
│   │   │   │   ├── light.js
│   │   │   │   └── index.js
│   │   │   └── index.js                  # Public API exports
│   │   │
│   │   └── index.js                       # Core module public API
│   │
│   ├── modules/                           # Dock Modules (Plug-ins)
│   │   │
│   │   ├── billiards/                     # Billiards Dock (Phase 2)
│   │   │   ├── manifest.json             # Dock metadata & registration
│   │   │   ├── components/               # Billiards-specific UI components
│   │   │   │   ├── Scoreboard.js
│   │   │   │   ├── ShotClock.js
│   │   │   │   ├── PlayerPanel.js
│   │   │   │   └── index.js
│   │   │   ├── logic/                    # Billiards-specific game logic
│   │   │   │   ├── shotClockTimer.js    # 30s/60s timer logic (preserved from legacy)
│   │   │   │   ├── scoreCalculator.js   # Race-to algorithms (preserved from legacy)
│   │   │   │   ├── gameState.js         # Billiards game state management
│   │   │   │   └── index.js
│   │   │   ├── styles/                   # Billiards-specific Tailwind
│   │   │   │   └── billiards.css
│   │   │   ├── BilliardsDock.js          # Main Dock entry point
│   │   │   └── index.js                  # Public API exports
│   │   │
│   │   ├── hacky-sack/                    # Future: Hacky Sack Dock
│   │   │   └── (placeholder)
│   │   │
│   │   └── cricket/                       # Future: Cricket Dock
│   │       └── (placeholder)
│   │
│   ├── control-panel/                     # Universal Control Panel
│   │   ├── components/                    # Control panel UI components
│   │   │   ├── DockSelector.js           # Select active Dock module
│   │   │   ├── AdControls.js             # Sponsor ad controls
│   │   │   ├── ThemeSelector.js          # Theme switching UI
│   │   │   ├── UndoRedoButtons.js        # Undo/Redo UI
│   │   │   └── index.js
│   │   ├── styles/                        # Control panel Tailwind
│   │   │   └── control-panel.css
│   │   ├── ControlPanel.js                # Main control panel entry
│   │   └── index.js                       # Public API exports
│   │
│   ├── browser-source/                    # Browser source overlays
│   │   ├── components/                    # Overlay components
│   │   │   ├── LiveScoreboard.js         # Main scoreboard overlay
│   │   │   ├── AdOverlay.js              # Sponsor ad overlay
│   │   │   └── index.js
│   │   ├── styles/                        # Overlay Tailwind
│   │   │   └── browser-source.css
│   │   ├── BrowserSource.js               # Main browser source entry
│   │   └── index.js                       # Public API exports
│   │
│   ├── shared/                            # Shared utilities
│   │   ├── utils/                         # General utilities
│   │   │   ├── formatters.js             # Time, score formatting
│   │   │   ├── validators.js             # Input validation
│   │   │   └── index.js
│   │   ├── constants.js                   # Global constants
│   │   └── index.js                       # Public API exports
│   │
│   ├── assets/                            # Static assets
│   │   ├── audio/                         # Audio files
│   │   │   ├── beep2.mp3
│   │   │   └── buzz.mp3
│   │   └── images/                        # Default images
│   │       └── logo.png
│   │
│   └── main.js                            # Application entry point
│
├── public/                                # Static files for build (copied to dist/)
│   ├── control_panel.html                # Control panel HTML entry
│   ├── browser_source.html               # Browser source HTML entry
│   └── favicon.ico
│
├── dist/                                  # Build output (file:// compatible)
│   └── (generated by Vite build)
│
├── common/                                # Legacy code (Phase 0 - to be migrated)
│   ├── js/                                # Legacy jQuery code
│   │   ├── control_panel.js              # To be refactored -> src/control-panel/
│   │   ├── browser_source_post.js        # To be refactored -> src/browser-source/
│   │   ├── idb_images.js                 # To be refactored -> src/core/database/
│   │   └── (other legacy files)
│   └── css/                               # Legacy CSS
│       └── (legacy themes)
│
├── docs/                                  # Existing documentation
│   ├── 01_Strategy/
│   ├── 02_Architecture/
│   ├── 03_Guides/
│   └── (other docs)
│
├── agent-os/                              # Agent OS product planning
│   ├── product/
│   │   ├── mission.md                    # Product mission
│   │   ├── roadmap.md                    # Development roadmap
│   │   ├── tech-stack.md                 # Technical stack
│   │   └── FILE_ORGANIZATION.md          # This file (Gold Standard)
│   └── (other agent-os files)
│
├── .claude/                               # Claude Code configuration
├── .windsurf/                             # Windsurf configuration
│
├── vite.config.js                         # Vite build configuration
├── tailwind.config.js                     # Tailwind CSS configuration
├── package.json                           # NPM dependencies
├── package-lock.json                      # NPM lock file
├── .gitignore                             # Git ignore patterns
├── .eslintrc.js                           # ESLint configuration
├── .prettierrc.js                         # Prettier configuration
├── README.md                              # Project README
└── CLAUDE.md                              # Claude Code project instructions
```

## Design Principles

### Core vs. Modules Separation
**`/src/core/`** - Universal components shared across ALL Dock modules:
- Database layer (Dexie.js wrapper)
- State management (single source of truth)
- Messaging protocol (BroadcastChannel)
- Ad platform
- Theme engine

**`/src/modules/billiards/`** - Sport-specific logic:
- Billiards scoreboard UI
- Shot clock timer
- Billiards scoring math
- Billiards-specific styles

**Why This Matters:**
- Adding a new sport (Hacky Sack, Cricket) means creating a new `/src/modules/hacky-sack/` folder
- Core modules remain untouched
- "Building a factory that makes apps" architecture

### Control Panel vs. Browser Source
**`/src/control-panel/`** - OBS Browser Dock (Master Dock):
- Single Writer to Database/State
- Controls all Dock modules
- Manages sponsors, themes, settings

**`/src/browser-source/`** - OBS Browser Source (Display):
- Read-only consumer of Database/State
- Reacts to BroadcastChannel signals
- Displays current active Dock module

### Legacy Migration Path
**`/common/`** - Legacy jQuery code (Phase 0):
- Preserved for reference during migration
- Gradually refactored into `/src/` structure
- Not imported by new code
- Will be archived once migration complete

### Build Output Strategy
**`/dist/`** - Vite build output:
- file:// protocol compatible
- No absolute paths
- Self-contained assets (CSS, JS, fonts, audio bundled)
- Optimized for OBS, vMix, Wirecast

## File Naming Conventions

### JavaScript Modules
- **PascalCase** for classes: `StateManager.js`, `DexieWrapper.js`
- **camelCase** for utilities: `messageTypes.js`, `validators.js`
- **index.js** for public API exports from each directory

### CSS Files
- **kebab-case**: `control-panel.css`, `billiards.css`
- Tailwind utilities preferred over custom CSS

### Constants
- **UPPER_SNAKE_CASE** for message types: `SCORE_UPDATE`, `UI_REFRESH`
- Defined in `/src/core/messaging/messageTypes.js` or `/src/shared/constants.js`

## Import Path Strategy

### Absolute Imports (via Vite alias)
```javascript
// Good - use aliases for clean imports
import { StateManager } from '@core/state';
import { BilliardsDock } from '@modules/billiards';
import { MessageBus } from '@core/messaging';
```

### Relative Imports (within same module)
```javascript
// Good - relative paths within same directory tree
import { shotClockTimer } from './shotClockTimer.js';
import { scoreCalculator } from './scoreCalculator.js';
```

### Vite Config Aliases
```javascript
// vite.config.js
export default {
  resolve: {
    alias: {
      '@core': '/src/core',
      '@modules': '/src/modules',
      '@shared': '/src/shared',
      '@assets': '/src/assets',
    }
  }
}
```

## Module Index Pattern

### Public API Exports
Each directory should have an `index.js` exporting its public API:

```javascript
// src/core/database/index.js
export { DexieWrapper } from './DexieWrapper.js';
export { matchStateStore } from './stores/matchState.js';
export { sponsorsStore } from './stores/sponsors.js';
export { assetsStore } from './stores/assets.js';
```

### Usage
```javascript
// External code imports from index
import { DexieWrapper, matchStateStore } from '@core/database';

// NOT this (bypasses public API):
// import { DexieWrapper } from '@core/database/DexieWrapper.js';
```

## Phase Migration Plan

### Phase 0 (Current State)
- Legacy jQuery code in `/common/`
- Native IndexedDB in `idb_images.js`
- No build process

### Phase 1 (Universal Core)
- Initialize `/src/core/` structure
- Wrap IndexedDB with Dexie.js
- Extract BroadcastChannel to `/src/core/messaging/`
- Build Tailwind CSS foundation

### Phase 2 (Billiards Module)
- Create `/src/modules/billiards/` structure
- Refactor legacy billiards logic from `/common/`
- Preserve working math/timing, modernize to ES6+

### Phase 3+ (Future Modules)
- Add `/src/modules/hacky-sack/`
- Add `/src/modules/cricket/`
- Core remains untouched

## This is the Gold Standard
All future development MUST follow this structure. Any deviation requires:
1. Discussion with project stakeholders
2. Documented rationale for change
3. Update to this Gold Standard document
