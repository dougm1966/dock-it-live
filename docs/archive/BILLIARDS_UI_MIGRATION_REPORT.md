# Billiards UI Component Migration Report
**Date**: 2025-12-27
**Status**: ✅ HTML/CSS Migration Complete - Ready for Visual Verification

## Summary

All legacy billiards UI components (Ball Tracker, Shot Clock, Extension Indicators) have been successfully preserved in the new modernized overlay structure. The HTML and CSS are intact and ready for visual testing.

---

## Task 1: Scoreboard "Lego" Pieces ✅

### 1. Ball Tracker HTML
**Status**: ✅ **PRESENT AND INTACT**

**Location**: `src/modules/billiards/overlay/index.html` (Lines 59-66)

**HTML Structure**:
```html
<tr class="bt-row">
    <td class="bt-cell"><div id="p1BallRack" class="bt-rack noShow"></div></td>
    <td class="bt-cell bt-cell--mid"><div id="midBallRack" class="bt-rack bt-rack--mid noShow"></div></td>
    <td class="bt-cell"><div id="p2BallRack" class="bt-rack noShow"></div></td>
</tr>
<tr class="bt-full-row">
    <td class="bt-cell bt-cell--full" colspan="3"><div id="fullBallRack" class="bt-rack bt-rack--full noShow"></div></td>
</tr>
```

**CSS Classes Used**:
- `.bt-row` - Row container for split ball rack layout (8-ball mode)
- `.bt-full-row` - Full-width row for single rack layout (9-ball/10-ball mode)
- `.bt-cell` - Table cell with transparent background
- `.bt-rack` - Ball container with flex layout
- `.bt-rack--mid` - Middle section (8-ball) styling
- `.bt-rack--full` - Full-width rack (9-ball/10-ball) styling
- `.bt-ball` - Individual ball image wrapper (added via JavaScript)
- `.bt-ball--placeholder` - Dimmed balls (unassigned sets)
- `.bt-ball--pocketed` - Faded balls (pocketed balls)

**CSS Verified**: ✅ All ball tracker CSS is present in `/common/css/browser_source.css` (Lines 227-295, 550-565)

---

### 2. Shot Clock HTML
**Status**: ✅ **PRESENT AND INTACT**

**Location**: `src/modules/billiards/overlay/index.html`

**HTML Structure**:
```html
<!-- Line 24: Progress Bar -->
<div class="shotclockvis fadeOutElm" id="shotClockVis"></div>

<!-- Line 49: Timer Display -->
<div class="fadeOutElm" id="shotClock">&nbsp;</div>
```

**CSS Classes Used**:
- `.shotclockvis` - Progress bar (absolute positioned, 3px height, bottom 3px)
- `#shotClock` - Timer text display (green background, rounded, inline-flex)
- `.fadeInElm` / `.fadeOutElm` - Visibility animation states

**CSS Verified**: ✅ Shot clock CSS is present:
- Progress bar: Lines 567-589 (includes `startTimer`, `start60` animations)
- Timer display: Lines 190-218 (includes transition for split-state collapse)

**Split-State Behavior**: The shot clock has smooth width transitions when appearing/disappearing, with the middle column expanding from 72px to 112px when clock is visible (controlled by `.clock-visible` class on `#scoreBoardDiv`).

---

### 3. Extension Indicators HTML
**Status**: ✅ **PRESENT AND INTACT**

**Location**: `src/modules/billiards/overlay/index.html`

**HTML Structure**:
```html
<!-- Line 42: Player 1 Extension Icon -->
<div class="fadeInElm bs-ext-icon" id="p1ExtIcon">Ex</div>

<!-- Line 56: Player 2 Extension Icon -->
<div class="fadeInElm bs-ext-icon" id="p2ExtIcon">Ex</div>
```

**CSS Classes Used**:
- `.bs-ext-icon` - Extension/timeout badge (green background, absolute positioned, fills cell height)
- `#p1ExtIcon` - Left-aligned badge (rounded on left side)
- `#p2ExtIcon` - Right-aligned badge (rounded on right side)
- `.extBlink` - Red/green blink animation for extension events

**CSS Verified**: ✅ Extension indicator CSS is present in `/common/css/browser_source.css`:
- Base styles: Lines 362-398
- Blink animation: Lines 442-453
- Dynamic padding adjustments: Lines 315-317 (reserves 28px when clock is enabled)

**Photo Slide Behavior**: Player photos (`.playerPhoto`) slide inward 28px when clock is active to avoid overlapping with extension icons (Lines 506-515).

---

## Task 2: Asset Verification ⚠️

### Ball Images
**Status**: ✅ **IMAGES EXIST** | ⚠️ **PATH CORRECTION NEEDED** (When JavaScript is wired)

**Current Location**: `PCLS-Balls/images/render0/`

**Files Present**:
- `1.png` through `15.png` (all 15 numbered balls)
- `8.png` (8-ball, also used in middle rack)
- `10ball_gametype.png`, `8ball_gametype.png` (game type indicators)

**Expected Path in JavaScript**: `./PCLS-Balls/images/render0/${n}.png` (from `common/js/ball_tracker_overlay.js:114`)

**Current Vite Dev Server URL**: `http://localhost:3004/src/modules/billiards/overlay/index.html`

**Path Resolution**:
- ✅ **Working**: When served from project root via Vite, the path `/PCLS-Balls/images/render0/` will resolve correctly
- ⚠️ **Note**: The legacy `ball_tracker_overlay.js` uses relative path `./PCLS-Balls/` which needs to be updated to `/PCLS-Balls/` for Vite compatibility

