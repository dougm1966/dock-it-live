# CueSport Scoreboard Enhancement Plan (UPDATED)

## Overview
Adding player photo circles inside name bars, corner logo slideshows with customizable sizing, and control panel layout improvements.

---

## Phase 0: Control Panel Layout Redesign

### Current Status
- Phase 1 (Player Photos) is COMPLETE and working

### Control Panel Layout Changes

#### Score Buttons - Reorganize by Action
**Current:** Each player has +1/-1 stacked vertically
**New:** Group by action type
```
Row 1: [ Doug +1 Score ] [ Mark +1 Score ]
Row 2: [ Doug -1 Score ] [ Mark -1 Score ]
```

#### Shot Clock Row - 3 Buttons Side by Side
**Current:** Cramped "30s SL", "Clock" buttons with abbreviated labels
**New:** Full-width row with clear labels
```
[ 30s Shot Clock ] [ 60s Shot Clock ] [ Hide Clock ]
```

#### Extension Buttons - Dual Purpose Toggle
**Current:** Separate "Doug's Extension" button AND "Reset Doug's Ext" button
**New:** Single toggle button that changes label based on state

- **Default state:** "Doug's Extension" / "Mark's Extension"
- **After clicked (extension used):** Label changes to "Reset Doug's Extension" / "Reset Mark's Extension"
- **Click again:** Resets extension, label returns to original

**This eliminates the separate "Reset Doug's Ext" and "Reset Mark's Ext" buttons from the Reset section.**

#### Updated Button Flow (Top to Bottom)
1. Player info section (names, photos, game info)
2. Update Info button
3. Color dropdowns + Swap
4. Score buttons (reorganized: +1s together, -1s together)
5. Shot clock row: 30s | 60s | Hide Clock
6. Extension buttons (dual-purpose toggle)
7. Stop Clock button
8. Reset Scores and Extensions
9. Logo/checkbox section
10. Sponsor Logos section
11. **NEW: Corner Logos section (Phase 2)**

---

## Phase 1: Player Photo Circles (COMPLETE ✓)

### Prompt 1A: Add Player Photo Upload Controls Next to Name Fields
```
I'm working on the CueSport-Scoreboard project. I need to add player photo upload functionality to the control panel.

In control_panel.html, find the Player/Team Name input fields in the Info section. Add upload buttons directly next to each name field:
- "Upload Photo" button next to Player/Team 1 Name field
- "Upload Photo" button next to Player/Team 2 Name field
- Max file size: 2.4MB (same as existing logos)
- Follow the same HTML structure and styling as the existing logo upload buttons

The uploaded images should be stored in localStorage with keys:
- player1_photo
- player2_photo

Update common/js/control_panel.js to handle these uploads, following the same pattern as the existing logo upload handlers.
```

### Prompt 1B: Display Player Photos as Circles (Non-Draggable, Auto-Resize)
```
In browser_source.html, I need to add two circular image elements for player photos.

Add two <img> elements inside the existing player name bar containers:
- One for Player 1 (left side of their name bar)
- One for Player 2 (right side of their name bar)
- Give them IDs: player1-photo and player2-photo
- Position them inside the colored name bars

In common/js/browser_source.js, load the player photos from localStorage (keys: player1_photo, player2_photo) and display them in these elements.

In the CSS files (common/css/browser_source/125.css, 150.css, 200.css), style these images:
- border-radius: 50% (makes them circular)
- Set appropriate width/height for each size variant that scales proportionally (e.g., 50px for 125, 60px for 150, 80px for 200)
- Position them appropriately inside the name bars (fixed position, not draggable)
- Add object-fit: cover to handle all image aspect ratios properly
- Images should automatically resize when switching between scoreboard sizes

These photos should NOT be draggable - they have fixed positions inside the name bars.
```

---

## Phase 2: Corner Logo Slideshows with Custom Sizing

