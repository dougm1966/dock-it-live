# Product Roadmap

## Phase 1: Foundation & Cleanup

1. [ ] **Cleanup & Unification** — Find and replace 45+ legacy G4 Scoreboard references and incomplete PCPL branding references throughout codebase, unifying under Dock-It.live brand. Update all file names, CSS classes, JavaScript variables, comments, and documentation. `M`

2. [ ] **Project Structure Reorganization** — Establish modular directory structure separating core system, Dock modules, ad platform, and shared utilities. Create clear boundaries between Control Panel, Billiards Dock, and Ad Platform components. `S`

3. [ ] **Dexie.js Integration Foundation** — Analyze existing `pcplscoreboard` IndexedDB schema (currently managed by PCPLImageDB class in `/common/js/idb_images.js`). Install Dexie.js as a wrapper to preserve the current `images` store. Create migration utilities for zero data loss, moving images to the `assets` table while adding `match_state` and `sponsors` tables. Test that existing sponsor images remain accessible. `M`

4. [ ] **Tailwind CSS Setup** — Install Tailwind CSS, configure build pipeline, and establish design system with Dock-It.live color palette and typography. Create base utility classes for consistent spacing and responsive breakpoints. `S`

## Phase 2: Core Architecture

5. [ ] **Universal Control Panel Base** — Build central control panel shell using ES6+ modules with modular Dock plug-in system. Implement Dock registration, activation/deactivation, and message passing between Control Panel and active Docks. Replace legacy jQuery with vanilla JS. `L`

6. [ ] **Command API for Remote Control** — Create RESTful command API enabling Stream Deck, external hotkeys, and third-party integrations to trigger scoreboard actions (Score +1, Start/Stop Timer, Next Ad, etc.). Implement WebSocket support for real-time bidirectional communication. `M`

7. [ ] **Ad Platform Foundation** — Create sponsor advertisement management system with Dexie.js storage for assets. Implement asset upload, categorization, and metadata management. Build rotation engine with configurable timing and cross-Dock support. `L`

8. [ ] **State Management System** — Implement centralized state management using ES6+ modules (no jQuery) for Control Panel, Docks, and Ad Platform. Create BroadcastChannel messaging for real-time synchronization between browser dock and browser source. `M`

9. [ ] **OBS Compatibility Layer** — Ensure all modernized components maintain full OBS Studio browser source and browser dock compatibility. Test file:// protocol support, localStorage/IndexedDB access, and BroadcastChannel messaging within OBS environment. `S`

## Phase 3: Billiards Dock Migration

10. [ ] **Billiards Dock Module Structure** — Extract legacy G4 billiards scoreboard logic into modular Billiards Dock plug-in. Create Dock manifest, registration hooks, and Control Panel integration points. Maintain feature parity with legacy system. `M`

11. [ ] **Undo/Redo State Manager** — Implement history-based state management for Billiards Dock enabling streamers to quickly undo scoring errors, timer mistakes, and accidental changes. Create keyboard shortcuts (Ctrl+Z/Ctrl+Y) and Control Panel undo/redo buttons for "Fat Finger" protection. `S`

12. [ ] **Shot Clock Refactor** — Migrate shot clock timer from jQuery to ES6+ modules with clean separation of timer logic, UI updates, and audio alerts. Preserve 30s/60s modes, extensions, and beep/buzz audio functionality. Integrate with Undo/Redo system. `S`

13. [ ] **Score Management Modernization** — Refactor player score tracking, race-to logic, and game state management using ES6+ classes. Replace localStorage persistence with Dexie.js for match history and statistics. All actions tracked in Undo/Redo system. `M`

14. [ ] **Billiards UI Components** — Rebuild scoreboard display using Tailwind CSS with responsive scaling (100%-200%). Create reusable components for player panels, score displays, and timer UI. Eliminate inline styles and legacy CSS. `L`

## Phase 4: Ad Platform Features

15. [ ] **Logo Upload & Management** — Implement drag-and-drop logo upload with preview, cropping, and optimization. Store assets in IndexedDB using Dexie.js. Build management interface for organizing, tagging, and deleting sponsor assets. `M`

16. [ ] **Ad Rotation Engine** — Create intelligent rotation system with configurable timing, frequency, and transition effects. Implement slideshow controls (play/pause/skip) accessible from Control Panel and Command API. Support manual override and scheduled rotations. `M`

17. [ ] **Cross-Dock Ad Integration** — Integrate Ad Platform with Billiards Dock, ensuring sponsor logos display correctly in scoreboard overlays. Create standardized ad zones that work across any future Dock module. Test rotation during live Billiards matches. `S`

## Phase 5: Testing & Polish

18. [ ] **Export/Import Utility for Portability** — Build Dexie.js database export/import system enabling users to backup sponsor asset libraries, match history, and settings. Support JSON export with embedded base64 assets and selective import (merge vs. replace). Enable portability across browsers and systems. `M`

19. [ ] **OBS Integration Testing** — Comprehensive testing of Control Panel (browser dock) and Billiards Dock (browser source) within OBS Studio. Verify hotkey support via Lua script, Command API integration, BroadcastChannel messaging, and Dexie.js persistence across OBS restarts. `M`

20. [ ] **Theme System Completion** — Migrate all legacy CSS themes (yami, acri, dark, grey, rachni, light) to Tailwind CSS variants. Ensure theme switching works across Control Panel, Billiards Dock, and Ad Platform. `M`

21. [ ] **Performance Optimization** — Optimize Dexie.js queries, reduce bundle sizes, implement lazy loading for Dock modules. Test load times, memory usage, and responsiveness with large sponsor asset libraries. `S`

22. [ ] **Documentation & Migration Guide** — Create comprehensive documentation for Dock-It.live architecture, Dock plug-in development, Command API usage, and Ad Platform. Write migration guide for users upgrading from legacy G4/PCPL systems including Export/Import instructions. `S`

## Phase 6: Future Dock Modules (Post-Launch)

23. [ ] **Hacky Sack Dock Module** — Develop second Dock module for hacky sack events, validating plug-in architecture and reusability of Control Panel, Ad Platform, Command API, and Undo/Redo patterns. `L`

24. [ ] **Cricket Dock Module** — Create third Dock module for cricket scoreboards, further testing cross-sport extensibility and shared component reusability. `L`

25. [ ] **Dock Marketplace Foundation** — Design and implement system for third-party Dock module distribution, installation, and version management. Enable community-created sport modules with Command API integration guidelines. `XL`

> Notes
> - Order prioritizes cleanup/foundation before feature development
> - Each phase builds on previous phases with clear technical dependencies
> - Command API (Phase 2) enables Stream Deck integration from day one
> - Undo/Redo (Phase 3) provides "Fat Finger" protection during live streams
> - Export/Import (Phase 5) ensures user data portability and backup safety
> - Billiards Dock serves as validation of the modular architecture before additional Docks
> - The Two Laws (Massive Storage via Dexie.js, Modern Standards with ES6+ modules) apply to ALL phases
