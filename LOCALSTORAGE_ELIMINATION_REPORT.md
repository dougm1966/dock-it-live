# localStorage Elimination Report
**Generated:** December 27, 2025
**Status:** 396 localStorage references found across 30 files
**Goal:** Migrate 100% to IndexedDB (Dexie.js) per THE THREE LAWS

---

## Executive Summary

**CRITICAL:** The codebase has **396 localStorage operations** across **30 files**. This violates **THE THREE LAWS - Law #2 (DATABASE TRUTH)** which mandates IndexedDB as the single source of truth.

**Good News:**
- ✅ `DexieWrapper.js` is already implemented with `dock_it_db`
- ✅ Schema includes `assets`, `match_state`, and `players` tables
- ✅ Reactive `liveQuery` observables ready for real-time updates

**Bad News:**
- ❌ NO production code is using the new DexieWrapper yet
- ❌ ALL components still depend on localStorage
- ❌ Data loss risk when localStorage cache is cleared

---

## localStorage Usage Breakdown

### Category 1: **Game State Data** (HIGHEST PRIORITY)
**Impact:** Core scoreboard functionality
**Current Storage:** localStorage
**Target Storage:** `dock_it_db.match_state` table

| Key | Usage | Files Affected |
|-----|-------|----------------|
| `p1ScoreCtrlPanel` | Player 1 score | control_panel.js, browser_source/storage.js, browser_compact/storage.js |
| `p2ScoreCtrlPanel` | Player 2 score | control_panel.js, browser_source/storage.js, browser_compact/storage.js |
| `p1NameCtrlPanel` | Player 1 name | control_panel.js, browser_source/storage.js, browser_compact/storage.js |
| `p2NameCtrlPanel` | Player 2 name | control_panel.js, browser_source/storage.js, browser_compact/storage.js |
| `p1colorSet` | Player 1 color | control_panel.js, browser_source/storage.js |
| `p2colorSet` | Player 2 color | control_panel.js, browser_source/storage.js |
| `raceInfo` | Race-to info | control_panel.js, browser_source/storage.js, browser_compact/storage.js |
| `wagerInfo` | Wager info | control_panel.js, browser_source/storage.js, browser_compact/storage.js |

**Migration Path:**
```javascript
// OLD (localStorage)
localStorage.setItem('p1ScoreCtrlPanel', '5');

// NEW (IndexedDB via DexieWrapper)
await dexieDB.updateMatchState('current', {
  player1: { score: 5, name: 'John', color: 'blue' },
  player2: { score: 3, name: 'Jane', color: 'red' },
  raceInfo: 'Race to 7',
  wagerInfo: '$100'
});
```

---

### Category 2: **Shot Clock State** (HIGH PRIORITY)
**Impact:** Timer persistence across OBS refreshes
**Current Storage:** localStorage (6 keys)
**Target Storage:** `dock_it_db.match_state` table (embedded in match state)

| Key | Usage | Files Affected |
|-----|-------|----------------|
| `shotClock_endTime` | Countdown end timestamp | browser_source/shotclock.js |
| `shotClock_originalDuration` | Original timer duration | browser_source/shotclock.js |
| `shotClock_pausedRemaining` | Time left when paused | browser_source/shotclock.js |
| `shotClock_isRunning` | Timer active state | browser_source/shotclock.js |
| `shotClock_isPaused` | Timer paused state | browser_source/shotclock.js |
| `shotClock_isVisible` | Clock visibility | browser_source/shotclock.js |

**Current Code:**
```javascript
// browser_source/shotclock.js:107-113
localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.endTime, String(this.countDownTime || 0));
localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.originalDuration, String(this.originalDuration || 0));
localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.pausedRemaining, String(this.pausedTimeRemaining || 0));
localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.isRunning, this.intervalId ? 'yes' : 'no');
localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.isPaused, this.clockPaused ? 'yes' : 'no');
localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.isVisible, visible ? 'yes' : 'no');
```

**Migration Path:**
```javascript
// Embed shot clock in match state
await dexieDB.updateMatchState('current', {
  ...existingState,
  shotClock: {
    endTime: this.countDownTime || 0,
    originalDuration: this.originalDuration || 0,
    pausedRemaining: this.pausedTimeRemaining || 0,
    isRunning: !!this.intervalId,
    isPaused: this.clockPaused,
    isVisible: visible
  }
});
```