### Prompt 2A: Add Corner Logo Upload Controls with Size Settings
```
In control_panel.html, add a new section for corner logos with:

Heading: "Corner Logos"

Settings section:
- Checkbox: "Enable Corner Logos"
- Number input: "Rotation Delay (seconds)" with default value of 5
- Number input: "Max Logo Width (px)" with default value of 400
- Number input: "Max Logo Height (px)" with default value of 400

Two subsections:
1. "Top Left Corner" with 3 upload buttons: "Upload TL1", "Upload TL2", "Upload TL3"
2. "Top Right Corner" with 3 upload buttons: "Upload TR1", "Upload TR2", "Upload TR3"

LocalStorage keys:
- corner_tl1, corner_tl2, corner_tl3 (top-left images)
- corner_tr1, corner_tr2, corner_tr3 (top-right images)
- corner_rotation_delay (rotation timing)
- corner_max_width (maximum logo width)
- corner_max_height (maximum logo height)
- corner_logos_enabled (enable/disable toggle)

Update common/js/control_panel.js to handle these uploads and settings, following the existing logo upload pattern.
```

### Prompt 2B: Create Corner Logo Slideshow Display with Aspect Ratio Preservation
```
In browser_source.html, add two slideshow containers positioned in the top corners:
- Container ID: top-left-corner-logos (position: absolute, top-left corner)
- Container ID: top-right-corner-logos (position: absolute, top-right corner)
- Each container should have 3 <img> elements that will cycle through

In common/js/browser_source.js:
- Load corner logos from localStorage (corner_tl1-3, corner_tr1-3)
- Load size settings from localStorage (corner_max_width, corner_max_height)
- Apply max-width and max-height to logo images dynamically based on settings
- Implement slideshow rotation logic similar to the existing sponsor logo slideshow
- Use the corner_rotation_delay setting for timing
- Only display if corner_logos_enabled is true
- Logos should maintain their aspect ratio regardless of whether they're square, horizontal, or vertical

In CSS files (125.css, 150.css, 200.css):
- Position top-left container: top: 0; left: 0;
- Position top-right container: top: 0; right: 0;
- Logo images should use:
  * object-fit: contain (maintains aspect ratio)
  * max-width and max-height will be set dynamically via JavaScript
- Add smooth fade transitions between logos (opacity transitions, similar to existing sponsor slideshow)
- Scale the base positioning appropriately for each size variant (125, 150, 200)

Important: Logos should always align to their respective corners (top-left logos flush to top-left, top-right logos flush to top-right) while respecting the max dimensions and maintaining aspect ratio.
```

### Prompt 2C: Make Corner Logo Containers Draggable
```
In common/js/browser_source.js, extend the existing draggable positioning system to include:
- #top-left-corner-logos
- #top-right-corner-logos

Follow the same pattern used for the existing draggable elements (scoreboard, game info, sponsor logos).

Store their positions in localStorage with keys:
- corner_tl_position
- corner_tr_position

Make sure positions persist across page refreshes and that the containers can be repositioned via the OBS "Interact" feature.

Note: The individual logos inside are NOT draggable - only the containers themselves can be repositioned.
```

---

## Phase 3: Testing & Refinement

### Prompt 3A: Test Player Photos
```
I've implemented player photo circles. Please review the code for:

1. Control panel integration:
   - Are upload buttons properly positioned next to name fields?
   - Is the upload functionality working correctly?
   - Are images being stored in localStorage?

2. Photo display:
   - Are they properly circular?
   - Do they scale correctly across all size variants (125, 150, 200)?
   - Are they positioned well inside the name bars?
   - Do they handle both square and rectangular images properly with object-fit: cover?
   - Are they fixed in position (not draggable)?

3. Responsiveness:
   - Do photos resize automatically when switching scoreboard sizes?

Identify any bugs or issues and suggest fixes.
```

