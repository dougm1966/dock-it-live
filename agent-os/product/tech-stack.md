# Tech Stack - Dock-It.live

## ⚠️ THE THREE LAWS (MANDATORY)

### Law 1: Modular Skeleton
**All new code in `/src/` with strict separation:**
- `/src/core/` - Universal components (Database, State, Messaging, Ads, Themes)
- `/src/modules/billiards/` - Sport-specific logic (Shot clock, Scoring, Billiards UI)
- `/common/` - Legacy code (read-only reference, will be archived after migration)

**NO dumping files in root** - All source code must live in appropriate `/src/` subdirectories.

### Law 2: Database Truth
**Current State:** Existing `pcplscoreboard` IndexedDB database
- **Implementation:** `PCPLImageDB` class in `/common/js/idb_images.js`
- **Current Store:** `images` (sponsor logos and assets as Blobs)
- **Migration Target:** Dexie.js wrapper with **zero data loss**

**Critical Understanding:**
- We are migrating FROM IndexedDB (native) TO IndexedDB (Dexie.js-wrapped)
- We are NOT migrating from localStorage (localStorage is NOT used for critical data)
- Existing sponsor images must remain accessible after migration

### Law 3: Modern Standards
**Technology Stack:**
- **ES6+ Modules** exclusively (no var, no function expressions, use classes)
- **Dexie.js** for IndexedDB wrapper (simpler API, liveQuery reactivity)
- **Tailwind CSS** for styling (utility-first, no custom CSS unless necessary)
- **NO jQuery** in `/src/` directory (enforced by ESLint)

## Framework & Runtime

### Build Tool
- **Vite 5+** - Modern build tool with ES module support
- **Output:** `file://` protocol compatible (critical for OBS/vMix/Wirecast)
- **Base Path:** Relative (`./`) not absolute
- **Multi-page App:** Separate entries for control panel, browser source, compact, shot clock

### Language & Modules
- **JavaScript:** ES2015+ (ES6 minimum, ES2020+ preferred)
- **Module System:** ES6 Modules (`import`/`export`)
- **Package Manager:** npm
- **Node Version:** 18.0.0+

### Browser Targets
- **Primary:** Modern evergreen browsers (Chrome 90+, Firefox 88+, Edge 90+)
- **OBS Studio:** v27.2+ (Chromium-based browser source)
- **vMix:** Current version (browser source)
- **Wirecast:** Current version (browser source)

## Frontend Architecture

### JavaScript Framework
**None** - Vanilla JavaScript with Web Components
- **Rationale:** Reduce bundle size, maximize OBS compatibility
- **Pattern:** Custom Web Components for reusable UI
- **State:** Reactive database-first pattern (not framework-based)

### CSS Framework
**Tailwind CSS v3+** - Utility-first CSS
- **Configuration:** `tailwind.config.js` with Dock-It.live design system
- **Theme Colors:** Dock-It.live brand colors + legacy PCPL colors (for migration reference)
- **Responsive:** Custom breakpoints for OBS resolutions (720p, 1080p, 1440p, 4K)
- **Plugins:** `@tailwindcss/forms` for form styling

### UI Components
- **Web Components** (native browser APIs, no library)
- **Separation:** Core components in `/src/core/`, sport-specific in `/src/modules/billiards/`
- **Reusability:** Components shared across Control Panel, Browser Source, and future Docks

## Database & Storage

### Current Implementation (Legacy)
**Database Name:** `pcplscoreboard`
**Store:** `images`
**Implementation:** `PCPLImageDB` class (`/common/js/idb_images.js`)

**Schema:**
```javascript
{
  key: 'string',           // Logical ID (e.g., 'leftSponsorLogo', 'sponsorAd_001')
  blob: Blob,              // Image binary data
  mime: 'string',          // MIME type (e.g., 'image/png')
  name: 'string',          // Original file name
  size: number,            // File size in bytes
  width: number,           // Image width
  height: number,          // Image height
  updatedAt: number        // Timestamp
}
```

### Migration Target: Dexie.js Wrapper
**Technology:** Dexie.js v3+

**New Database Name:** `DockItDB` (transitioning from `pcplscoreboard`)

