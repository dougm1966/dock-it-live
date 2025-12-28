# Product Mission - Dock-It.live

## Pitch
Dock-It.live is a modular streaming management system that helps event streamers across multiple sports create professional broadcast overlays by providing a universal control panel, plug-in event modules (Docks), and integrated sponsor advertisement platform - modernizing the legacy G4/PCPL ScoreBoard into a future-proof platform compatible with OBS, vMix, and Wirecast.

## Users

### Primary Customers
- **Multi-Sport Streamers**: Content creators broadcasting different event types (billiards, hacky sack, cricket, etc.) who need flexible overlay solutions compatible with any broadcast software
- **Event Organizers**: Tournament directors managing diverse competitions requiring professional broadcast tools
- **Sponsors & Advertisers**: Businesses supporting events who need reliable ad rotation and brand visibility across streams

### User Personas
**Multi-Sport Event Streamer** (25-45)
- **Role:** Content creator covering various competitive events
- **Context:** Broadcasting billiards tournaments one week, hacky sack competitions the next, using OBS, vMix, or Wirecast
- **Pain Points:** Current g4ScoreBoard limited to one sport, jQuery codebase hard to extend, lacks cross-platform compatibility (OBS-only), limited storage for sponsor assets
- **Goals:** Single unified control panel for all event types, consistent sponsor ad management, reliable massive storage, works with any broadcast software (OBS/vMix/Wirecast)

**Tournament Director** (30-55)
- **Role:** Event organizer and broadcast producer
- **Context:** Managing tournaments across different sports disciplines, coordinating sponsor commitments
- **Pain Points:** Legacy g4ScoreBoard codebase fragile, mixing G4 and PCPL branding confusing, IndexedDB implementation primitive, can't backup/restore sponsor libraries
- **Goals:** Centralized modern control system, automated sponsor rotation, export/import for portability, "Undo" button for scoring mistakes during live matches

**Sponsor Representative** (35-60)
- **Role:** Business sponsor coordinating brand visibility
- **Context:** Supporting multiple events, tracking ad placement across different broadcast platforms
- **Pain Points:** Limited storage for high-res logos, no cross-platform compatibility (OBS vs vMix), manual asset management, no undo for accidental deletions
- **Goals:** Unlimited logo storage, works across OBS/vMix/Wirecast, backup/restore sponsor libraries, professional consistent branding

## The Problem

### Legacy G4/PCPL Codebase Needs Complete Modernization
The current codebase is a confusing mix of legacy G4 Scoreboard references (45+ instances) and an incomplete PCPL rebrand attempt. Built on outdated jQuery and primitive IndexedDB implementation, it's single-sport only, OBS-exclusive, and difficult to maintain or extend. The existing `PCPLImageDB` class provides basic IndexedDB storage but lacks modern features like reactivity, migrations, and transactions. Streamers face data loss risks, no backup options, and can't undo mistakes during live broadcasts.

**Our Solution:** Dock-It.live modernizes the technical foundation by wrapping the existing `pcplscoreboard` IndexedDB with Dexie.js (zero data loss migration), replacing jQuery with ES6+ modules, and implementing Tailwind CSS for responsive design. The modular Dock architecture enables multi-sport support while maintaining full compatibility with OBS, vMix, and Wirecast via file:// protocol. Undo/Redo prevents "fat finger" errors, Export/Import enables portability, and reactive database-first state ensures reliable real-time updates.

## Differentiators

### Complete Modernization with Zero Data Loss
Unlike risky full rewrites, Dock-It.live wraps your existing `pcplscoreboard` IndexedDB database with modern Dexie.js, preserving all sponsor images while adding advanced features (liveQuery reactivity, transactions, migrations). The migration is invisible to end users - all existing assets remain accessible.

### Cross-Platform Browser Source Compatibility
Unlike OBS-only solutions, Dock-It.live works with OBS Studio, vMix, Wirecast, and any global browser source platform via strict file:// protocol compliance. No absolute paths, self-contained assets, and zero external dependencies ensure universal compatibility.

### Modular Dock System for Multi-Sport Growth
Unlike single-purpose scoreboards, Dock-It.live separates Universal Core (database, state, messaging, ads) from sport-specific Docks (billiards, hacky sack, cricket). Adding a new sport means creating a new module, not rewriting the entire codebase. "Building a factory that makes apps" not "fixing one app."

### Reactive Database-First State Pattern
Unlike message-passing architectures where data flows through events, Dock-It.live treats the database as the single source of truth. BroadcastChannel messages are triggers, not data carriers - overlays fetch latest state from database. This prevents synchronization bugs and enables offline operation.

## Key Features

