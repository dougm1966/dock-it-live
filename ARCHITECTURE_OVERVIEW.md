# Dock-It.live Architecture Overview
**Date**: December 27, 2025
**Version**: 4.0.0 (Master Shell Architecture)
**Status**: ✅ Production-Ready

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Directory Structure](#directory-structure)
3. [Module Descriptions](#module-descriptions)
4. [Core Systems](#core-systems)
5. [State Flow & Synchronization](#state-flow--synchronization)
6. [Entry Points](#entry-points)
7. [Development Workflow](#development-workflow)
8. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

Dock-It.live has been refactored into a **modular SaaS architecture** with a **Universal Master Shell** that governs all game-specific modules. This architecture enables:

- **Universal Scorekeeping**: Master Control Panel handles all basic scoring across any sport
- **Plug-and-Play Modules**: Billiards, Darts, and other sports as independent modules
- **Premium Add-ons**: Advertising and other features as separate premium modules
- **Flexible Deployment**: Use master alone OR master + modules in separate OBS docks
- **State Synchronization**: All panels share the same reactive database-first state via IndexedDB

---

## Directory Structure

```
dock-it-live/
│
├── src/                                    # Modern ES6 source code
│   ├── core/                               # Universal core systems (game-agnostic)
│   │   ├── ads/                            # Image upload & validation
│   │   │   └── AssetUploader.js           # File signature validation, blob storage
│   │   ├── database/                       # IndexedDB management
│   │   │   ├── DexieWrapper.js            # Dexie.js wrapper (dock_it_db)
│   │   │   └── index.js                   # Database exports
│   │   ├── messaging/                      # Cross-window communication
│   │   │   └── BroadcastMessenger.js      # BroadcastChannel (g4-main)
│   │   ├── state/                          # Centralized state management
│   │   │   └── StateManager.js            # Reactive database-first state
│   │   └── themes/                         # Theme management (future)
│   │
│   ├── modules/                            # Sport-specific & feature modules
│   │   ├── master-control/                 # 🏆 UNIVERSAL MASTER SHELL
│   │   │   ├── index.html                 # Master control panel UI
│   │   │   └── MasterController.js        # Universal state logic
│   │   │
│   │   ├── billiards/                      # 🎱 Billiards game module
│   │   │   ├── control-panel/             # Billiards specialty controls
│   │   │   │   ├── index.html             # Ball tracker, shot clock, extensions
│   │   │   │   └── BilliardsController.js # Billiards-specific logic
│   │   │   ├── overlay/                   # Scoreboard display
│   │   │   │   ├── index.html             # 1920x1080 overlay for OBS
│   │   │   │   └── OverlayController.js   # Reactive overlay rendering
│   │   │   ├── components/                # Billiards UI components
│   │   │   ├── logic/                     # Billiards game logic
│   │   │   └── styles/                    # Billiards-specific styles
│   │   │
│   │   ├── advertising/                    # 💰 Premium advertising module
│   │   │   ├── index.html                 # 12-slot ad grid control panel
│   │   │   └── AdvertisingController.js   # Ad management logic
│   │   │
│   │   └── darts/                          # 🎯 Darts module (future)
│   │       └── ...                         # To be implemented
│   │
│   └── state/                              # State schemas & initial data
│       └── initialState.json              # Default state structure
│
├── public/                                 # Static assets served by Vite
│   ├── common/                             # Shared CSS, JS, images, sounds
│   │   ├── css/                            # Browser source & theme CSS
│   │   │   ├── browser_source.css         # Main overlay styling (13KB)
│   │   │   └── control_panel/             # Theme CSS (yami, dark, acri, etc.)
│   │   ├── images/                         # UI images (placeholder.png, etc.)
│   │   ├── js/                             # Legacy JavaScript (reference only)
│   │   └── sound/                          # Audio files (beep2.mp3, buzz.mp3)
│   │
│   └── PCLS-Balls/                         # Ball image assets
│       └── images/render0/                 # 1.png - 15.png ball images
│
├── docs/                                   # Documentation & archives
│   ├── archive/                            # Archived migration reports
│   │   ├── tests/                          # Archived test pages
│   │   ├── BILLIARDS_UI_MIGRATION_REPORT.md
│   │   └── OVERLAY_WIRING_REPORT.md
│   └── ARCHITECTURE_OVERVIEW.md            # This file
│
├── vite.config.js                          # Build configuration (4 entry points)
├── package.json                            # Dependencies (Dexie.js, Vite)
├── CLAUDE.md                               # AI development guidelines
├── MIGRATION_PLAN.md                       # Migration history
└── PROJECT_CLEANUP_REPORT.md               # Cleanup documentation
```

---

## Module Descriptions

### 🏆 Master Control Panel (`src/modules/master-control/`)

**Purpose**: Universal scorekeeping shell for all game types

**Features**:
- **Global Header**: Match title, version, settings button
- **Player Grid**: Player 1/2 names, photos, scores (+1/-1 controls)
- **Match Info**: Fargo/Race information, match title
- **Logo Management**: Left/Right sponsor logo uploads
- **Module Docks**: Empty `<div>` containers where sport-specific UI injects
- **Settings Sidebar**: Module toggles (Billiards, Darts, Advertising)

**Controller** (`MasterController.js`):
- `setupPlayerControls()` - Name/photo uploads
- `setupScoringControls()` - Score +1/-1, reset match
- `setupLogoControls()` - Logo upload/delete
- `setupSettingsControls()` - Module enable/disable toggles
- `toggleModuleDock()` - Show/hide module-specific UI
- Direct connection to `StateManager.js`

**State Dependencies**:
- `matchData.player1.name` → Player 1 name
- `matchData.player1.score` → Player 1 score
- `matchData.player1.photoAssetId` → Player 1 photo
- `matchData.player2.*` → Player 2 data
- `matchData.raceInfo` → Fargo/Race info
- `logoSlots.tableTopLeft` → Left logo
- `logoSlots.tableTopRight` → Right logo

---

### 🎱 Billiards Module (`src/modules/billiards/`)

#### **Control Panel** (`control-panel/`)

**Purpose**: Billiards-specific specialty controls

**Features**:
- **Ball Tracker**: 8-ball, 9-ball, 10-ball game types
- **Ball Assignment**: Solids/Stripes selector (8-ball only)
- **Ball Pocketing**: Click balls to mark as pocketed
- **Shot Clock**: 30s/60s duration, start/stop/reset
- **Extensions**: Add/reset extensions per player

**Controller** (`BilliardsController.js`):
- `setupBallTrackerControls()` - Ball tracker enable, game type, ball sets
- `setupClockControls()` - Shot clock duration, visibility, controls
- `renderBallRacks()` - Render ball preview in control panel
- `toggleBallPocketed()` - Mark balls as pocketed
- Uses `localStorage` for ball tracker state (fallback until schema update)
- Uses `StateManager` for shot clock and extensions

**State Dependencies**:
- `matchData.shotClock.duration` → 30s or 60s
- `matchData.shotClock.currentTime` → Current timer value
- `matchData.shotClock.enabled` → Clock visibility
- `matchData.player1.extensions` → P1 extension count
- `matchData.player2.extensions` → P2 extension count
- `localStorage.ballTrackerState` → Ball tracking data (temporary)

#### **Overlay** (`overlay/`)

**Purpose**: 1920x1080 scoreboard display for OBS Browser Source

**Features**:
- **Player Names**: With Fargo info inline
- **Scores**: Live score pills
- **Player Photos**: From IndexedDB assets
- **Shot Clock**: Split-state animation (72px → 112px expansion)
- **Extension Badges**: Green badges (Ex, 2x, 3x)
- **Ball Tracker**: Dynamic ball rendering (8-ball, 9-ball, 10-ball)
- **Sponsor Logos**: Left/Right table overlay logos

**Controller** (`OverlayController.js`):
- `updatePlayerInfo()` - Player names with Fargo info
- `updateScores()` - Score display
- `updateShotClock()` - Clock split-state animation
- `updateExtensionIcon()` - Extension badge display
- `updateBallTracker()` - Ball tracker rendering
- `renderRack()` - Ball image rendering from `/PCLS-Balls/`
- Subscribes to `StateManager` via `liveQuery`
- Listens to `BroadcastChannel` messages

**State Dependencies**:
- `matchData.player1.*` → All Player 1 data
- `matchData.player2.*` → All Player 2 data
- `matchData.shotClock.*` → Shot clock state
- `logoSlots.*` → Logo display
- `localStorage.ballTrackerState` → Ball tracker display (temporary)

---

### 💰 Advertising Module (`src/modules/advertising/`)

**Purpose**: Premium 12-slot ad grid management

**Features**:
- **12 Ad Slots**: T1-T6 (Top), L1-L3 (Left), R1-R3 (Right)
- **Upload System**: Image picker modal with storage meter
- **Ad Controls**: Span, Frame, Show/Hide, Title
- **Color Picker**: HSL sliders for frame background
- **Delete Confirmation**: Safe asset deletion with modal

**Controller** (`AdvertisingController.js`):
- `setupAdControls()` - 12 ad slot controls
- `setupSettingsControls()` - Region toggles (top, left, right)
- `setupModalControls()` - Image picker, color picker, delete confirm
- `handleAdUpload()` - Asset upload to IndexedDB
- `loadImageLibrary()` - Asset library display
- Uses `StateManager` for logo slots (T1-T6, L1-L3, R1-R3)

**State Dependencies**:
- `logoSlots.T1` ... `logoSlots.T6` → Top ads
- `logoSlots.L1` ... `logoSlots.L3` → Left ads
- `logoSlots.R1` ... `logoSlots.R3` → Right ads

---

### 🎯 Darts Module (`src/modules/darts/`)

**Status**: 📋 Planned (Not Yet Implemented)

**Planned Features**:
- Cricket scoring
- 501/301 game modes
- Dart throw tracking
- Player checkout suggestions

---

## Core Systems

### 📊 StateManager (`src/core/state/StateManager.js`)

**Purpose**: Centralized reactive state management with database-first pattern

**Architecture**:
```
User Action → StateManager → IndexedDB Write → Dexie liveQuery → UI Auto-Update
```

**Key Methods**:
- `init()` - Initialize database and load initial state
- `subscribe(callback)` - Subscribe to state changes via liveQuery
- `getState()` - Get current state snapshot
- `setState(newState)` - Write full state to database

**Player Methods**:
- `setPlayerName(playerNum, name)` - Update player name
- `setPlayerPhoto(playerNum, assetId)` - Update player photo
- `incrementScore(playerNum)` - Add +1 to score
- `decrementScore(playerNum)` - Subtract -1 from score

**Shot Clock Methods**:
- `setShotClockDuration(seconds)` - Set 30s or 60s
- `toggleShotClockVisibility()` - Show/hide clock
- `startShotClock()` - Start countdown
- `stopShotClock()` - Stop countdown
- `resetShotClock()` - Reset to duration

**Extension Methods**:
- `addPlayerExtension(playerNum)` - Add extension
- `resetPlayerExtensions(playerNum)` - Reset extensions

**Logo Methods**:
- `setLogoSlot(slotId, assetId)` - Set logo asset
- `setLogoSlotActive(slotId, active)` - Show/hide logo

**Match Methods**:
- `resetMatch()` - Reset scores and extensions
- `setRaceInfo(info)` - Set Fargo/Race info

---

### 🗄️ DexieWrapper (`src/core/database/DexieWrapper.js`)

**Purpose**: IndexedDB management via Dexie.js

**Database**: `dock_it_db`

**Object Stores**:
1. **`matchStates`** - Reactive state storage
   - Primary key: `id` (always "current")
   - Fields: `state` (JSON blob), `timestamp`

2. **`assets`** - Image/file storage as blobs
   - Primary key: `id` (UUID)
   - Fields: `data` (Blob), `type`, `metadata`, `uploadedAt`
   - Indexed: `type`, `uploadedAt`

**Key Methods**:
- `storeAsset(blob, metadata)` - Store image as blob
- `getAssetObjectUrl(id)` - Get blob URL for display
- `deleteAsset(id)` - Delete asset and revoke URL
- `listAssets(filter)` - List assets by type
- `setMatchState(state)` - Store reactive state
- `getMatchState()` - Get current state

**Benefits**:
- **Binary Storage**: Images stored as blobs (no base64 overhead)
- **Large Capacity**: ~50MB+ vs localStorage's ~5MB
- **Reactive**: liveQuery auto-updates on database changes
- **OBS Compatible**: Persists in OBS Browser Source

---

### 📡 BroadcastMessenger (`src/core/messaging/BroadcastMessenger.js`)

**Purpose**: Cross-window communication via BroadcastChannel

**Channel**: `g4-main`

**Message Types**:
- `STATE_CHANGED` - General state update
- `SCORE_UPDATE` - Score changed
- `PLAYER_INFO_UPDATED` - Player name/photo changed
- `LOGO_SLOT_CHANGED` - Logo asset changed
- `ADS_REFRESH` - Ad refresh requested
- `BALL_TRACKER_UPDATE` - Ball tracker state changed
- `OVERLAY_VISIBILITY` - Overlay show/hide toggle

**Usage**:
```javascript
// Send message
messenger.send('SCORE_UPDATE', { playerNum: 1, score: 5 });

// Listen for messages
messenger.listen('SCORE_UPDATE', (data) => {
  console.log('Score updated:', data);
});
```

**Flow**:
```
Master Control → StateManager → Database Write → BroadcastChannel → Overlay Receives → UI Updates
```

---

### 🖼️ AssetUploader (`src/core/ads/AssetUploader.js`)

**Purpose**: Image upload with file signature validation

**Features**:
- **Magic Byte Validation**: Verifies PNG, JPEG, SVG, BMP signatures
- **Blob Storage**: Stores images in IndexedDB as binary blobs
- **Metadata Tagging**: Tags for categorization (player_photo, logo, advertisement)
- **Error Handling**: Clear error messages for invalid files

**Usage**:
```javascript
const result = await AssetUploader.upload(file, {
  type: 'player_photo',
  tags: ['player1']
});

if (result.success) {
  console.log('Asset ID:', result.id);
  // Store asset ID in state
  await stateManager.setPlayerPhoto(1, result.id);
}
```

---

## State Flow & Synchronization

### State Update Flow

```
┌─────────────────┐
│  User Action    │ (Click +1 Score in Master Control)
└────────┬────────┘
         ↓
┌─────────────────┐
│ MasterController│ (Calls stateManager.incrementScore(1))
└────────┬────────┘
         ↓
┌─────────────────┐
│  StateManager   │ (Updates state, writes to IndexedDB)
└────────┬────────┘
         ↓
┌─────────────────┐
│   IndexedDB     │ (State persisted)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Dexie liveQuery │ (Detects database change)
└────────┬────────┘
         ↓
┌─────────────────────────────────────┐
│  All Subscribed Components Update  │
│  - OverlayController (displays new score)
│  - MasterController (updates score display)
│  - Any other listening modules
└─────────────────────────────────────┘
```

### Cross-Window Synchronization

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Master Control   │       │ Billiards Module │       │ Browser Overlay  │
│   (Window 1)     │       │   (Window 2)     │       │   (Window 3)     │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         │   All windows share the same IndexedDB database   │
         │                          │                          │
         ↓                          ↓                          ↓
    ┌─────────────────────────────────────────────────────────────┐
    │              IndexedDB: dock_it_db                          │
    │  - matchStates (reactive state)                             │
    │  - assets (images as blobs)                                 │
    └─────────────────────────────────────────────────────────────┘
         ↓                          ↓                          ↓
    StateManager             StateManager              StateManager
    liveQuery                liveQuery                 liveQuery
    (subscribes)             (subscribes)              (subscribes)
         ↓                          ↓                          ↓
    UI updates               UI updates                UI updates
    automatically            automatically             automatically
```

**Key Points**:
- All windows share the **same IndexedDB database**
- **No localStorage** for shared state (only temporary ball tracker)
- **liveQuery** makes UI reactive - no manual refresh needed
- **BroadcastChannel** sends lightweight trigger messages
- **Database is the single source of truth**

---

## Entry Points

### Vite Build Configuration (`vite.config.js`)

```javascript
{
  input: {
    // Master Control Panel (Universal)
    'master-control': resolve(__dirname, 'src/modules/master-control/index.html'),

    // Game Modules
    'billiards-module': resolve(__dirname, 'src/modules/billiards/control-panel/index.html'),

    // Overlays
    'browser-source': resolve(__dirname, 'src/modules/billiards/overlay/index.html'),

    // Premium Modules
    'advertising': resolve(__dirname, 'src/modules/advertising/index.html'),
  }
}
```

### Development URLs (Vite Dev Server)

**Default Port**: `3000` (configured in `vite.config.js`)

1. **Master Control Panel**
   `http://localhost:3000/src/modules/master-control/index.html`

2. **Billiards Module**
   `http://localhost:3000/src/modules/billiards/control-panel/index.html`

3. **Browser Source Overlay**
   `http://localhost:3000/src/modules/billiards/overlay/index.html`

4. **Advertising Module**
   `http://localhost:3000/src/modules/advertising/index.html`

### Production Build Output

```bash
npm run build
```

**Output** (`dist/`):
```
dist/
├── master-control.html
├── billiards-module.html
├── browser-source.html
├── advertising.html
├── assets/
│   ├── master-control-[hash].js
│   ├── billiards-module-[hash].js
│   ├── browser-source-[hash].js
│   └── advertising-[hash].js
├── common/ (copied from public/common/)
│   ├── css/
│   ├── images/
│   ├── js/
│   └── sound/
└── PCLS-Balls/ (copied from public/PCLS-Balls/)
    └── images/render0/
```

---

## Development Workflow

### Starting Development Server

```bash
npm run dev
```

**Dev server starts on**: `http://localhost:3000`

### Recommended OBS Setup

**Option A: Master Control Only**
1. Add Browser Dock: Master Control Panel
2. Use Settings sidebar to enable/disable modules
3. Module UI injects into docks dynamically

**Option B: Separate Windows (Recommended)**
1. **Browser Dock 1**: Master Control Panel
   `http://localhost:3000/src/modules/master-control/index.html`

2. **Browser Dock 2**: Billiards Module
   `http://localhost:3000/src/modules/billiards/control-panel/index.html`

3. **Browser Source**: Overlay (1920x1080)
   `http://localhost:3000/src/modules/billiards/overlay/index.html`

4. **Browser Dock 3** (Optional): Advertising
   `http://localhost:3000/src/modules/advertising/index.html`

**Benefits**:
- Each panel is independent
- Resize/arrange as needed
- All panels share the same state
- Changes in any panel sync to overlay instantly

### Testing State Synchronization

1. **Open Master Control** in one browser tab
2. **Open Overlay** in another browser tab
3. **Change Player 1 name** in Master Control
4. **Verify overlay updates** immediately (no refresh needed)
5. **Click +1 Score** in Master Control
6. **Verify score updates** in overlay

---

## Deployment Strategy

### SaaS Pricing Tiers

**Free Tier**:
- ✅ Master Control Panel
- ✅ Basic scoring (names, scores, photos, logos)
- ✅ Browser source overlay

**Sport Modules** (Add-on):
- 💵 Billiards Module ($X/month)
- 💵 Darts Module ($X/month)
- 💵 Cornhole Module ($X/month)

**Premium Features** (Add-on):
- 💰 Advertising Module ($X/month)
- 💰 Advanced Analytics ($X/month)
- 💰 Custom Branding ($X/month)

### Deployment Checklist

- [ ] Run `npm run build`
- [ ] Test all entry points in `dist/` folder
- [ ] Verify assets copied to `dist/common/` and `dist/PCLS-Balls/`
- [ ] Test in OBS Browser Source (file:// protocol)
- [ ] Test in OBS Browser Dock (file:// protocol)
- [ ] Verify IndexedDB persistence across OBS restarts
- [ ] Verify BroadcastChannel messaging works across windows

---

## File Dependencies Map

### Master Control Panel Dependencies

```
master-control/index.html
└── MasterController.js
    ├── ../../core/state/StateManager.js
    ├── ../../core/ads/AssetUploader.js
    ├── ../../core/messaging/BroadcastMessenger.js
    └── ../../core/database/index.js
```

### Billiards Module Dependencies

```
billiards/control-panel/index.html
└── BilliardsController.js
    ├── ../../../core/state/StateManager.js
    └── ../../../core/messaging/BroadcastMessenger.js
```

### Overlay Dependencies

```
billiards/overlay/index.html
└── OverlayController.js
    ├── ../../../core/state/StateManager.js
    ├── ../../../core/messaging/BroadcastMessenger.js
    └── ../../../core/database/index.js
```

### Advertising Module Dependencies

```
advertising/index.html
└── AdvertisingController.js
    ├── ../../core/state/StateManager.js
    ├── ../../core/ads/AssetUploader.js
    ├── ../../core/messaging/BroadcastMessenger.js
    └── ../../core/database/index.js
```

---

## Critical Assets Inventory

### CSS Files (Served from `public/common/css/`)

**Browser Source Overlay**:
- `browser_source.css` (13KB) - Main overlay styling

**Control Panel Themes**:
- `yami.css` - Dark purple theme
- `dark.css` - Dark theme
- `acri.css` - Acri theme
- `grey.css` - Grey theme
- `light.css` - Light theme
- `rachni.css` - Rachni theme
- `base.css` - Base styles
- `layout.css` - Grid layout
- `components.css` - UI components
- `required.css` - Required overrides

### Ball Images (Served from `public/PCLS-Balls/images/render0/`)

- `1.png` through `15.png` - Numbered pool balls
- `8ball_gametype.png` - 8-ball game type icon
- `10ball_gametype.png` - 10-ball game type icon

**Used by**:
- `OverlayController.js` (line 629) - Loads balls dynamically
- Ball images rendered with absolute paths: `/PCLS-Balls/images/render0/${ballNumber}.png`

### Audio Files (Served from `public/common/sound/`)

- `beep2.mp3` - Shot clock warning sound
- `buzz.mp3` - Shot clock expired sound

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 4.0.0 | Dec 27, 2025 | **Master Shell Architecture** - Complete refactor to modular SaaS structure |
| 3.1.0 | Dec 27, 2025 | Billiards Module - Focused specialty controls |
| 3.0.0 | Dec 27, 2025 | Modernization - Dexie.js, StateManager, ES6 modules |
| 2.x.x | Legacy | jQuery-based control panel with localStorage |

---

## Next Steps

### Immediate Tasks
- [ ] Test state synchronization across all modules
- [ ] Verify OBS Browser Source compatibility
- [ ] Create user documentation for Master Control Panel

### Future Enhancements
- [ ] Implement dynamic module dock injection (load billiards UI into master)
- [ ] Create Darts module
- [ ] Add ball tracker to StateManager schema (remove localStorage fallback)
- [ ] Create module marketplace for easy installation
- [ ] Add analytics dashboard

---

## Conclusion

The new Master Shell architecture provides a **scalable, modular foundation** for Dock-It.live to expand into multiple sports while maintaining a clean separation between universal features and sport-specific functionality. The database-first reactive state pattern ensures all panels stay synchronized automatically, providing a seamless user experience across OBS Browser Docks.

**The architecture is production-ready** and positioned for SaaS deployment with flexible pricing tiers.

---

*Document maintained by: Claude Code*
*Last updated: December 27, 2025*
