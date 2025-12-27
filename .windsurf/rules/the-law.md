---
trigger: always_on
---
# DOCK-IT.LIVE MIGRATION ENGINE

## 1. MANDATORY CONTEXT
You are refactoring 'g4ScoreBoard' into 'Dock-It.live'. 
Before writing any code, you MUST reference the Project Bible in `/docs/`.

## 2. THE THREE LAWS (Reference: /docs/02_Architecture/THE_LAW.md)
1. **Local-Only:** Must run on `file:///`. No Node.js/Express. No http://localhost.
2. **Database:** Dexie.js (IndexedDB) is the ONLY source of truth. No localStorage for game data.
3. **Sync:** Standardized `{ type, payload }` envelopes via BroadcastChannel API.

## 3. FILE PROTOCOL (Reference: /docs/02_Architecture/SYSTEM_ARCHITECTURE.md)
- NEW CODE: Move all refactored logic to `/src/`.
- LEGACY CODE: Found in root. Do not delete. Move to `/docs/00_LEGACY_ARCHIVE/` only after replacement is verified.
- PATHS: Use relative paths only (./ or ../) to maintain OBS compatibility.

## 4. AGENT PERSONAS (Reference: /docs/05_Agents/)
- Act as 'The Pathfinder' for folder/path moves.
- Act as 'The State Refactor' for Dexie.js integration.
- Act as 'The Stylist' for Tailwind CSS implementation.

## 5. TASK ENTRY POINT
Always check `README.md` for the current Migration Status table before starting a task.