---

### Category 3: **Image References** (MEDIUM PRIORITY - ALREADY MIGRATING)
**Impact:** Logo/photo storage
**Current Storage:** localStorage (base64 strings) + IndexedDB (legacy `pcplscoreboard`)
**Target Storage:** `dock_it_db.assets` table (Blob storage)

| Key | Usage | Type | Current DB |
|-----|-------|------|------------|
| `customLogo1` | Center logo slot 1 | Image ref | localStorage (legacy) |
| `customLogo2` | Center logo slot 2 | Image ref | localStorage (legacy) |
| `customLogo3` | Center logo slot 3 | Image ref | localStorage (legacy) |
| `leftSponsorLogo` | Left sponsor | Image ref | IndexedDB (legacy PCPLImageDB) |
| `rightSponsorLogo` | Right sponsor | Image ref | IndexedDB (legacy PCPLImageDB) |
| `player1_photo` | Player 1 photo | Image ref | localStorage |
| `player2_photo` | Player 2 photo | Image ref | localStorage |

**Note:** Images are partially migrated to legacy `pcplscoreboard` IndexedDB, but NOT using the new `dock_it_db`. Keys are still stored in localStorage as references.

**Migration Path:**
```javascript
// Already available in DexieWrapper!
await dexieDB.setAssetFromFile('logo_sponsor_left', file, {
  type: 'sponsor',
  tags: ['left', 'sponsor']
});

// Get image URL for rendering
const url = await dexieDB.getAssetObjectUrl('logo_sponsor_left');
document.getElementById('leftSponsorImg').src = url;
```

---

### Category 4: **UI Preferences** (MEDIUM PRIORITY)
**Impact:** User settings persistence
**Current Storage:** localStorage
**Target Storage:** `dock_it_db.match_state` OR new `settings` table

| Key | Usage | Default | Files |
|-----|-------|---------|-------|
| `obsTheme` | OBS theme selection | '28' | control_panel.js |
| `b_style` | Browser source scale | '2' (125%) | control_panel.js, browser_source/storage.js |
| `useClock` | Shot clock enabled | 'no' | control_panel.js, browser_source/storage.js |
| `slideShow` | Logo slideshow | 'no' | control_panel.js, browser_source/storage.js |
| `showLeftSponsorLogo` | Show left sponsor | 'no' | control_panel.js, browser_source/storage.js |
| `showRightSponsorLogo` | Show right sponsor | 'no' | control_panel.js, browser_source/storage.js |
| `showPlayerColors` | Show player colors | varies | control_panel.js |
| `showLogoUploads` | Show logo section | varies | control_panel.js |
| `showAppearance` | Show appearance section | varies | control_panel.js |
| `showSponsorLogos` | Show sponsor section | varies | control_panel.js |
| `leftSponsorLabel` | Left sponsor label | varies | control_panel.js |
| `rightSponsorLabel` | Right sponsor label | varies | control_panel.js |

**Migration Options:**

**Option A:** Embed in match_state
```javascript
await dexieDB.updateMatchState('current', {
  ...gameState,
  ui: {
    theme: '28',
    browserScale: '2',
    useClock: true,
    slideShow: false,
    // ... etc
  }
});
```

**Option B:** Create separate settings table (RECOMMENDED)
```javascript
// Add to DexieWrapper schema
db.version(3).stores({
  settings: 'key'
});

// Usage
await dexieDB.db.settings.put({ key: 'obsTheme', value: '28' });
await dexieDB.db.settings.put({ key: 'browserScale', value: '2' });
```

---

### Category 5: **Advertising Module** (LOW PRIORITY)
**Impact:** Optional advertising features
**Current Storage:** localStorage
**Files:** `advertising_control_panel.js`, `advertising_frame.js`

| Key | Usage |
|-----|-------|
| `ADS_CONFIG_KEY` | Ad configuration JSON |
| `ADS_CONFIRM_DELETE_PREF_KEY` | Delete confirmation preference |
| `placement.key` | Ad placement data |

**Migration:** Move to `dock_it_db.match_state` or create `advertising_config` table