**New Schema:**
```javascript
// Table 1: assets (migrated from images store)
{
  id: 'string',            // Primary key (replaces 'key')
  blob: Blob,              // Image/video binary data
  mime: 'string',          // MIME type
  name: 'string',          // Original file name
  size: number,            // File size in bytes
  width: number,           // Media width
  height: number,          // Media height
  type: 'sponsor|player|event',  // Asset category
  tags: 'string[]',        // Search/filter tags
  updatedAt: number,       // Timestamp
  createdAt: number        // Timestamp
}

// Table 2: match_state (new)
{
  id: 'string',            // Primary key (e.g., 'current')
  sport: 'billiards|hacky-sack|cricket',
  player1: { name, score, ... },
  player2: { name, score, ... },
  gameType: 'string',      // Race-to, points, etc.
  activeSettings: {},      // Sport-specific settings
  timestamp: number
}

// Table 3: sponsors (new)
{
  id: 'string',            // Primary key (UUID)
  name: 'string',          // Sponsor company name
  tier: 'platinum|gold|silver|bronze',
  assetIds: 'string[]',    // References to assets table
  impressionCount: number, // Total displays
  isActive: boolean,
  createdAt: number,
  updatedAt: number
}
```

### Migration Strategy: Zero Data Loss
**Phase 1: Analysis** (REQUIRED FIRST STEP)
1. Read existing `pcplscoreboard` database using PCPLImageDB class
2. Export all records from `images` store
3. Document data volume (count, total bytes)
4. Identify any edge cases or data anomalies

**Phase 2: Dexie.js Setup**
1. Install Dexie.js: `npm install dexie@^3.2.4`
2. Create `/src/core/database/DexieWrapper.js` with schema definition
3. Initialize `DockItDB` database (runs alongside `pcplscoreboard` during migration)

**Phase 3: Migration Utilities**
1. Create `/src/core/database/migrations.js`
2. Implement `migratePCPLImageDBtoDexie()` function
3. Map `images.key` → `assets.id`
4. Map `images.*` → `assets.*` with new fields (`type`, `tags`, `createdAt`)
5. Set default values: `type: 'sponsor'`, `tags: []`, `createdAt: updatedAt`

**Phase 4: Validation & Testing**
1. Test migration with production data backup
2. Verify all images accessible via Dexie.js
3. Compare record counts (before/after)
4. Test asset retrieval performance
5. Validate blob integrity (compare URLs)

**Phase 5: Cutover**
1. Run migration script on application startup (if not already migrated)
2. Update all image references to use Dexie.js API
3. Mark `pcplscoreboard` database as deprecated (keep for rollback)
4. After 30-day grace period, remove legacy database

### Storage Philosophy: Massive Storage
**IndexedDB Capacity:** Hundreds of MB to several GB (browser-dependent)
**Use Cases:**
- High-resolution sponsor logos and videos
- Complete match history archives (unlimited games)
- Player photos and event assets
- Export/import backups (JSON with base64 assets)

**localStorage:** ONLY for non-critical small settings (< 1KB)
- Never for match data, sponsor assets, or game state
- Legacy usage will be removed during migration

## State Management

### Reactive Source of Truth Pattern
**Database is the single source of truth** - Not in-memory state

**Architecture:**
1. **Control Panel (Writer):** Updates `DockItDB` via Dexie.js
2. **Database Change:** Dexie.js `liveQuery` or manual change detection
3. **BroadcastChannel Signal:** Sends trigger message via `g4-main` channel
4. **Overlays (Readers):** Receive signal, fetch latest state from `DockItDB`

**Message Protocol:**
- **Channel:** `g4-main` (existing, preserved from legacy)
- **Envelope:** `{ type: 'STRING_CONSTANT', payload: {...} }`
- **Message Types:** `SCORE_UPDATE`, `UI_REFRESH`, `AD_TRIGGER` (existing, preserved)
- **Critical:** Messages are TRIGGERS, not data carriers; overlays must fetch from database

