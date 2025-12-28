# Legacy Code Archive

**Date Archived**: 2025-12-27
**Reason**: localStorage elimination - migrated to StateManager + IndexedDB

---

## ⚠️ IMPORTANT

**These files are NOT used by the production system.**

All active components have been migrated to use:
- **StateManager** (reactive state management)
- **IndexedDB** (via Dexie.js)
- **BroadcastChannel** (trigger-only messaging)

The files in this archive still use **localStorage** and are preserved for:
- Historical reference
- Migration documentation
- Potential code reuse
- Understanding the old architecture

---

## Archived Files

### 1. Browser Source System (Old Overlay)
**Location**: `browser_source/`

Legacy overlay system that loaded state from localStorage:
- `storage.js` - localStorage wrapper (~18 operations)
- `core.js` - Main entry point
- `ui.js` - UI rendering and updates
- `shotclock.js` - Shot clock logic
- `messaging.js` - BroadcastChannel messaging
- `constants.js` - Shared constants

**Replaced by**: `src/modules/billiards/overlay/OverlayController.js`

**localStorage calls**: ~30

---

### 2. Browser Compact System (Old Compact View)
**Location**: `browser_compact/`

Compact version of the browser source overlay:
- Similar structure to `browser_source/`
- Optimized for smaller displays
- Used localStorage for state

**Replaced by**: Modern responsive overlay skins

**localStorage calls**: ~30

---

### 3. Control Panel (Old Control Panel)
**Location**: `src/common/js/`

Legacy control panel with extensive localStorage usage:
- `control_panel.js` - Main control panel logic (~80 localStorage operations)
- `control_panel_post.js` - Additional control panel code
- `control_panel_migrated.js` - Partial migration attempt (test file)

**Replaced by**: `src/modules/master-control/MasterController.js`

**localStorage calls**: ~80+

---

### 4. Bundled Files
**Location**: `src/common/js/`

Pre-bundled legacy JavaScript files:
- `browser_source.bundled.js` - Bundled overlay code
- `browser_compact.bundled.js` - Bundled compact overlay
- `shot_clock_display.bundled.js` - Bundled shot clock

**Replaced by**: Vite build system with modern bundling

---

### 5. Advertising & Ball Tracker (Old Modules)
**Location**: `src/common/js/`

Legacy module implementations:
- `advertising_control_panel.js` - Old advertising controls
- `advertising_frame.js` - Old advertising display
- `ball_tracker_control_panel.js` - Old ball tracker controls
- `ball_tracker_overlay.js` - Old ball tracker overlay

**Replaced by**:
- `src/modules/advertising/` (modern advertising module)
- `src/modules/billiards/` (includes ball tracker)

**localStorage calls**: ~20+

---

### 6. Database Wrapper (Old IndexedDB)
**Location**: `src/common/js/`

Legacy IndexedDB wrapper:
- `idb_images.js` - Old `PCPLImageDB` class

**Replaced by**: `src/core/database/DexieWrapper.js` (Dexie.js)

---

### 7. HTML Files
**Location**: `legacy/`

Legacy HTML entry points:
- `shot_clock_display.html` - Old shot clock display

**Note**: Main legacy HTML files (`browser_source.html`, `browser_compact.html`, `control_panel.html`) were already deleted from git.

**Replaced by**: `src/modules/*/index.html` (modular HTML files)

---

## Total localStorage Operations Archived

| Component | localStorage Calls |
|-----------|-------------------|
| browser_source/ | ~30 |
| browser_compact/ | ~30 |
| control_panel.js | ~80 |
| advertising/ball tracker | ~20 |
| **TOTAL** | **~160** |

---

## Migration Path (For Reference)

If you ever need to understand how the migration was done:

### Old Pattern (localStorage):
```javascript
// Write
localStorage.setItem('p1ScoreCtrlPanel', score);

// Read
const score = localStorage.getItem('p1ScoreCtrlPanel') || '0';

// Listen for changes
window.addEventListener('storage', (e) => {
  if (e.key === 'p1ScoreCtrlPanel') {
    updateUI(e.newValue);
  }
});
```

### New Pattern (StateManager):
```javascript
// Write
await stateManager.incrementScore(1);

// Read
const state = await stateManager.getState();
const score = state.matchData.player1.score;

// Listen for changes (reactive)
stateManager.subscribe((state) => {
  updateUI(state.matchData.player1.score);
});
```

---

## Current Production System

**Control Panel**: `src/modules/master-control/index.html`
- Uses: `MasterController.js`
- State: StateManager + IndexedDB
- localStorage calls: **0**

**Overlay**: `src/core/overlay/index.html`
- Uses: `billiards/overlay/OverlayController.js`
- State: StateManager subscriptions
- localStorage calls: **0**

**Build System**: Vite (see `vite.config.js`)

---

## Notes

1. **Do not restore these files to production** - They violate THE THREE LAWS (Law #2: Database Truth)
2. **Reference only** - Use for understanding old patterns, not for active development
3. **localStorage is deprecated** - All new code must use StateManager
4. **BroadcastChannel pattern changed** - Now trigger-only, database carries data

---

## Questions?

See:
- `LOCALSTORAGE_STATUS_REPORT.md` - Full analysis of localStorage elimination
- `LOCALSTORAGE_ELIMINATION_REPORT.md` - Original audit report
- `CLAUDE.md` - Project rules and architecture (THE THREE LAWS)

---

**Archived by**: Claude Code
**Migration Status**: ✅ Complete - Production system is clean