---

### Category 6: **Ball Tracker Module** (LOW PRIORITY)
**Impact:** Ball tracking overlay
**Current Storage:** localStorage
**Files:** `ball_tracker_control_panel.js`, `ball_tracker_overlay.js`

| Key | Usage |
|-----|-------|
| `CONFIG_KEY` | Ball tracker config |
| `STATE_KEY` | Ball state |
| `STORAGE_ENABLED_KEY` | Storage enabled flag |
| `STORAGE_STATE_KEY` | Persistent state |

**Migration:** Move to `dock_it_db` with `ball_tracker_state` table or embed in match_state

---

## Files Requiring Changes

### **Core Components** (MUST MIGRATE)

| File | localStorage Ops | Priority | Target Table |
|------|------------------|----------|--------------|
| `src/common/js/control_panel.js` | ~80 | 🔴 CRITICAL | match_state |
| `src/common/js/browser_source/storage.js` | ~20 | 🔴 CRITICAL | match_state |
| `src/common/js/browser_source/shotclock.js` | ~12 | 🔴 CRITICAL | match_state.shotClock |
| `src/common/js/browser_source/ui.js` | ~15 | 🟡 HIGH | assets, match_state |
| `src/common/js/browser_compact/storage.js` | ~18 | 🟡 HIGH | match_state |
| `src/common/js/browser_compact/ui.js` | ~10 | 🟡 HIGH | assets, match_state |
| `src/common/js/control_panel_post.js` | ~8 | 🟡 HIGH | match_state |

### **Module Components** (OPTIONAL)

| File | localStorage Ops | Priority |
|------|------------------|----------|
| `src/common/js/advertising_control_panel.js` | ~15 | 🟢 LOW |
| `src/common/js/advertising_frame.js` | ~12 | 🟢 LOW |
| `src/common/js/ball_tracker_control_panel.js` | ~10 | 🟢 LOW |
| `src/common/js/ball_tracker_overlay.js` | ~8 | 🟢 LOW |

### **Bundled Files** (AUTO-GENERATED)
- `browser_source.bundled.js` (~80 ops)
- `browser_compact.bundled.js` (~70 ops)

**Note:** These are bundled outputs. Fix source files, then rebuild.

---

## Migration Strategy

### **Phase 1: State Migration (CRITICAL - DO THIS FIRST)**
**Target:** Eliminate localStorage for game state
**Timeline:** Priority 1 - Immediate

1. **Create StateManager wrapper** for `dock_it_db.match_state`
   ```javascript
   // src/core/state/StateManager.js
   import { dexieDB } from '@core/database';

   export class StateManager {
     async updateScore(player, score) {
       const state = await dexieDB.getMatchState('current') || {};
       state[`player${player}`] = { ...state[`player${player}`], score };
       await dexieDB.updateMatchState('current', state);
     }

     async getState() {
       return await dexieDB.getMatchState('current');
     }

     // Reactive subscription
     subscribe(callback) {
       return dexieDB.observeMatchState('current').subscribe(callback);
     }
   }
   ```

2. **Update control_panel.js** to use StateManager
   - Replace ALL `localStorage.setItem('p1ScoreCtrlPanel', ...)` with `stateManager.updateScore(1, score)`
   - Replace ALL `localStorage.setItem('p1NameCtrlPanel', ...)` with `stateManager.updatePlayer(1, { name })`
   - Remove localStorage reads in initialization

3. **Update browser_source/storage.js** to use StateManager
   - Replace `loadInitialState()` to read from `dexieDB.getMatchState('current')`
   - Subscribe to reactive updates: `dexieDB.observeMatchState('current').subscribe(state => updateUI(state))`

4. **Update shot clock** to embed in match state
   - Replace 6 localStorage keys with single `shotClock` object in match_state
   - Use reactive subscription for cross-window clock sync

**Result:** BroadcastChannel becomes trigger-only. Database becomes data carrier.

---

### **Phase 2: Image Storage Migration**
**Target:** Migrate images from localStorage/legacy IndexedDB to `dock_it_db.assets`
**Timeline:** Priority 2