### Core Architecture (Universal Core)
- **Dexie.js Database Wrapper:** Modern IndexedDB wrapper replacing primitive PCPLImageDB with liveQuery reactivity, transactions, and migrations
- **Zero Data Loss Migration:** Existing `pcplscoreboard` images store migrated to `assets` table with backward compatibility
- **Reactive State Management:** Database-first pattern where BroadcastChannel signals trigger overlays to fetch latest state
- **Universal Control Panel:** Single centralized interface managing any active Dock module, sponsor ads, and system settings
- **Modular Dock System:** Plug-in architecture for sport-specific modules (Billiards, Hacky Sack, Cricket)
- **Integrated Ad Platform:** Built-in sponsor advertisement management with unlimited storage and automatic rotation

### Billiards Dock (First Module)
- **Legacy G4/PCPL Migration:** Complete refactor of billiards scoreboard from jQuery to ES6+ modules
- **Preserved Logic:** Shot clock timing (30s/60s), race-to algorithms, audio alerts - refined for ES6, not rewritten
- **Shot Clock Timer:** Configurable countdown with extensions, visual/audio alerts (beep2.mp3, buzz.mp3)
- **Real-time Score Management:** Player scores, race-to targets, game state with instant BroadcastChannel updates
- **OBS/vMix/Wirecast Support:** Full compatibility via file:// protocol, self-contained assets

### Professional Features
- **Undo/Redo System:** History-based state management for "Fat Finger" protection (Ctrl+Z/Ctrl+Y)
- **Export/Import Utilities:** Backup sponsor asset libraries and match history as JSON with embedded base64 assets
- **Massive Storage:** Dexie.js/IndexedDB provides hundreds of MB for high-resolution sponsor logos and videos (vs 5MB localStorage limit)
- **Cross-Platform Portability:** Export data from OBS setup, import into vMix setup, zero data loss
- **Command API (Future):** RESTful API + WebSocket for Stream Deck and external hotkey integrations

### Modern Technical Foundation
- **ES6+ Modules Only:** No jQuery (enforced by ESLint), clean separation of concerns, future-proof architecture
- **Tailwind CSS Styling:** Modern utility-first CSS framework enabling rapid theme customization
- **Responsive Design:** Adapts to different resolutions (720p, 1080p, 1440p, 4K) seamlessly
- **Vite Build System:** Fast development, optimized production builds, file:// protocol compatible

### Legacy Preservation (The Law: Preserve and Refine)
- **Working Logic Preserved:** Shot clock math, timing intervals, race-to algorithms, audio trigger points
- **Refactored for ES6:** Legacy jQuery code converted to modern classes with clean module boundaries
- **Backward Compatible:** BroadcastChannel protocol (`g4-main` channel) preserved, message types unchanged
- **Validation Testing:** New system tested against current OBS scenes to ensure invisible transition

## Architecture: The Three Laws

### Law 1: Modular Skeleton
**All new code in `/src/` with strict separation:**
- `/src/core/` - Universal components (Database, State, Messaging, Ads, Themes)
- `/src/modules/billiards/` - Sport-specific logic (Shot clock, Scoring, Billiards UI)
- `/common/` - Legacy code (read-only reference, archived after migration)

**Why:** Enables "building a factory that makes apps" - future sports added as plug-ins without touching Core.

### Law 2: Database Truth
**Existing IndexedDB (`pcplscoreboard`) wrapped with Dexie.js:**
- Current: `PCPLImageDB` class managing `images` store
- Migration: Zero data loss, preserve all sponsor images, add `match_state` and `sponsors` tables
- NOT migrating from localStorage (localStorage not used for critical data)

**Why:** Modern Dexie.js features (liveQuery, transactions, migrations) without data loss risks.

### Law 3: Modern Standards
**Technology Stack:**
- ES6+ Modules exclusively (no var, no jQuery)
- Dexie.js for database (reactive, transactional)
- Tailwind CSS for styling (utility-first, responsive)
- ESLint enforcement (blocks jQuery, enforces ES6+)

**Why:** Future-proof, maintainable, extensible codebase enabling rapid feature development.

## Success Metrics

### Technical Metrics
- **Migration Success:** 100% of existing sponsor images accessible after Dexie.js migration
- **Build Size:** < 500KB JavaScript, < 100KB CSS (excluding sponsor assets)
- **Load Time:** < 2s Control Panel, < 1s Browser Source (file:// protocol)
- **Cross-Platform:** Works in OBS, vMix, Wirecast without modifications

### User Experience Metrics
- **Backward Compatibility:** Existing OBS scenes work with new system, zero visual changes for viewers
- **Undo/Redo:** < 1 second to undo scoring mistake during live match
- **Export/Import:** Complete sponsor library backup in < 10 seconds for 50+ assets
- **Fat Finger Protection:** Zero unrecoverable mistakes during live broadcasts

### Development Metrics
- **New Dock Development:** Add new sport module in < 2 weeks (vs months for monolithic rewrite)
- **Code Quality:** 0 jQuery violations, 0 ESLint errors, 100% ES6+ compliance
- **Test Coverage:** 100% validation testing against current OBS scenes
