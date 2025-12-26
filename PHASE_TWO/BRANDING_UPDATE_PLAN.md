# Branding Update Plan
## Safe Reference Updates for PCPL ScoreBoard

### Objective
Update branding references from "g4ScoreBoard/g4billiards" to "PCPL ScoreBoard/Park County Pool League" while maintaining code compatibility and updating repository references.

### Principles
1. **No Breaking Changes** - Technical references (filenames, IDs, etc.) remain unchanged
2. **Backward Compatibility** - Existing user setups continue to work
3. **Credit Where Due** - Maintain attribution to original creator
4. **Repository Focus** - Point to current GitHub repository

### Files to Update

#### 1. HTML Copyright Headers
**Files:** `browser_source.html`, `browser_compact.html`, `control_panel.html`, `shot_clock_display.html`

**Current:**
```html
<!--
G4ScoreBoard addon for OBS Copyright 2022-2025 Norman Gholson IV
https://g4billiards.com http://www.g4creations.com
-->
```

**New:**
```html
<!--
PCPL ScoreBoard addon for OBS
Inspired by g4ScoreBoard concept
GitHub: https://github.com/dougm1966/g4ScoreBoard
Park County Pool League
-->
```

#### 2. JavaScript Comments & References
**Files:** All JS files in `common/js/` and subdirectories

**Update Strategy:**
- Change user-facing comments to "PCPL ScoreBoard"
- Keep technical references (variable names, function names) unchanged
- Update repository URLs in comments

**Example Changes:**
```javascript
// Before
// g4ScoreBoard - OBS scoreboard system

// After  
// PCPL ScoreBoard - OBS scoreboard system
// Inspired by g4ScoreBoard concept
```

#### 3. CSS Comments
**Files:** All CSS files in `common/css/`

**Update Strategy:**
- Update header comments to reference PCPL ScoreBoard
- Keep class names and technical identifiers unchanged

#### 4. Markdown Documentation
**Files:** All remaining `.md` files with g4ScoreBoard references

**Update Strategy:**
- Update project name references to "PCPL ScoreBoard"
- Keep technical filenames (like `g4ScoreBoard_hotkeys.lua`) as-is
- Update repository links to current GitHub
- Maintain attribution to original creator

#### 5. Hotkey References
**Files:** `README.md`, documentation files

**Keep Unchanged:**
- `g4ScoreBoard_hotkeys.lua` filename
- "G4" prefix references in hotkey documentation
- Technical setup instructions

**Update:**
- Repository links
- General project references

### Specific Updates by Category

#### Repository References
**From:** `https://obsproject.com/forum/resources/g4scoreboard-a-pool-billiards-score-board.1586/`
**To:** `https://github.com/dougm1966/g4ScoreBoard`

#### Website References  
**From:** `https://g4billiards.com http://www.g4creations.com`
**To:** Remove (no longer needed with minimal attribution)

#### League References
**Add:** `Park County Pool League`

### Implementation Order

#### Phase 1: Core HTML Files (Highest Priority)
1. `browser_source.html` - Main overlay
2. `control_panel.html` - Control interface  
3. `browser_compact.html` - Compact variant
4. `shot_clock_display.html` - Shot clock display

#### Phase 2: JavaScript Files
1. `common/js/control_panel.js` & `control_panel_post.js`
2. `common/js/browser_source/` directory files
3. `common/js/browser_compact/` directory files
4. Bundled JS files

#### Phase 3: CSS Files
1. `common/css/browser_source.css`
2. `common/css/control_panel/` directory files
3. `common/css/browser_compact.css`

#### Phase 4: Documentation
1. Remaining markdown files
2. Update any repository references
3. Verify all attribution is maintained

### Things to Keep Unchanged

#### Technical Identifiers
- `g4ScoreBoard_hotkeys.lua` (filename)
- DOM IDs and class names
- Function names and variable names
- BroadcastChannel names
- localStorage keys

#### External References
- OBS forum links (where they provide context)
- Existing user setup documentation

### Quality Assurance Checklist

#### Before Deployment
- [ ] All HTML files display correctly in OBS
- [ ] Control panel functions normally
- [ ] Hotkeys still work with existing Lua script
- [ ] No broken links in documentation

#### After Deployment
- [ ] Test with fresh OBS setup
- [ ] Verify existing user setups still work
- [ ] Check all repository links point to correct location
- [ ] Confirm attribution is properly maintained

### Risk Mitigation

#### Low Risk Changes
- Copyright headers
- Comments and documentation
- Repository URLs

#### Medium Risk Changes  
- User-facing text in documentation
- Repository link updates

#### No-Go Areas (Do Not Change)
- Filenames (`g4ScoreBoard_hotkeys.lua`)
- DOM IDs and CSS classes
- JavaScript variable/function names
- localStorage keys
- BroadcastChannel names

### Success Criteria
1. **Zero Breaking Changes** - All existing functionality works
2. **Minimal Attribution** - Original concept acknowledged appropriately
3. **Repository Accuracy** - All links point to current GitHub
4. **Brand Consistency** - PCPL ScoreBoard branding where appropriate
5. **Documentation Clarity** - Users understand the project lineage

### Timeline Estimate
- **Phase 1:** 1-2 hours (HTML files)
- **Phase 2:** 2-3 hours (JavaScript files)  
- **Phase 3:** 1-2 hours (CSS files)
- **Phase 4:** 1-2 hours (Documentation)
- **Testing:** 1 hour

**Total: 6-10 hours**

---

**Document Created:** December 26, 2025  
**Author:** Cascade AI Assistant  
**Version:** 1.0  
**Status:** Ready for Implementation