### Prompt 3B: Test Corner Logo Slideshows
```
I've implemented corner logo slideshows with custom sizing. Please review the code for:

1. Control panel settings:
   - Do the size input controls work correctly?
   - Is the rotation delay setting functional?
   - Does the enable/disable toggle work?
   - Are all settings persisting in localStorage?

2. Logo display and sizing:
   - Do logos maintain their aspect ratio?
   - Are square, horizontal, and vertical logos all displaying correctly?
   - Do the max-width and max-height settings work dynamically?
   - Are logos properly aligned to their corners (top-left flush left, top-right flush right)?
   - Is the slideshow rotation working smoothly?
   - Do the fade transitions work properly?

3. Positioning:
   - Do the containers position correctly in all size variants (125, 150, 200)?
   - Are containers draggable via OBS Interact?
   - Do positions persist after refresh?
   - Are there any conflicts with existing draggable elements?

4. Edge cases:
   - What happens with very large images (2MB)?
   - What happens with very small images?
   - What happens with extreme aspect ratios (very wide or very tall)?

Identify any bugs or issues and suggest fixes.
```

---

## Phase 4: Polish & Documentation

### Prompt 4: Final Polish and Documentation
```
Please add the following polish and documentation:

1. Visual indicators in the control panel:
   - Show thumbnail previews of uploaded photos/logos
   - Show which slots currently have images uploaded
   - Add clear/reset buttons for each photo/logo position

2. User feedback:
   - Loading indicators during image upload
   - Success/error messages
   - File size warnings if image is too large

3. Code comments explaining:
   - How the aspect ratio preservation works (object-fit: contain)
   - How the slideshow rotation timing works
   - How the dynamic max-width/max-height sizing works
   - How player photos resize across different scoreboard sizes
   - How drag positioning is stored/retrieved for corner containers

4. Update README.md with new documentation section covering:
   - How to upload player photos (location next to name fields)
   - How to configure corner logo slideshows
   - How to adjust logo maximum dimensions
   - How to adjust rotation timing
   - How to reposition corner logo containers via Interact
   - Recommended image sizes and aspect ratios for best results
   - Tips for high-resolution displays

5. Default values and best practices:
   - Document recommended default settings (400x400 max, 5s rotation)
   - Explain why larger max dimensions are better for big screens
   - Provide guidance on image quality vs file size
```

---

## Implementation Strategy

### Order of Operations:
1. **Start with Phase 1** (Player Photos) - This is simpler and will help you understand the codebase
2. **Complete and test** Phase 1 fully before moving to Phase 2
3. **Move to Phase 2** (Corner Logos) - More complex with sizing and slideshow logic
4. **Test thoroughly** in Phase 3 with various image types and sizes
5. **Polish** in Phase 4

### Tips for Working with Claude Opus 4.5:

1. **Attach specific files** - Upload only the files mentioned in each prompt
2. **One prompt at a time** - Complete each prompt fully before moving to the next
3. **Test between prompts** - Load the scoreboard in OBS and test after each major change
4. **Provide feedback** - If something doesn't work as expected, show Claude the error or unexpected behavior
5. **Ask for explanations** - If code doesn't make sense, ask Claude to explain the logic
6. **Request alternatives** - If an approach doesn't work, ask for different solutions
7. **Share screenshots** - Visual feedback helps Claude understand issues better

### File Reference Guide:
- **control_panel.html** - UI for uploads and settings
- **common/js/control_panel.js** - Upload handlers, localStorage writes
- **browser_source.html** - Display elements for stream overlay
- **common/js/browser_source.js** - Load from localStorage, display logic, slideshow, draggable system
- **common/css/browser_source/125.css** - Styling for small size
- **common/css/browser_source/150.css** - Styling for medium size
- **common/css/browser_source/200.css** - Styling for large size

### Testing Checklist:
- [ ] Player photos display correctly in all 3 sizes
- [ ] Player photos are circular with all image types
- [ ] Corner logos maintain aspect ratio
- [ ] Corner logo max sizing works with custom values
- [ ] Slideshow rotation timing is customizable
- [ ] Slideshow transitions are smooth
- [ ] Corner containers are draggable
- [ ] All positions persist after refresh
- [ ] Works with square, horizontal, and vertical images
- [ ] High-resolution images display well on large screens

Start with **Prompt 1A** and work sequentially through all phases. Good luck!