# Ball Tracker Integration Plan
## Phase Two: Solids/Stripes Integration

### Project Overview
Integrate the ball tracking functionality directly into the main `g4ScoreBoard` system.

Primary goals:

- [ ] Provide a **settings toggle** to enable/disable ball tracking.
- [ ] When enabled, provide **8-ball player assignment (solids/stripes) with Swap** and display balls **directly under each player name**.
- [ ] Pocketed balls are **faded but still visible** (no collapsing spacing).
- [ ] When assignments are unassigned, show **placeholders** with defaults:
  - [ ] P1 defaults to **solids placeholders**.
  - [ ] P2 defaults to **stripes placeholders**.
  - [ ] Swap flips these defaults.
- [ ] 9-ball and 10-ball: keep the current behavior (no major refactor).

### Current Architecture Analysis

#### Main Scoreboard (`PCPL ScoreBoard`)
- **Browser Source**: `browser_source.html` - OBS overlay displaying scores and player info
- **Control Panel**: `control_panel.html` - Interface for managing game state
- **Communication**: Uses BroadcastChannel API for real-time updates
- **Styling**: Modern CSS with custom properties for scaling
- **Storage**: IndexedDB for images, localStorage for settings

#### Ball Tracker (`g4BallTracker-1.0.3`)
- **Standalone**: Separate Docker panel with independent functionality
- **Ball Tracking**: Tracks balls 1-15 for 8-ball, 9-ball, and 10-ball games
- **Communication**: BroadcastChannel `g4-balls` with existing integration hooks
- **Assets**: Ball images in multiple color schemes (black, white, standard, AI_render)
- **Configuration**: Flexible positioning and sizing options

#### Current Repo Reality (as of this plan)
- [ ] The repo contains a working standalone ball tracker under `PCLS-Balls/`.
- [ ] There is no `g4BallTracker-1.0.3/` directory in this repo workspace; legacy references should be updated/removed.

### Integration Strategy

## Scope Decisions

- [ ] 8-ball receives a **major refactor** (player-assigned sets displayed under player names).
- [ ] 9-ball and 10-ball stay functionally the same.
- [ ] The standalone tracker (`PCLS-Balls`) is used as reference; end goal is integrated functionality in main scoreboard.

## UX Requirements (Locked)

## Two Ball UI Surfaces (Must Stay Distinct)

- [ ] **Control Panel (Operator UI)**: a **single row** of ball toggles/buttons used by the operator to mark balls pocketed/unpocketed, swap assignments, change game type, etc.
- [ ] **Overlay (Viewer UI)**: balls rendered **under each player name** on the browser source, driven entirely by the authoritative state.

### Layout Rules (Clarity)

- [ ] The control panel row is for **input** (operator interaction).
- [ ] The overlay racks are for **output** (viewer display).
- [ ] The control panel row and overlay racks are synchronized via the state model; they are not the same UI element.

### 8-ball Under-Name Display

- [ ] Balls appear **directly under the name of each player**.
- [ ] Each player rack is **7 slots**.
- [ ] Slots do **not** collapse when pocketed.
- [ ] Pocketed state is rendered by **fading opacity** while still visible.

### Placeholders + Defaults

- [ ] When ball tracking is enabled but player set is unassigned:
  - [ ] P1 shows **solids placeholders** (1-7) under P1 name.
  - [ ] P2 shows **stripes placeholders** (9-15) under P2 name.
- [ ] Swap flips these defaults.

### Swap

- [ ] Swap must swap which set renders under which player name.
- [ ] Swap must also swap which ball set appears on the left vs right side of the **ball toggle row** in the master control panel (assignment-following).

### Control Panel Layout (Critical)

- [ ] Ball tracking has a **settings toggle**: enabled/disabled.
- [ ] When disabled:
  - [ ] The "Update Info" row remains **full width**, exactly as today.
  - [ ] Ball tracking UI is hidden.
- [ ] When enabled:
  - [ ] The "Update Info" row becomes split: **Game selector on the left**, Update Info button on the right.
  - [ ] Update Info button width matches the fields above it.

## Message/State Model (Authoritative)

### Persisted Keys (localStorage)

- [ ] `ballTrackingEnabled` (boolean)
- [ ] `ballTrackerState` (JSON string; authoritative state object)

### Authoritative Payload (BroadcastChannel)

- [ ] Use a single payload that fully describes current state.
- [ ] Browser source renders purely from state.

```js
{
  ballTracker: {
    enabled: true|false,
    gameType: "eight"|"nine"|"ten",
    ballSize: 35|45|55,
    assignments: {
      p1Set: "solids"|"stripes"|"unassigned",
      p2Set: "solids"|"stripes"|"unassigned"
    },
    defaults: {
      p1Default: "solids"|"stripes" // p2Default is implied as opposite
    },
    pocketed: {
      "1": false,
      "2": false,
      "3": false,
      "4": false,
      "5": false,
      "6": false,
      "7": false,
      "8": false,
      "9": false,
      "10": false,
      "11": false,
      "12": false,
      "13": false,
      "14": false,
      "15": false
    }
  }
}
```

### Messaging Rules

- [ ] When `ballTrackingEnabled` is toggled OFF:
  - [ ] Broadcast a single `{ ballTracker: { enabled:false } }` state so overlays hide immediately.
  - [ ] Control panel hides all tracker controls and restores full-width Update Info UI.
- [ ] When toggled ON:
  - [ ] Broadcast full state snapshot.
  - [ ] Default placeholder orientation is P1 solids / P2 stripes.

## Implementation Phases (Detailed Checklist)

### Phase 0: Preflight + Safety

