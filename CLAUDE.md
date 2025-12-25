# g4ScoreBoard

A professional billiard/pool scoreboard solution for OBS Studio streamers.

## Project Overview

- **Type**: JavaScript/HTML/CSS web application for OBS browser sources
- **Purpose**: Provides a scoreboard overlay with shot clock for pool/billiards live streams
- **Platform**: OBS Studio (browser dock + browser source)

## Architecture

### Main HTML Files
- `control_panel.html` - OBS dock interface for controlling the scoreboard
- `browser_source.html` - Main scoreboard overlay (1920x1080)
- `browser_compact.html` - Compact scoreboard variant
- `shot_clock_display.html` - Standalone shot clock display

### JavaScript (common/js/)
- `control_panel.js` / `control_panel_post.js` - Control panel logic
- `browser_source.js` / `browser_source_post.js` - Browser source display logic
- `jquery.js` - jQuery library
- `hotkeys.js` - Hotkey definitions

### CSS Themes (common/css/)
- `control_panel/` - OBS theme variants (yami, acri, dark, grey, rachni, light)
- `browser_source/` - Display scaling (100%, 125%, 150%, 200%)

### OBS Integration
- `g4ScoreBoard_hotkeys.lua` - Lua script for OBS hotkey bindings

## Key Features

- Shot clock (30s/60s timers with extensions)
- Player scores and race tracking
- Custom logo upload and slideshow
- Multiple OBS themes supported
- Hotkey support via Lua script

## Code Style

- Uses jQuery for DOM manipulation
- localStorage for data persistence between control panel and browser source
- CSS for theming and responsive scaling

## Development Notes

- Test changes with OBS browser dock and browser source
- Browser sources use file:// protocol in OBS v27.2+
- Shot clock audio alerts are local (beep2.mp3, buzz.mp3)
