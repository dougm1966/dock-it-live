# 🎱✨ PCPLScoreBoard

## 🏆 Park County Pool League ScoreBoard

Welcome to **PCPLScoreBoard** — a bold, stream-ready scoreboard built for **OBS Studio**. Set it up once, then run your matches like a pro. 🔥

**Vibes:** 🎥 Streaming-ready • 🎱 Pool-first • ⚡ Fast controls • 🧠 Simple workflow

### 💥 What you get
- 🖥️ **Scoreboard Browser Source** (clean, modern overlay)
- 🧩 **Control Panel Dock** (operate the match from inside OBS)
- ⏱️ **Shot clock** + optional standalone shot clock display
- 🏷️ **Sponsor logos** + rotating slideshow

### 🚧 Big upgrade in progress (for sponsors & ads)
We’re upgrading image storage to **IndexedDB** (binary storage) so you can load **way more sponsor/advertising images** without hitting the tiny `localStorage` limit. 🧰📦

---

## 🚀🎬 Quick Start (OBS Setup)

### 1) 📁💾 Extract / place the folder
Put the project folder somewhere stable on your computer (don’t move it later).

### 2) 🧩🕹️ Add the Control Panel as a Dock

#### OBS 27.2+ (recommended: `file:///` URL)
1. In OBS: `Docks` -> `Custom Browser Docks`
2. **Dock Name:** `PCPLScoreBoard`
3. **URL:** point to `control_panel.html` using a file URI, for example:
   - `file:///c:/path/to/PCPLScoreBoard/control_panel.html`
4. Click `Close`

#### OBS 27.1 and lower (path URL)
Use a normal Windows path in the URL box, for example:
- `c:\path\to\PCPLScoreBoard\control_panel.html`

### 3) 🖥️✨ Add the Scoreboard as a Browser Source
1. In your Scene: `+` -> `Browser`
2. Name it: `PCPLScoreBoard`
3. **URL:** point to `browser_source.html`
   - OBS 27.2+: `file:///c:/path/to/PCPLScoreBoard/browser_source.html`
   - Older OBS: `c:\path\to\PCPLScoreBoard\browser_source.html`
4. **Width:** `1920`
5. **Height:** `1080`

---

## ⏱️🔔 Optional: Shot Clock Display (second monitor)
Add another Browser Source and point it at:
- `shot_clock_display.html`

---

## ⌨️⚡ Hotkeys (optional)
1. OBS: `Tools` -> `Scripts`
2. Click `+`
3. Select `g4ScoreBoard_hotkeys.lua` (file name is kept for compatibility for now)
4. OBS: `Settings` -> `Hotkeys`
5. Hotkeys currently use a `G4` prefix in OBS.

---

## 🧑‍🤝‍🧑📸 Sponsor Logos / Player Photos
In the Control Panel, use the upload buttons to:
- Upload player photos
- Upload left/right sponsor logos
- Upload 3 slideshow sponsor logos

### How image storage works (simple)
- **Automatic:** Image storage is created automatically the first time you upload an image. There’s nothing to install or set up.
- **Stored on this computer:** Images are saved locally in the OBS Browser Source storage for this scoreboard.
- **Stays after restarts:** Images typically remain even after restarting OBS or rebooting your PC.
- **Not synced:** If you move to a different computer, you’ll need to upload the images again.
- **Reusable:** Once an image is stored, it can be reused in other ad slots (this is the goal of the new image picker).

### 🚨 Note about image limits (current behavior)
PCPLScoreBoard stores images in **IndexedDB** by default (binary storage) for much higher capacity.
If IndexedDB isn’t available in your OBS Browser Source environment, it automatically falls back to **legacy `localStorage`** image storage (smaller limit). 📈🎯

> [!INFO]
> **When can IndexedDB be unavailable?**
> IndexedDB is supported in modern OBS Browser Source (Chromium), but it can be unavailable or fail to open in a few situations:
> - **Old OBS / old Chromium engine** (storage APIs can be limited or buggy)
> - **Restricted browser storage mode** (private/incognito-like modes, or unusually restricted embedded contexts)
> - **Disk/quota issues** (disk full, low free space, or storage quota errors)
> - **Corrupted browser storage profile** (can happen after crashes/power loss)
> - **Security software blocking browser cache/profile writes** (rare, but possible)
>
> **What happens if IndexedDB isn’t available?**
> PCPLScoreBoard automatically falls back to **legacy `localStorage` image storage** so the scoreboard still works — you just may hit the older, smaller storage limit sooner.

> [!INFO]
> **Storage capacity (simple guide)**
> - **`localStorage` (legacy fallback):** typically **~5–10 MB per “site/origin”** in many Chromium-based browsers.
>   - PCPLScoreBoard’s older image storage uses **base64**, which adds **~33% size overhead**, so real usable space for images can feel closer to **~3–7 MB**.
>   - This is why uploading multiple sponsor/advertising images can hit limits quickly.
> - **IndexedDB (preferred):** typically **much larger** than `localStorage` (often **hundreds of MB or more**, depending on OBS/Chromium version and free disk space).
>   - IndexedDB stores images as **binary blobs** (no base64 overhead), which is more space-efficient.
>
> **Bottom line:** if you’re using lots of sponsor/advertising graphics, IndexedDB is the way to go. If IndexedDB can’t be used for any reason, the scoreboard still works via `localStorage`—just with smaller headroom.

---

## 🛠️🧯 Troubleshooting

### Scoreboard not showing
- Confirm the Browser Source URL points to `browser_source.html`
- Confirm Width/Height are set (1920x1080 recommended)

### Uploads failing / “maximum file size” alert
- This is usually the browser storage quota being exceeded.
- The IndexedDB migration is intended to fix this for high-image-count sponsor/advertising usage.

If uploads still fail:
- Try deleting some stored images (once the image picker modal is added).
- Make sure your computer has free disk space.
- As a last resort, you can clear OBS’s browser cache/storage (this will remove saved images/settings for browser sources).

---

## 🗺️🚀 Roadmap (high level)
- Move all image storage from `localStorage` (base64) to **IndexedDB** (binary)
- Add 8–12 sponsor/advertising image slots
- Improve error messaging when storage limits are reached