- [ ] Create a working branch for the refactor.
- [ ] Confirm which URLs are used in OBS:
  - [ ] Dock uses `PCLS-Balls/control-panel.html` (standalone reference).
  - [ ] Browser source uses the main `browser_source.html` overlay.
- [ ] Confirm ball image asset location to use for integration (source is `PCLS-Balls/images/...`).

### Phase 1: Settings Toggle + Control Panel Layout Switching

#### 1.1 Settings Toggle

- [ ] Add a settings control: "Enable Ball Tracking".
- [ ] Persist `ballTrackingEnabled` in localStorage.
- [ ] On load, apply UI state based on `ballTrackingEnabled`.

#### 1.2 Update Info Row Layout Switching

- [ ] Implement two mutually exclusive rows:
  - [ ] Full-width Update Info row (existing)
  - [ ] Split row containing Game selector + Update Info button
- [ ] Ensure when ball tracking is OFF, the UI is identical to today.
- [ ] Ensure when ball tracking is ON, Update Info button width matches the input fields.

#### 1.3 Ball Tracker Section Visibility

- [ ] Wrap all ball tracker controls inside a container that is only visible when enabled.
- [ ] Define show/hide rules for all new UI elements.

### Phase 2: Control Panel Ball Tracking Controls (Enabled Mode)

#### 2.1 Game Selector (in split row)

- [ ] Add selector for `eight|nine|ten`.
- [ ] Decide/reset behavior on game switch:
  - [ ] Reset pocketed state when switching game types.
- [ ] Broadcast updated state on change.

#### 2.2 Player Assignment Controls + Swap

- [ ] P1 Set selector: Unassigned/Solids/Stripes.
- [ ] P2 Set selector: Unassigned/Solids/Stripes.
- [ ] Swap button:
  - [ ] Swaps assignments when assigned.
  - [ ] If unassigned, swaps defaults (P1 default flips).
- [ ] Guardrails:
  - [ ] Prevent invalid state: both players solids or both players stripes.
  - [ ] Auto-assign the opposite set when one is chosen (unless explicitly overridden).

#### 2.3 Ball Toggle Row in the Main Control Panel (Operator UI)

- [ ] Add a **single row** of ball buttons/checkboxes inside the main control panel.
- [ ] Behavior:
  - [ ] The row is visually split into a left group and right group to match player assignment/default.
  - [ ] Swap flips which group appears on the left vs right side of the row.
  - [ ] Toggling marks a ball as pocketed/unpocketed in state.
- [ ] 8-ball toggle:
  - [ ] Provide a dedicated 8-ball control.

#### 2.4 Size + Show/Hide + Reset

- [ ] Ball size selector (35/45/55) updates state and persists.
- [ ] Show/Hide button toggles `ballTracker.enabled`.
- [ ] Reset button clears pocketed state (and assignments if desired).

### Phase 3: Browser Source 8-Ball Under-Name Rendering

#### 3.1 HTML Placement

- [ ] Add containers under each player name:
  - [ ] `p1BallRack` under Player 1 name.
  - [ ] `p2BallRack` under Player 2 name.
- [ ] Add neutral 8-ball placement (centered between names OR a dedicated middle container).

#### 3.2 Placeholder Rendering

- [ ] If P1 is unassigned, render solids placeholders (1-7) under Player 1.
- [ ] If P2 is unassigned, render stripes placeholders (9-15) under Player 2.
- [ ] Swap flips which defaults render.

#### 3.3 Pocketed Rendering

- [ ] Pocketed balls remain visible but faded.
- [ ] Do not remove elements; apply CSS class/opacity.

#### 3.4 Enable/Disable

- [ ] If ball tracking disabled, hide all ball tracker visuals.
- [ ] If enabled, show per state.

### Phase 4: 9-Ball and 10-Ball (Preserve Behavior)

- [ ] Keep existing 9-ball and 10-ball presentation logic.
- [ ] Ensure new state model can represent 9-ball and 10-ball pocketed subset cleanly.
- [ ] Ensure game switching resets state as planned.

### Phase 5: Compatibility + Migration

- [ ] Decide whether to keep emitting legacy `g4-balls` messages during transition.
- [ ] Update docs to refer to integrated ball tracking instead of standalone dock.

### Phase 6: Testing Checklist (OBS)

#### 6.1 Control Panel UI

- [ ] Ball tracking toggle OFF:
  - [ ] Update Info button is full width.
  - [ ] No game selector is shown.
  - [ ] No ball tracker controls are shown.
- [ ] Ball tracking toggle ON:
  - [ ] Game selector appears to the left of Update Info.
  - [ ] Update Info button width matches the input fields.

#### 6.2 8-Ball Overlay

- [ ] With tracking enabled, before assignment:
  - [ ] P1 shows solids placeholders under Player 1.
  - [ ] P2 shows stripes placeholders under Player 2.
- [ ] Assign P1=Stripes, P2=Solids:
  - [ ] Balls appear under correct names.
- [ ] Swap:
  - [ ] Under-name racks swap correctly.
  - [ ] Control panel ball toggle row swaps correctly.
- [ ] Pocketed toggle:
  - [ ] Ball fades but stays visible.
- [ ] Reset:
  - [ ] Clears pocketed state.

#### 6.3 9/10 Behavior

- [ ] 9-ball display unchanged.
- [ ] 10-ball display unchanged.

#### 6.4 Show/Hide

- [ ] Show/Hide hides and re-shows ball visuals reliably.

---

**Document Updated**: December 26, 2025  
**Author**: Cascade AI Assistant  
**Version**: 2.0  
**Status**: Planning Phase