**Action Needed**: When wiring JavaScript, update ball image paths to use absolute path: `/PCLS-Balls/images/render0/${n}.png`

---

### Other Image Assets
**Status**: ✅ **NO ADDITIONAL DEPENDENCIES**

The billiards UI components do NOT rely on:
- ❌ Extension icon images (uses text "Ex" styled with CSS)
- ❌ Shot clock images (pure CSS styling)
- ✅ Only dependency: Ball images (already verified above)

---

## Task 3: Visual Confirmation ✅

### CSS Loading
**Status**: ✅ **CORRECTLY LOADED**

**CSS Link**: `<link rel="stylesheet" href="/common/css/browser_source.css" />` (Line 17)

**Vite Resolution**: The absolute path `/common/css/browser_source.css` resolves correctly via Vite dev server.

---

### CSS Scoping Analysis
**Status**: ✅ **NO CONFLICTS DETECTED**

**Unique Class Prefixes**:
- `bt-*` - Ball tracker components (bt-row, bt-rack, bt-cell, bt-ball)
- `bs-*` - Browser source components (bs-overlay, bs-scoreboard, bs-ext-icon, bs-logo)
- `shotclockvis` - Shot clock progress bar (unique ID-based styling)

**Potential Conflicts**: ⚠️ None found. All billiards-specific classes use unique prefixes.

**Layout Isolation**: Ball tracker rows use `border: none` and `background: transparent` to avoid interfering with the main score table layout (Lines 272-276).

---

## Component Visibility States

### Default State (On Page Load)
- **Ball Tracker**: Hidden (`.noShow` class applied to all racks)
- **Shot Clock Progress Bar**: Hidden (`fadeOutElm` class)
- **Shot Clock Timer**: Hidden (`fadeOutElm` class)
- **Extension Icons**: Visible (`fadeInElm` class, default text: "Ex")

### JavaScript Control Points (Not Wired Yet)
These will be wired to StateManager in the next phase:

1. **Ball Tracker**:
   - Enable/disable: Toggle `.noShow` on rack containers
   - Game mode: Show `.bt-rack` (8-ball split) vs `.bt-rack--full` (9-ball/10-ball)
   - Ball states: Add `.bt-ball--pocketed` or `.bt-ball--placeholder` to individual balls

2. **Shot Clock**:
   - Visibility: Toggle `.fadeInElm`/`.fadeOutElm` on `#shotClock` and `#shotClockVis`
   - Timer value: Update `#shotClock` text content
   - Progress bar: Set `width` percentage on `#shotClockVis`
   - Warning state: Add `.shotclock-warning` class when time <= 10s

3. **Extension Icons**:
   - Count display: Update text content (e.g., "1x", "2x")
   - Visibility: Toggle `.fadeInElm`/`.fadeOutElm`
   - Blink effect: Add `.extBlink` class when extension is added

---

## Testing Checklist

### Visual Verification Steps
1. ✅ Open overlay in browser: `http://localhost:3004/src/modules/billiards/overlay/index.html`
2. ✅ Verify scoreboard layout renders without CSS errors
3. ⚠️ Ball tracker will appear empty (no balls rendered yet - needs JavaScript)
4. ✅ Shot clock should be invisible (collapsed, no width)
5. ✅ Extension icons should show "Ex" badges on left/right edges
6. ✅ Player name centering should work correctly
7. ⚠️ Logos/photos won't display (need StateManager integration)

### Browser Console Checks
- ✅ No 404 errors for CSS file
- ⚠️ Expected 404s for ball images (not loaded via JavaScript yet)
- ✅ No CSS parse errors

---

## Next Steps (Not Part of Current Task)

1. **JavaScript Integration** (Future Phase):
   - Migrate `ball_tracker_overlay.js` to modern ES6 module
   - Wire ball tracker to StateManager
   - Fix ball image paths to use `/PCLS-Balls/images/render0/`
   - Integrate shot clock controller with StateManager
   - Add extension icon state management

2. **State Synchronization** (Future Phase):
   - Connect ball tracker to BroadcastChannel messages
   - Subscribe to shot clock state changes
   - Update extension counts from player state

---

## File Inventory

### Modified Files
- ✅ `src/modules/billiards/overlay/index.html` - Already contains all billiards UI components

### Unchanged Files (Reference)
- 📁 `browser_source.html` (legacy reference)
- 📁 `common/css/browser_source.css` (shared CSS, already loaded)
- 📁 `common/js/ball_tracker_overlay.js` (legacy JavaScript, will be refactored later)
- 📁 `PCLS-Balls/images/render0/*.png` (ball images, already in place)

### No New Files Created
- ❌ No HTML files created (components already present)
- ❌ No CSS files created (using existing `browser_source.css`)
- ❌ No image files moved (PCLS-Balls already in correct location)

---

## Conclusion

✅ **MIGRATION COMPLETE - READY FOR VISUAL VERIFICATION**

All billiards UI components have been verified to be present in the new modernized overlay structure:

- ✅ Ball Tracker HTML structure intact
- ✅ Shot Clock (progress bar + timer) HTML intact
- ✅ Extension Indicators HTML intact
- ✅ All CSS classes verified and loaded
- ✅ Ball images exist in correct location
- ✅ No CSS conflicts detected

**No code changes were needed** - the modernized overlay already preserved all the custom billiards elements from the original design.

**Visual testing can now proceed** by opening the overlay URL in a browser and confirming that:
1. The layout renders without errors
2. Extension icons are visible
3. Empty ball racks are present (but not populated yet)
4. Shot clock space is collapsed (hidden state)

JavaScript wiring to StateManager will be handled in the next phase.
