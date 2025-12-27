# 🎱 DOCK-IT.LIVE (formerly g4ScoreBoard)

## ⚠️ AI AGENT INSTRUCTIONS
**This project is in an active MIGRATION PHASE. Do not write code based on the legacy root files.**

1. **Context:** You are refactoring the legacy `g4ScoreBoard` into the modular `Dock-It.live` engine.
2. **Mandatory Reading:** Before any task, read [`/docs/02_Architecture/THE_LAW.md`](./docs/02_Architecture/THE_LAW.md).
3. **Refactor Goal:** Move logic from flat root files into the structure defined in [`/docs/02_Architecture/SYSTEM_ARCHITECTURE.md`](./docs/02_Architecture/SYSTEM_ARCHITECTURE.md).

## 🏗️ Migration Status
| Feature | Legacy File | Target Destination | State Logic |
| :--- | :--- | :--- | :--- |
| **Main Control** | `control_panel.html` | `/src/docks/master.html` | LocalStorage ➔ **Dexie.js** |
| **Scoreboard** | `browser_source.html`| `/src/overlays/scoreboard.html`| Reactive DB Listeners |
| **Ad Manager** | `advertising_control_panel.html` | `/src/docks/ads.html` | Asset Blobs in DB |
| **Ad Display** | `advertising_frame.html` | `/src/overlays/ad-frame.html` | Broadcast Pulse |

## 🛠️ Core Standards
* **Source of Truth:** Dexie.js (IndexedDB). No external servers.
* **Sync:** Standardized `{ type, payload }` envelopes via BroadcastChannel API.
* **Style:** Utility-first Tailwind CSS.
* **Environment:** Compatible with OBS `file:///` protocol.

## 📁 Documentation Index
* [**Strategy**](./docs/01_Strategy/) | [**Architecture**](./docs/02_Architecture/) | [**Guides**](./docs/03_Guides/) | [**Agents**](./docs/05_Agents/)