### Data Integrity Rules
- **Single Writer:** Only Master Dock (Control Panel) writes to database
- **Reactive Listeners:** Overlays use Dexie.js `liveQuery` or BroadcastChannel to refresh
- **Persistence:** All data survives browser refresh
- **No Circular Loops:** Docks never respond to their own broadcast signals

### StateManager Implementation
**Location:** `/src/core/state/StateManager.js`

**Responsibilities:**
- Centralized API for reading/writing database
- Undo/Redo history management ("Fat Finger" protection)
- BroadcastChannel message dispatch
- Dexie.js liveQuery subscription management

## Messaging & Communication

### BroadcastChannel Protocol
**Channel Name:** `g4-main` (preserved from legacy)
**API:** Native BroadcastChannel (no wrapper library)

**Message Structure (The Envelope):**
```javascript
{
  type: 'SCORE_UPDATE' | 'UI_REFRESH' | 'AD_TRIGGER',
  payload: {
    // Minimal metadata (e.g., timestamp, triggerId)
    // NOT full data objects
  }
}
```

**Implementation:** `/src/core/messaging/MessageBus.js`
- Wrapper class for BroadcastChannel
- Message validation (enforce envelope structure)
- Prevent circular loops (track sent message IDs)

**Legacy Compatibility:**
- Preserve existing message types during migration
- Add new types for new features (with `DOCK_` prefix, e.g., `DOCK_STATE_CHANGED`)

## Cross-Platform Browser Source Compatibility

### Target Platforms
- **OBS Studio** v27.2+ (primary)
- **vMix** (secondary)
- **Wirecast** (secondary)
- Any global browser source platform supporting `file://` protocol

### file:// Protocol Requirements
**Vite Build Configuration:**
- `base: './'` (relative paths only)
- No absolute paths in output
- All assets bundled or inline
- Audio/image files copied to `dist/assets/`

**Testing:**
- Open `dist/control_panel.html` directly via `file://` in browser
- Verify no CORS errors, no network requests
- Test BroadcastChannel between file:// windows
- Test IndexedDB access from file:// context

### Self-Contained Assets
- No external CDN dependencies (no Google Fonts, no Font Awesome CDN)
- Bundle all fonts locally or use system fonts
- Audio files (beep2.mp3, buzz.mp3) in `/src/assets/audio/` → `dist/assets/audio/`
- All images in `/src/assets/images/` → `dist/assets/images/`

## Testing & Quality Assurance

### Test Framework
- **Vitest** - Unit and integration testing (Vite-native)
- **Playwright** - End-to-end testing (simulate OBS browser source)

### Validation Testing (Critical)
**Backward Compatibility:**
- Test new system against current OBS scenes
- Ensure transition invisible to end viewer
- Verify hotkeys work identically
- Validate timing intervals unchanged (shot clock 30s/60s)
- Test BroadcastChannel protocol compatibility

### Code Quality Tools
- **ESLint** - Enforce ES6+, block jQuery, max complexity
- **Prettier** - Code formatting (semi, single quotes, 100 char lines)
- **Husky** (optional) - Pre-commit hooks for linting

### ESLint Rules (Law Enforcement)
```javascript
// Block jQuery
'no-restricted-imports': ['error', { patterns: ['jquery', '*jquery*'] }],
'no-restricted-globals': ['error', { name: '$', message: 'Use vanilla JS' }],

// Enforce ES6+
'no-var': 'error',
'prefer-const': 'error',
'prefer-arrow-callback': 'error',

// Code quality
'max-lines-per-function': ['warn', 100],
'complexity': ['warn', 15],
```

## Build & Deployment

### Development
```bash
npm run dev          # Vite dev server (http://localhost:3000)
npm run lint         # ESLint check
npm run format       # Prettier format
npm run test         # Run Vitest tests
```

### Production Build
```bash
npm run build        # Vite build to dist/
npm run preview      # Preview production build
```

### Output Structure
```
dist/
├── control_panel.html        # Entry point for OBS browser dock
├── browser_source.html       # Entry point for OBS browser source
├── browser_compact.html      # Compact variant
├── shot_clock_display.html   # Standalone shot clock
├── assets/
│   ├── control-panel-[hash].js
│   ├── browser-source-[hash].js
│   ├── main-[hash].css
│   ├── audio/
│   │   ├── beep2.mp3
│   │   └── buzz.mp3
│   └── images/
│       └── logo.png
```

