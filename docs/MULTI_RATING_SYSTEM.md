# Multi-Rating System Architecture

## Overview

The Dock-It.live scoreboard now supports multiple rating types across different sports through a flexible, extensible rating system. This document explains the architecture, data flow, and usage of the multi-rating system.

## Supported Rating Types

### Billiards/Pool
- **Fargo Rating**: FargoRate skill rating system (0-1000 scale)
- **Skill Level**: Traditional APA/BCA skill levels (1-9)

### Darts
- **PPD** (Points Per Dart): Average points scored per dart thrown
- **MPR** (Marks Per Round): Cricket statistics for soft-tip darts

### Extensible for Future Sports
The system is designed to easily add new rating types for sports like:
- Bowling (average score)
- Table Tennis (USATT rating)
- Cornhole (ACL rating)

---

## Data Schema

### matchData Structure

```javascript
{
  "activeSport": "billiards",  // Current sport: "billiards" | "darts" | etc.
  "raceInfo": "Race to 7",
  "player1": {
    "name": "John Doe",
    "score": 3,
    "fargoInfo": "Fargo 520",  // Legacy field (backward compatible)
    "ratings": {
      "fargo": 520,           // Billiards: Fargo rating
      "ppd": null,            // Darts: Points Per Dart
      "mpr": null,            // Darts: Marks Per Round
      "display": "fargo",     // Which rating to display
      "source": "scoreholio"  // Source: "manual" | "scoreholio" | "database" | "player-manager"
    }
  },
  "player2": {
    // Same structure as player1
  }
}
```

### Ratings Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `fargo` | number \| null | FargoRate rating (billiards) |
| `ppd` | number \| null | Points Per Dart (darts) |
| `mpr` | number \| null | Marks Per Round (darts) |
| `display` | string | Which rating to show: "fargo", "ppd", "mpr" |
| `source` | string | Data source: "manual", "scoreholio", "database", "player-manager" |

---

## Architecture Components

### 1. State Management (`StateManager.js`)

**New Methods:**

```javascript
// Set player ratings object
await stateManager.setPlayerRatings(playerNum, {
  fargo: 520,
  ppd: null,
  mpr: null,
  display: 'fargo',
  source: 'scoreholio'
});

// Set active sport
await stateManager.setActiveSport('billiards');
```

**Backward Compatibility:**
- The `fargoInfo` field is automatically updated when ratings are set
- Legacy overlays that read `fargoInfo` will continue to work

### 2. Scoreholio Bridge (`BridgeController.js`)

**Sport Detection:**
```javascript
detectSportFromHtml(doc) {
  // Checks for sport indicators in HTML:
  // - CSS classes: .billiards-match, .darts-match
  // - Data attributes: [data-sport="billiards"]
  // - Page title keywords: "pool", "darts"
}
```

**Rating Extraction:**
```javascript
extractRatings(doc, playerNum) {
  // Sport-specific CSS selector maps
  if (activeSport === 'billiards') {
    // Extract Fargo rating
    // Selectors: .fargo-val, .fargo-rating, [data-rating="fargo"]
  } else if (activeSport === 'darts') {
    // Extract PPD and MPR
    // Selectors: .ppd-val, .avg-val, .mpr-val
  }
}
```

**CSS Selector Configuration:**
```javascript
this.ratingSelectors = {
  billiards: {
    fargo: '.fargo-val, .fargo-rating, [data-rating="fargo"], .rating-pill.fargo',
    skillLevel: '.skill-level, .player-level'
  },
  darts: {
    ppd: '.ppd-val, .avg-val, [data-rating="ppd"], .rating-pill.ppd',
    mpr: '.mpr-val, [data-rating="mpr"], .rating-pill.mpr'
  }
};
```

### 3. Master Control Panel (`MasterController.js`)

**Rating Source Badges:**

Visual indicators show where rating data came from:

| Source | Badge | Color | Description |
|--------|-------|-------|-------------|
| Manual | **M** | Blue (#3b82f6) | User typed in the rating |
| Scoreholio | **S** | Green (#10b981) | Fetched from Scoreholio |
| Database | **DB** | Purple (#8b5cf6) | Loaded from local roster |
| Player Manager | **PM** | Orange (#f59e0b) | Selected from Player Manager |

**Implementation:**
```javascript
updateRatingSourceBadge(playerNum, ratings) {
  const badge = document.getElementById(`p${playerNum}RatingSource`);
  badge.textContent = sourceMap[ratings.source].label;
  badge.style.background = sourceMap[ratings.source].color;
  badge.title = `${sourceMap[ratings.source].tooltip} - ${ratings.display}`;
}
```

### 4. UI Components

**HTML Structure:**
```html
<!-- Player 1 Ranking Input -->
<input type="text" id="p1Ranking" placeholder="Fargo, ELO, etc.">
<span id="p1RatingSource" class="rating-source-badge" title="Rating source">
  S
</span>
```

**CSS Styling:**
```css
.rating-source-badge {
  display: inline-block;
  margin-left: 4px;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
  color: white;
}
```

---

## Data Flow

### 1. Manual Entry (Control Panel)

```
User types "Fargo 520" in P1 Ranking input
    ↓
MasterController detects change event
    ↓
StateManager.setPlayerFargo(1, "Fargo 520")
    ↓
Rating source badge shows "M" (Manual)
    ↓
Overlay updates from IndexedDB
```

### 2. Scoreholio Bridge Sync

```
ScoreholioBridge fetches HTML from Scoreholio
    ↓
detectSportFromHtml() → Returns "billiards" or "darts"
    ↓
extractRatings(doc, 1) → Returns { fargo: 520, ppd: null, mpr: null, display: "fargo", source: "scoreholio" }
    ↓
syncPlayerRatings(1, ratings)
    ↓
StateManager.setPlayerRatings(1, ratings)
    ↓
Rating source badge shows "S" (Scoreholio)
    ↓
BroadcastMessenger.send('MATCH_STATE_CHANGED')
    ↓
Overlay reads from IndexedDB → Displays "FARGO 520"
```

### 3. Player Manager Selection

```
User selects player from Player Manager
    ↓
Player Manager broadcasts PLAYER_SELECTED message
    ↓
MasterController.handlePlayerSelected(payload)
    ↓
StateManager.setPlayerRatings(1, {
  fargo: 520,
  ppd: null,
  mpr: null,
  display: 'fargo',
  source: 'player-manager'
})
    ↓
Rating source badge shows "PM" (Player Manager)
    ↓
Overlay updates
```

---

## Usage Examples

### Example 1: Billiards Match from Scoreholio

**Scoreholio HTML:**
```html
<div class="billiards-match">
  <div class="player-1">
    <span class="name">John Doe</span>
    <span class="fargo-val">520</span>
  </div>
  <div class="player-2">
    <span class="name">Jane Smith</span>
    <span class="fargo-val">480</span>
  </div>
</div>
```

**Extracted Data:**
```javascript
{
  activeSport: 'billiards',
  player1: {
    name: 'John Doe',
    ratings: {
      fargo: 520,
      ppd: null,
      mpr: null,
      display: 'fargo',
      source: 'scoreholio'
    }
  },
  player2: {
    name: 'Jane Smith',
    ratings: {
      fargo: 480,
      ppd: null,
      mpr: null,
      display: 'fargo',
      source: 'scoreholio'
    }
  }
}
```

**Control Panel Display:**
- P1 Ranking: "Fargo 520" with green **S** badge
- P2 Ranking: "Fargo 480" with green **S** badge

### Example 2: Darts Match from Scoreholio

**Scoreholio HTML:**
```html
<div class="darts-match">
  <div class="player-1">
    <span class="name">Alice Cooper</span>
    <span class="ppd-val">45.2</span>
    <span class="mpr-val">3.8</span>
  </div>
</div>
```

**Extracted Data:**
```javascript
{
  activeSport: 'darts',
  player1: {
    name: 'Alice Cooper',
    ratings: {
      fargo: null,
      ppd: 45.2,
      mpr: 3.8,
      display: 'ppd',  // PPD takes precedence
      source: 'scoreholio'
    }
  }
}
```

**Control Panel Display:**
- P1 Ranking: "PPD 45.2" with green **S** badge

---

## Customization Guide

### Adding a New Sport

**1. Update initialState.json:**
```json
{
  "matchData": {
    "player1": {
      "ratings": {
        "fargo": null,
        "ppd": null,
        "mpr": null,
        "bowling_avg": null,  // NEW
        "display": "fargo",
        "source": "manual"
      }
    }
  }
}
```

**2. Update BridgeController.js:**
```javascript
this.ratingSelectors = {
  billiards: { /* ... */ },
  darts: { /* ... */ },
  bowling: {  // NEW
    average: '.bowling-avg, .avg-score, [data-rating="avg"]'
  }
};
```

**3. Add Sport Detection Logic:**
```javascript
detectSportFromHtml(doc) {
  const sportIndicators = {
    billiards: [/* ... */],
    darts: [/* ... */],
    bowling: ['.bowling-match', '[data-sport="bowling"]']  // NEW
  };
}
```

**4. Add Rating Extraction:**
```javascript
extractRatings(doc, playerNum) {
  // ... existing code ...

  if (this.activeSport === 'bowling') {
    const avgSelectors = this.ratingSelectors.bowling.average.split(',').map(s =>
      `${playerPrefix} ${s.trim()}, ${s.trim()}`
    ).join(', ');

    const avgValue = this.extractFloat(doc, avgSelectors);
    if (avgValue) {
      ratings.bowling_avg = avgValue;
      ratings.display = 'bowling_avg';
    }
  }
}
```

### Adding a New Rating Source

**1. Update MasterController.js:**
```javascript
const sourceMap = {
  'manual': { label: 'M', color: '#3b82f6', tooltip: 'Manual Entry' },
  'scoreholio': { label: 'S', color: '#10b981', tooltip: 'Scoreholio' },
  'database': { label: 'DB', color: '#8b5cf6', tooltip: 'Local Database' },
  'player-manager': { label: 'PM', color: '#f59e0b', tooltip: 'Player Manager' },
  'fargorate-api': { label: 'FR', color: '#ef4444', tooltip: 'FargoRate API' }  // NEW
};
```

**2. Update Rating Sync Logic:**
```javascript
async syncPlayerRatings(playerNum, ratings) {
  // Set source to 'fargorate-api' when fetching from API
  ratings.source = 'fargorate-api';
  await this.stateManager.setPlayerRatings(playerNum, ratings);
}
```

---

## Testing Checklist

- [ ] **Manual Entry**
  - [ ] Enter "Fargo 520" → Badge shows "M" (blue)
  - [ ] Enter "PPD 45.2" → Badge shows "M" (blue)
  - [ ] Clear rating → Badge hides

- [ ] **Scoreholio Bridge (Billiards)**
  - [ ] Connect to Scoreholio billiards court
  - [ ] Verify Fargo rating extracted
  - [ ] Badge shows "S" (green)
  - [ ] fargoInfo field backward compatible

- [ ] **Scoreholio Bridge (Darts)**
  - [ ] Connect to Scoreholio darts match
  - [ ] Verify PPD/MPR extracted
  - [ ] Badge shows "S" (green)
  - [ ] Display preference: PPD > MPR

- [ ] **Player Manager**
  - [ ] Select player from roster
  - [ ] Verify rating loads
  - [ ] Badge shows "PM" (orange)

- [ ] **State Persistence**
  - [ ] Reload page → Ratings persist
  - [ ] Badge source persists
  - [ ] activeSport persists

- [ ] **Overlay Compatibility**
  - [ ] Legacy overlays read fargoInfo correctly
  - [ ] New overlays read ratings.display
  - [ ] BroadcastChannel messages trigger updates

---

## Migration Notes

### Backward Compatibility

**Legacy Code:**
```javascript
// Old way (still works)
const fargo = state.matchData.player1.fargo;
const fargoInfo = state.matchData.player1.fargoInfo;
```

**New Code:**
```javascript
// New way (recommended)
const ratings = state.matchData.player1.ratings;
const displayRating = ratings[ratings.display];  // e.g., ratings.fargo
const displayName = ratings.display.toUpperCase();  // "FARGO"
const displayText = `${displayName} ${displayRating}`;  // "FARGO 520"
```

### Migrating Existing Data

If you have existing matches with only `fargo` and `fargoInfo` fields:

```javascript
// Migration script (run once)
async function migrateRatings() {
  const state = await stateManager.getState();

  for (const playerNum of [1, 2]) {
    const player = state.matchData[`player${playerNum}`];

    if (player.fargo && !player.ratings) {
      // Create ratings object from legacy data
      player.ratings = {
        fargo: player.fargo,
        ppd: null,
        mpr: null,
        display: 'fargo',
        source: 'manual'  // Assume manual since we don't know the original source
      };

      await stateManager.setPlayerRatings(playerNum, player.ratings);
    }
  }
}
```

---

## Troubleshooting

### Rating Badge Not Showing

**Problem:** Badge element exists but is hidden.

**Solution:**
1. Check if `ratings` object exists in state
2. Check if `ratings.source` is set
3. Verify badge display style: `style.display = 'inline-block'`

**Debug:**
```javascript
const state = await stateManager.getState();
console.log('Player 1 ratings:', state.matchData.player1.ratings);
```

### Scoreholio Not Extracting Ratings

**Problem:** Names and scores work, but ratings are null.

**Solution:**
1. Inspect Scoreholio HTML structure
2. Update CSS selectors in `BridgeController.ratingSelectors`
3. Check console for parse errors

**Debug:**
```javascript
// Add to parseScoreholioHtml()
console.log('Detected sport:', this.activeSport);
console.log('Player 1 ratings:', matchData.player1.ratings);
console.log('HTML sample:', html.substring(0, 1000));
```

### Wrong Rating Type Displayed

**Problem:** PPD showing instead of Fargo, or vice versa.

**Solution:**
1. Check `ratings.display` field
2. Verify `activeSport` is set correctly
3. Ensure rating extraction logic sets `display` correctly

**Debug:**
```javascript
const ratings = state.matchData.player1.ratings;
console.log('Display:', ratings.display);  // Should be "fargo", "ppd", or "mpr"
console.log('Active sport:', state.matchData.activeSport);
```

---

## Performance Considerations

### IndexedDB Writes

Each rating update writes to IndexedDB. For high-frequency updates (e.g., live API polling):

**Optimization:**
```javascript
// Debounce rating updates
let updateTimeout;
function debouncedRatingUpdate(playerNum, ratings) {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    stateManager.setPlayerRatings(playerNum, ratings);
  }, 500);  // Wait 500ms after last update
}
```

### BroadcastChannel Messages

Minimize redundant broadcasts by checking if ratings actually changed:

```javascript
async syncPlayerRatings(playerNum, newRatings) {
  const state = await this.stateManager.getState();
  const oldRatings = state.matchData[`player${playerNum}`].ratings;

  // Only update if ratings changed
  if (JSON.stringify(oldRatings) !== JSON.stringify(newRatings)) {
    await this.stateManager.setPlayerRatings(playerNum, newRatings);
  }
}
```

---

## Future Enhancements

- [ ] **Rating History Tracking** - Store rating changes over time
- [ ] **Multi-Sport Tournaments** - Switch between sports mid-event
- [ ] **Rating Verification** - Validate ratings against official databases
- [ ] **Custom Rating Types** - User-defined rating systems
- [ ] **Rating Trends** - Show rating changes over time (up/down arrows)
- [ ] **API Integrations** - FargoRate API, USATT API, etc.
- [ ] **Rating Analytics** - Win rates by rating differential

---

## Summary

The multi-rating system provides:

✅ **Flexibility** - Support for any sport's rating system
✅ **Transparency** - Visual badges show data source
✅ **Backward Compatibility** - Legacy code still works
✅ **Extensibility** - Easy to add new sports and rating types
✅ **Reliability** - IndexedDB persistence with BroadcastChannel sync

For questions or issues, refer to the main [Scoreholio Bridge README](../src/modules/scoreholio-bridge/README.md).
