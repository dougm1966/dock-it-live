# Dock-It.live Theming Architecture Guide

**Version:** 1.0.0
**Last Updated:** 2025-12-28
**Author:** Douglas Montgomery / AI1offs

---

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Why "Variables Only" Doesn't Work](#why-variables-only-doesnt-work)
4. [Layout Families + Themes Approach](#layout-families--themes-approach)
5. [The Four Layout Families](#the-four-layout-families)
6. [Advertising Module Integration](#advertising-module-integration)
7. [File Structure](#file-structure)
8. [Creating New Themes](#creating-new-themes)
9. [Creating New Layouts](#creating-new-layouts)
10. [Best Practices](#best-practices)

---

## Overview

The Dock-It.live theming system enables dynamic visual customization of the scoreboard overlay while maintaining OBS compatibility and consistent functionality. The system is built on **Layout Families + Visual Themes** rather than attempting to separate structure and visuals into completely independent layers.

### Key Principles
- **Layouts define structure** (positioning, sizing, spacing)
- **Themes define visuals** (colors, gradients, effects, fonts)
- **Some coupling is acceptable** (compact layouts need different padding than spacious ones)
- **Advertising module aware** (layouts adapt to ad zone presence)

---

## Core Concepts

### Layout Family
A **Layout Family** defines the fundamental structural arrangement of scoreboard elements:
- Element positioning (left/right/center, top/bottom)
- Container dimensions (width, height)
- Spacing and padding ranges
- Grid/flexbox configurations
- Responsive behavior

**Example:** "Fullwidth Bottom" positions the scoreboard across the bottom of the screen with players on left/right and scores in the center.

### Visual Theme
A **Visual Theme** defines the aesthetic appearance within a layout:
- Color schemes and gradients
- Border styles and radius
- Shadows and glow effects
- Font families and sizes (within layout constraints)
- Transparency and blur effects
- Animations

**Example:** "Pro Sleek" uses diagonal gradients, glassmorphism, and beveled edges with 12px border radius.

### Skin
A **Skin** is the combination of a Layout Family + Visual Theme, resulting in a complete CSS file.

**Example:** "Fullwidth Bottom - Pro Sleek" or "Sidebar Left - Minimal Clean"

---

## Why "Variables Only" Doesn't Work

The original plan attempted to separate structure and visuals completely:
```
structural.css  → ALL positioning/sizing (universal)
variables.css   → CSS custom properties (colors, etc.)
theme.css       → Only override variables
```

### The Fundamental Problem
**Visual style and structure are intertwined in ways that can't be abstracted with CSS variables alone.**

### Real-World Failures

#### 1. Font Size Affects Layout
```css
/* Variables approach - BREAKS */
:root {
  --font-size-player-name: 8pt;  /* Theme tries to change this */
}

.bs-player-name {
  height: 28px;  /* Structural CSS - FIXED */
  font-size: var(--font-size-player-name);  /* 12pt won't fit! */
}
```

**Problem:** Changing font size from 8pt to 12pt breaks the fixed 28px height. Text overflows or gets clipped.

#### 2. Padding is Both Structural and Visual
```css
/* Compact theme needs tight spacing */
--padding-player-name: 2px 8px;

/* Spacious theme needs breathing room */
--padding-player-name: 8px 20px;
```

**Problem:** These aren't just visual preferences - they fundamentally change the layout dimensions and element positioning.

#### 3. Border Radius Changes Perception
```css
/* Sharp Edge theme */
--border-radius: 0px;  /* Angular, tactical feel */

/* Pro Sleek theme */
--border-radius: 12px;  /* Soft, modern feel */
```

**Problem:** While technically just a number, 0px vs 12px creates entirely different visual structures. Sharp corners need different padding/spacing to look balanced.

#### 4. Effects Require Space
```css
/* Glassmorphism needs space for blur to be visible */
.bs-player-name {
  backdrop-filter: blur(10px);
  padding: 8px 15px;  /* Need extra padding for effect */
}

/* Flat theme doesn't need extra space */
.bs-player-name {
  padding: 4px 10px;  /* Tighter is fine */
}
```

**Problem:** Visual effects like blur, glow, and shadows need physical space to render properly.

### The Realization
**Structure and visuals can't be cleanly separated because aesthetic choices have spatial requirements.**

---

## Layout Families + Themes Approach

### The Solution
Accept that layouts and themes are coupled, but **organize them into families** where themes share structural compatibility within a family.

```
Layout Family: "Fullwidth Bottom"
  ├── Theme: Default Steelblue
  ├── Theme: Pro Sleek (gradients, glass)
  ├── Theme: Sharp Edge (angular, tactical)
  ├── Theme: Neon Arcade (bright, retro)
  └── Theme: High Contrast (accessibility)

Layout Family: "Compact Centered"
  ├── Theme: Minimal Clean
  ├── Theme: Monochrome
  └── Theme: High Contrast

Layout Family: "Sidebar Vertical"
  ├── Theme: Modern Dark
  ├── Theme: Tactical HUD
  └── Theme: Esports Pro

Layout Family: "Split Dual-Screen"
  ├── Theme: Cinematic
  ├── Theme: Retro CRT
  └── Theme: Asymmetric Modern
```

### How It Works
1. **Each layout family defines base constraints:**
   - Scoreboard width range: 800-1200px
   - Player name height range: 24-36px
   - Font size range: 8pt-14pt
   - Padding range: 2px-12px

2. **Themes work within those constraints:**
   - Pro Sleek: 12pt font, 32px height, 8px padding (upper range)
   - Sharp Edge: 10pt font, 28px height, 4px padding (lower range)
   - Both work in "Fullwidth Bottom" family

3. **Cross-family themes aren't guaranteed:**
   - "Pro Sleek" might work in Fullwidth and Sidebar
   - "Pro Sleek" might NOT work in Compact (too much padding)

---

## The Four Layout Families

### 1. Fullwidth Bottom
**Description:** Traditional bottom-aligned scoreboard spanning most of screen width.

**Structure:**
- Position: Bottom center
- Width: 95%, max 1200px
- Layout: Player 1 (left) | Scores (center) | Player 2 (right)
- Ball tracker: Row(s) below players

**Advertising Compatibility:**
- Without ads: Full viewport, centered
- With ads: Reduced viewport (125px margins), still centered

**Best For:**
- Standard pool/billiards streaming
- Wide aspect ratios (16:9, 21:9)
- Maximum information display

**Recommended Themes:**
- Default Steelblue (classic PCPL)
- Pro Sleek (modern professional)
- Sharp Edge (angular tactical)
- Neon Arcade (retro gaming)

---

### 2. Compact Centered
**Description:** Smaller, tighter scoreboard for minimal screen obstruction.

**Structure:**
- Position: Bottom center (or top center)
- Width: 70%, max 900px
- Tighter spacing, smaller fonts
- Condensed ball tracker

**Advertising Compatibility:**
- Without ads: Centered in full viewport
- With ads: Centered in reduced viewport

**Best For:**
- Gameplay-focused streams (less overlay)
- Ultra-wide displays
- Mobile/vertical viewing

**Recommended Themes:**
- Minimal Clean (ultra-simple)
- Monochrome (black/white only)
- High Contrast (accessibility)

---

### 3. Sidebar Vertical
**Description:** Vertical scoreboard anchored to left or right edge.

**Structure:**
- Position: Left or right edge, vertically centered
- Width: 280-350px (fixed or adaptive)
- Stack: Player 1 → Scores → Player 2 (vertical)
- Ball tracker: Below scores or integrated

**Advertising Compatibility (KEY CONSIDERATION):**

**Without Ads:**
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌──────────┐                           │
│  │ Player 1 │  Main content area        │
│  ├──────────┤  (gameplay visible)       │
│  │ Scores   │                           │
│  ├──────────┤                           │
│  │ Player 2 │                           │
│  └──────────┘                           │
│  Scoreboard                             │
│  (350px wide)                           │
└─────────────────────────────────────────┘
```

**With Ads (Sidebar Left):**
```
┌─────────────────────────────────────────┐
│         Top Ad Zone (125px)             │
├────────┬───────────────────────┬────────┤
│ Left   │  ┌──────────┐         │ Right  │
│ Ad     │  │ Player 1 │  Main   │ Ad     │
│ Zone   │  ├──────────┤  content│ Zone   │
│ (125px)│  │ Scores   │  area   │ (125px)│
│        │  ├──────────┤         │        │
│        │  │ Player 2 │         │        │
│        │  └──────────┘         │        │
│        │  Scoreboard           │        │
│        │  (280px wide)         │        │
└────────┴───────────────────────┴────────┘
```

**Implementation:**
```css
/* Sidebar starts at left: 0 of #mainOverlay */
.layout-sidebar-left .bs-scoreboard {
  position: absolute;
  left: 0;  /* This respects the 125px left margin when ads enabled */
  top: 50%;
  transform: translateY(-50%);
  width: 280px;  /* Fixed width */
}

/* Wider when ads disabled (more space available) */
body:not(.ads-enabled) .layout-sidebar-left .bs-scoreboard {
  width: 350px;
}
```

**Best For:**
- Ultra-wide displays (21:9, 32:9)
- Dual-monitor setups
- Dedicated scoreboard displays
- When advertising module is active (nice visual balance)

**Recommended Themes:**
- Modern Dark (sleek vertical design)
- Tactical HUD (military/gaming style)
- Esports Pro (competitive look)

---

### 4. Split Dual-Screen
**Description:** Asymmetric layout with player info in opposite corners.

**Structure:**
- Player 1: Top-left corner
- Player 2: Bottom-right corner
- Scores: Floating center or top-center
- Ball tracker: Bottom-center or integrated

**Advertising Compatibility:**
- Without ads: Players at screen corners
- With ads: Players at corners of reduced viewport

**Best For:**
- Creative/artistic streams
- Non-traditional sports
- Cinematic presentations
- Breaking away from standard layouts

**Recommended Themes:**
- Cinematic (movie-style overlays)
- Retro CRT (scanlines, glow)
- Asymmetric Modern (bold geometric)

---

## Advertising Module Integration

### How the Ad System Works

The advertising module creates three border zones:
- **Top Zone:** 125px tall, 6-column CSS Grid
- **Left Zone:** 125px wide, 3-row CSS Grid
- **Right Zone:** 125px wide, 3-row CSS Grid

When enabled, CSS variables push the main overlay viewport:
```css
body.ads-enabled {
  --ad-top-height: 125px;
  --ad-left-width: 125px;
  --ad-right-width: 125px;
}

#mainOverlay {
  position: absolute;
  top: var(--ad-top-height);    /* 0px → 125px */
  left: var(--ad-left-width);   /* 0px → 125px */
  right: var(--ad-right-width); /* 0px → 125px */
  bottom: 0;
}
```

### Layout Adaptation Strategies

#### Strategy 1: Viewport-Relative (Fullwidth, Compact)
```css
/* Layout positions relative to #mainOverlay */
.bs-scoreboard {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  max-width: 1200px;
}
```
**Result:** Scoreboard automatically centers in reduced viewport when ads enabled.

#### Strategy 2: Fixed-Width Sidebar
```css
/* Sidebar width doesn't change with ads */
.layout-sidebar-left .bs-scoreboard {
  left: 0;
  width: 280px;  /* Always 280px */
}
```
**Result:** Sidebar sits next to left ad zone (not underneath).

#### Strategy 3: Adaptive-Width Sidebar
```css
/* Sidebar expands when ads disabled */
.layout-sidebar-left .bs-scoreboard {
  left: 0;
  width: 280px;
}

body:not(.ads-enabled) .layout-sidebar-left .bs-scoreboard {
  width: 350px;  /* More space when no ads */
}
```
**Result:** Sidebar uses available space intelligently.

### Key Principle
**All layouts must respect the CSS variable boundaries.** Never use absolute screen coordinates - always position relative to `#mainOverlay`.

---

## File Structure

```
src/
├── core/
│   ├── overlay/
│   │   └── index.html              # Master Shell with ad zones
│   │
│   └── skins/
│       ├── SkinManager.js          # Runtime skin loader/switcher
│       └── skins.registry.json     # Skin metadata
│
└── modules/
    └── overlay/
        └── skins/
            ├── fullwidth-bottom/
            │   ├── default.css           # Classic steelblue
            │   ├── pro-sleek.css         # Modern gradients
            │   ├── sharp-edge.css        # Angular tactical
            │   └── neon-arcade.css       # Retro bright
            │
            ├── compact-centered/
            │   ├── minimal-clean.css
            │   ├── monochrome.css
            │   └── high-contrast.css
            │
            ├── sidebar-vertical/
            │   ├── modern-dark.css
            │   ├── tactical-hud.css
            │   └── esports-pro.css
            │
            └── split-dual-screen/
                ├── cinematic.css
                ├── retro-crt.css
                └── asymmetric-modern.css
```

### Registry Structure
```json
{
  "skins": [
    {
      "id": "fullwidth-bottom-pro-sleek",
      "name": "Pro Sleek",
      "layoutFamily": "fullwidth-bottom",
      "description": "Modern professional design with gradients",
      "author": "Dock-It.live",
      "version": "1.0.0",
      "tags": ["modern", "professional", "gradients"],
      "cssPath": "/src/modules/overlay/skins/fullwidth-bottom/pro-sleek.css"
    }
  ]
}
```

---

## Creating New Themes

### Step 1: Choose a Layout Family
Decide which layout family your theme will target. Remember: themes are designed for specific layouts.

**Question to ask:**
- Does this theme need lots of space (padding, large fonts)? → Fullwidth
- Does this theme need to be compact? → Compact Centered
- Is this theme designed for vertical space? → Sidebar Vertical

### Step 2: Study Existing Themes in That Family
Read the CSS of existing themes in your chosen layout family to understand:
- Element selectors and class names
- Required CSS properties
- Dimension constraints
- Animation patterns

### Step 3: Create Your CSS File
```css
/**
 * THEME NAME
 * Layout Family: fullwidth-bottom
 * Description: Your theme description here
 * Author: Your name
 */

/* ============================================================================
   COLOR PALETTE
   ============================================================================ */
:root {
  --theme-primary: #hexcolor;
  --theme-secondary: #hexcolor;
  --theme-accent: #hexcolor;
  /* Define all your colors as variables */
}

/* ============================================================================
   BASE OVERLAY STRUCTURE
   ============================================================================ */
html {
  width: 1920px;
  height: 1080px;
  overflow: hidden;
}

body {
  margin: 0;
  padding: 0;
  background: transparent;
  font-family: 'Your Font', sans-serif;
}

/* ============================================================================
   SCOREBOARD CONTAINER
   ============================================================================ */
.bs-scoreboard {
  /* Your scoreboard styling */
  /* Must respect layout family dimensions */
}

/* Continue with all required elements... */
```

### Step 4: Test Across States
Test your theme in multiple conditions:
- **With/without advertising module**
- **With/without ball tracker**
- **With/without shot clock**
- **Different player name lengths**
- **Different score values (1-digit, 2-digit)**
- **OBS browser source at 100%, 125%, 150% scale**

### Step 5: Register in skins.registry.json
Add your theme to the registry so users can select it.

---

## Creating New Layouts

Creating a new layout family is more complex than creating a theme. You're defining the structural foundation for multiple themes.

### Step 1: Design on Paper/Figma
Sketch the layout structure:
- Element positions
- Dimension ranges (min/max width, height)
- Spacing patterns
- Responsive behavior
- Ad zone interaction

### Step 2: Define Constraints
Document the ranges themes must work within:
```markdown
## Layout Family: My New Layout

**Scoreboard Dimensions:**
- Width: 600-800px
- Height: auto (min 120px)

**Player Name Cells:**
- Height: 24-32px
- Font size: 9pt-12pt
- Padding: 3px-8px (vertical)

**Score Pills:**
- Size: 28-36px
- Font size: 12pt-16pt

**Ball Tracker:**
- Position: Below scores
- Ball size: 20-28px
```

### Step 3: Implement Base Structure
Create the first theme in your layout family. This will serve as the reference implementation.

```css
/* Layout Family: my-new-layout */
/* Theme: Default */

/* Define the base structural elements */
.bs-scoreboard {
  position: absolute;
  /* Your positioning */
  width: 700px;  /* Middle of allowed range */
}

.bs-player-name {
  height: 28px;  /* Middle of allowed range */
  padding: 5px 10px;
}

/* etc. */
```

### Step 4: Test Ad Compatibility
Verify the layout works correctly:
```html
<!-- Test with ads enabled -->
<body class="ads-enabled">
  <!-- Your overlay -->
</body>

<!-- Test with ads disabled -->
<body>
  <!-- Your overlay -->
</body>
```

### Step 5: Create Variation Themes
Build 2-3 additional themes in your layout family to prove the constraints work:
- One with minimal styling (tight spacing)
- One with maximal styling (generous spacing)
- One with unique effects (gradients, glass, etc.)

If themes break the constraints, adjust either the theme or the constraints.

### Step 6: Document Layout Family
Create a markdown file in `/docs/layouts/`:
```markdown
# My New Layout Family

## Overview
Description of the layout concept and use cases.

## Structural Constraints
- Element dimensions
- Positioning rules
- Spacing ranges

## Ad Zone Behavior
How the layout adapts when advertising module is enabled/disabled.

## Compatible Themes
List of themes designed for this layout.

## Creating New Themes
Guidelines for theme developers working in this layout family.
```

---

## Best Practices

### For Theme Developers

1. **Stay within layout constraints**
   - Don't break out of allowed dimension ranges
   - Test edge cases (longest names, highest scores)

2. **Use CSS variables for colors**
   ```css
   :root {
     --color-primary: #hexcolor;
   }

   .element {
     color: var(--color-primary);  /* Good */
     color: #hexcolor;             /* Avoid hardcoding */
   }
   ```

3. **Test in OBS Browser Source**
   - Themes must work with `file://` protocol
   - Test at multiple OBS scale levels
   - Verify animations perform smoothly

4. **Consider accessibility**
   - Sufficient color contrast (WCAG AA minimum)
   - Readable font sizes
   - Clear visual hierarchy

5. **Document your theme**
   ```css
   /**
    * THEME: Pro Sleek
    * LAYOUT: fullwidth-bottom
    * AUTHOR: Your Name
    * VERSION: 1.0.0
    *
    * DESCRIPTION:
    * Modern professional design featuring diagonal gradients,
    * glassmorphism effects, and smooth animations.
    *
    * FEATURES:
    * - Navy to cyan gradient (Player 1)
    * - Navy to purple gradient (Player 2)
    * - Backdrop blur: 10px
    * - Border radius: 12px
    * - Slide-in animations
    */
   ```

### For Layout Developers

1. **Define clear constraints upfront**
   - Document min/max ranges for all dimensions
   - Specify required vs optional elements
   - List must-support features

2. **Think mobile-first, then scale up**
   - Start with minimal viable layout
   - Add enhancements progressively
   - Ensure core functionality at smallest size

3. **Plan for advertising module**
   - Always use CSS variable boundaries
   - Never hardcode absolute screen positions
   - Test both ad-enabled and ad-disabled states

4. **Provide reference implementation**
   - Create a "default" theme as the example
   - Comment extensively
   - Show best practices

5. **Version your layout**
   ```css
   /**
    * LAYOUT FAMILY: Fullwidth Bottom
    * VERSION: 2.0.0
    * BREAKING CHANGES:
    * - Changed player name height from 36px to 28-36px range
    * - Added shot clock to middle column
    * - Ball tracker now supports 3 layout modes
    */
   ```

### For Users

1. **Match layout to use case**
   - Streaming gameplay? → Compact or Sidebar
   - Showcasing match? → Fullwidth or Split
   - Running ads? → Avoid layouts that conflict

2. **Test before going live**
   - Switch themes in OBS
   - Verify all elements visible
   - Check at your streaming resolution

3. **Report issues with details**
   - Theme name and version
   - Ad module enabled/disabled
   - OBS version and scale
   - Screenshot of issue

---

## Glossary

**Layout Family**: A structural template defining element positioning and dimensions (e.g., "Fullwidth Bottom").

**Visual Theme**: An aesthetic style applied to a layout (e.g., "Pro Sleek").

**Skin**: The combination of a Layout Family + Visual Theme, resulting in a complete CSS file.

**Ad Zone**: The 125px border regions (top, left, right) reserved for advertising when the module is enabled.

**Viewport**: The available screen space for the overlay, which shrinks when ad zones are active.

**CSS Variable Boundaries**: The `--ad-top-height`, `--ad-left-width`, `--ad-right-width` variables that define safe positioning.

**OBS Browser Source**: The rendering environment in OBS Studio where the overlay displays.

**SkinManager**: The JavaScript module responsible for loading and switching skins at runtime.

---

## Version History

**1.0.0** (2025-12-28)
- Initial documentation
- Defined 4 layout families
- Established theme development guidelines
- Documented advertising module integration

---

## Support & Contribution

**Questions?** Open an issue on GitHub: https://github.com/dougm1966/dock-it-live

**Want to contribute a theme?** Submit a pull request with:
1. Your theme CSS file
2. Entry in skins.registry.json
3. Screenshots showing the theme in action
4. Testing notes (ad module compatibility, OBS scale tested, etc.)

**Building a new layout family?** Discuss in GitHub Discussions first to align with project direction.

---

**End of Theming Architecture Guide**