### file:// Testing Checklist
- [ ] Open `dist/control_panel.html` directly in browser (no server)
- [ ] Open `dist/browser_source.html` directly in browser
- [ ] Verify BroadcastChannel communication between windows
- [ ] Verify IndexedDB read/write operations
- [ ] Verify audio playback (beep2.mp3, buzz.mp3)
- [ ] Test in OBS Studio (browser dock + browser source)
- [ ] Test in vMix (browser source)

## Performance Requirements

### Load Times
- **Control Panel:** < 2 seconds (initial load via file://)
- **Browser Source:** < 1 second (initial load via file://)

### Bundle Sizes
- **Total JavaScript:** < 500KB minified (excluding sponsor assets)
- **Total CSS:** < 100KB minified
- **Dexie.js:** ~25KB gzipped

### Runtime Performance
- **Dexie.js Queries:** < 50ms (asset retrieval), < 100ms (match history)
- **Memory:** < 100MB with 50+ sponsor assets loaded
- **UI Updates:** 60fps (no jank during score updates or timer ticks)

## Migration from Legacy

### Phase 0: Analysis (REQUIRED FIRST)
**Before writing ANY new database code:**
1. Read `/common/js/idb_images.js` (PCPLImageDB class)
2. Analyze `pcplscoreboard` database schema
3. Export sample data for testing
4. Document existing BroadcastChannel usage (`g4-main`)

### Phase 1: Universal Core
**Target:** `/src/core/`
1. Database layer (`/src/core/database/DexieWrapper.js`)
2. State management (`/src/core/state/StateManager.js`)
3. Messaging (`/src/core/messaging/MessageBus.js`)
4. Theme engine (`/src/core/themes/ThemeManager.js`)

### Phase 2: Billiards Module
**Target:** `/src/modules/billiards/`
1. Extract shot clock logic from `/common/js/` (preserve timing math)
2. Extract score calculation (preserve race-to algorithms)
3. Refactor to ES6 classes with clean separation
4. Build Tailwind UI components

### Phase 3: Control Panel & Browser Source
**Target:** `/src/control-panel/` and `/src/browser-source/`
1. Rebuild Control Panel UI with Tailwind
2. Rebuild Browser Source overlay with Tailwind
3. Wire to Universal Core (Database, State, Messaging)
4. Test against OBS scenes (validation step)

### Legacy Preservation: "Preserve and Refine"
**DO Preserve:**
- Working sports math (shot clock intervals, race-to algorithms)
- Timing logic (30s/60s modes, extensions)
- Audio trigger points (beep at 10s, buzz at 0s)
- BroadcastChannel message types

**DO Refine:**
- Convert to ES6 classes
- Extract into modular files
- Remove jQuery dependencies
- Add type safety (JSDoc comments)

**ONLY Rewrite:**
- Code that violates "No jQuery" rule
- Code with critical bugs
- Code that's genuinely unsalvageable spaghetti

## Dependencies

### Production
```json
{
  "dexie": "^3.2.4"
}
```

### Development
```json
{
  "@tailwindcss/forms": "^0.5.7",
  "autoprefixer": "^10.4.16",
  "eslint": "^8.56.0",
  "eslint-config-prettier": "^9.1.0",
  "postcss": "^8.4.33",
  "prettier": "^3.2.4",
  "tailwindcss": "^3.4.1",
  "vite": "^5.0.11",
  "vitest": "^1.2.0"
}
```

## Summary: The Three Laws in Practice

1. **Modular Skeleton:** All new code lives in `/src/core/` or `/src/modules/billiards/`. Legacy code in `/common/` is read-only reference.

2. **Database Truth:** Wrap existing `pcplscoreboard` IndexedDB with Dexie.js. Preserve `images` store as `assets` table with zero data loss. NOT migrating from localStorage.

3. **Modern Standards:** ES6+ modules, Dexie.js, Tailwind CSS. jQuery blocked by ESLint. Clean, maintainable, future-proof code.