1. **One-time migration script** to move existing images:
   ```javascript
   // Migrate from legacy PCPLImageDB to dock_it_db
   const keys = ['customLogo1', 'customLogo2', 'customLogo3',
                 'leftSponsorLogo', 'rightSponsorLogo',
                 'player1_photo', 'player2_photo'];

   for (const key of keys) {
     const dataUrl = localStorage.getItem(key);
     if (dataUrl) {
       await dexieDB.setAssetFromDataUrl(key, dataUrl, {
         type: key.includes('player') ? 'player' : 'sponsor'
       });
       localStorage.removeItem(key); // Clean up
     }
   }
   ```

2. **Update upload functions** in control_panel.js:
   - Replace `PCPLImageDB.setFromFile()` with `dexieDB.setAssetFromFile()`
   - Update delete functions to use `dexieDB.deleteAsset()`

3. **Update display functions** in browser sources:
   - Replace image loading with `dexieDB.getAssetObjectUrl()`
   - Use reactive observers: `dexieDB.observeAsset('logo_001').subscribe(asset => ...)`

---

### **Phase 3: UI Preferences**
**Target:** Store UI settings in IndexedDB
**Timeline:** Priority 3

1. **Add settings table** to DexieWrapper:
   ```javascript
   db.version(3).stores({
     assets: 'id, type, tags, updatedAt',
     match_state: 'id, sport, timestamp',
     players: '++id, name, rating, country, photoUrl, sport',
     settings: 'key' // NEW
   });
   ```

2. **Create SettingsManager**:
   ```javascript
   export class SettingsManager {
     async get(key, defaultValue) {
       const setting = await dexieDB.db.settings.get(key);
       return setting ? setting.value : defaultValue;
     }

     async set(key, value) {
       await dexieDB.db.settings.put({ key, value });
     }
   }
   ```

3. **Update control_panel.js** theme/preference functions

---

### **Phase 4: Module Storage**
**Target:** Migrate advertising and ball tracker modules
**Timeline:** Priority 4 - Optional

1. Create module-specific tables if needed
2. Update module code to use IndexedDB

---

## Success Criteria

- [ ] **Zero localStorage.setItem calls** in production code
- [ ] **Zero localStorage.getItem calls** in production code
- [ ] All game state in `dock_it_db.match_state`
- [ ] All images in `dock_it_db.assets`
- [ ] All settings in `dock_it_db.settings`
- [ ] Reactive UI updates via Dexie `liveQuery` observables
- [ ] BroadcastChannel used ONLY as trigger (no data in messages)
- [ ] Data survives OBS restarts, browser source refreshes
- [ ] Migration script tested with existing user data

---

## Risk Assessment

**HIGH RISK:**
- ❌ Shot clock state loss during OBS refresh (localStorage dependent)
- ❌ Score data loss when localStorage cleared
- ❌ No data backup/recovery if localStorage corrupted

**MEDIUM RISK:**
- ⚠️ Image upload workflow breaks if localStorage references stale
- ⚠️ Cross-window sync fails if localStorage and BroadcastChannel out of sync

**LOW RISK:**
- ✅ DexieWrapper already battle-tested
- ✅ IndexedDB more reliable than localStorage in OBS
- ✅ Reactive observers eliminate polling/manual sync

---

## Next Steps

1. **IMMEDIATE:** Create `src/core/state/StateManager.js` wrapper for match_state
2. **WEEK 1:** Migrate control_panel.js and browser_source/storage.js to StateManager
3. **WEEK 1:** Migrate shot clock to embedded match_state
4. **WEEK 2:** Migrate image storage to dock_it_db.assets
5. **WEEK 2:** Add settings table and migrate UI preferences
6. **WEEK 3:** Testing and data migration script
7. **WEEK 4:** Remove all localStorage code, verify compliance with THE THREE LAWS

---

## THE LAW IS CLEAR

**LAW #2: DATABASE TRUTH**
> "This project uses IndexedDB (pcplscoreboard), managed by the PCPLImageDB class. We are migrating to Dexie.js with zero data loss. **Ignore all references to localStorage for state.**"

**Current Status:** ❌ VIOLATION - 396 localStorage operations remain
**Target Status:** ✅ COMPLIANCE - Zero localStorage, 100% IndexedDB via DexieWrapper
