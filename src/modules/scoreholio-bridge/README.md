# Scoreholio Bridge Module

The Scoreholio Bridge is a data integration module that automatically syncs live match data from Scoreholio court URLs into the Dock-It.live scoreboard system.

## Features

- 🔄 **Automatic Polling**: Fetches match data at configurable intervals (default: 5 seconds)
- 🌐 **CORS Handling**: Automatically falls back to proxy servers if direct fetch fails
- 🎯 **Smart Parsing**: Extracts player names, scores, and match info from Scoreholio HTML
- 💾 **State Sync**: Updates local matchData and broadcasts changes to overlays
- 🔌 **Plug & Play**: Integrates seamlessly with the Master Control Panel

## Architecture

```
src/modules/scoreholio-bridge/
├── BridgeController.js   # Main controller with fetch/parse/sync logic
├── index.html            # Standalone UI (optional)
└── README.md             # This file
```

## How It Works

### 1. Connection Flow

```
User enters Scoreholio URL → Connect button clicked
↓
BridgeController.connect(url)
↓
Validate URL → Save to IndexedDB → Start polling
```

### 2. Polling & Sync Flow

```
setInterval (every 5s by default)
↓
fetch(scoreholioUrl) → Try direct, fallback to proxy if CORS blocked
↓
parseScoreholioHtml(html) → Extract player names, scores, race info
↓
syncToState(matchData) → Update StateManager
↓
BroadcastMessenger.send('MATCH_STATE_CHANGED')
↓
Overlay receives message → Reads from IndexedDB → Updates display
```

### 3. Data Flow Diagram

```
┌─────────────────┐
│ Scoreholio.com  │
│   Court URL     │
└────────┬────────┘
         │
         ▼ (HTTP fetch via proxy)
┌─────────────────┐
│ BridgeController│
│   - Fetch HTML  │
│   - Parse DOM   │
│   - Extract data│
└────────┬────────┘
         │
         ▼ (Write to DB)
┌─────────────────┐
│  StateManager   │
│   IndexedDB     │
│  (dock_it_db)   │
└────────┬────────┘
         │
         ▼ (BroadcastChannel)
┌─────────────────┐
│  Overlay/UI     │
│  Auto-updates   │
└─────────────────┘
```

## Usage

### In Master Control Panel

1. Navigate to **External Data Sources** section
2. Enter a Scoreholio court URL (e.g., `https://scoreholio.com/court/abc123`)
3. Click **Connect**
4. The bridge will automatically sync player names and scores
5. Adjust polling frequency if needed (default: 5 seconds)
6. Click **Disconnect** to stop syncing

### Standalone UI

You can also open the Scoreholio Bridge UI independently:

```
src/modules/scoreholio-bridge/index.html
```

This provides a debug-friendly interface with:
- Connection status display
- Manual "Test Fetch" button
- Real-time debug console
- Polling frequency controls

## API Reference

### ScoreholioBridgeController

```javascript
import { ScoreholioBridgeController } from './BridgeController.js';

const bridge = new ScoreholioBridgeController();
await bridge.init();

// Connect to a Scoreholio court
await bridge.connect('https://scoreholio.com/court/abc123');

// Disconnect
await bridge.disconnect();

// Get status
const status = bridge.getStatus();
// Returns: { connected, url, lastFetch, errorCount, pollingFrequency }

// Set polling frequency (milliseconds)
bridge.setPollingFrequency(10000); // 10 seconds

// Manual fetch (useful for testing)
await bridge.fetchAndSync();
```

## HTML Parsing

The bridge uses `DOMParser` to extract match data from Scoreholio HTML. It searches for the following CSS selectors:

### Player Names
```javascript
'.player-1-name, .player1-name, [data-player="1"] .name'
'.player-2-name, .player2-name, [data-player="2"] .name'
```

### Scores
```javascript
'.player-1-score, .player1-score, [data-player="1"] .score'
'.player-2-score, .player2-score, [data-player="2"] .score'
```

### Match Info
```javascript
'.race-to, .match-format, .game-info'
'.game-type, .match-type'
```

**Note**: These selectors are **placeholders** and may need to be updated based on the actual Scoreholio HTML structure.

## CORS Handling

Scoreholio may block direct fetches due to CORS policies. The bridge automatically tries:

1. **Direct fetch** (fastest, preferred)
2. **Fallback to CORS proxies**:
   - `https://api.allorigins.win/raw?url=...`
   - `https://corsproxy.io/?...`

If all methods fail, an error is logged and polling stops after 3 consecutive failures.

## Error Handling

- **Max Errors**: 3 consecutive failures before auto-disconnect
- **Error States**:
  - Invalid URL format
  - CORS blocked (all proxies failed)
  - Parse error (HTML structure changed)
  - Network timeout

Errors are logged to console with `[ScoreholioBridge]` prefix.

## State Schema

The bridge updates the following state paths:

```javascript
{
  scoreholio: {
    url: 'https://scoreholio.com/court/abc123',
    connected: true,
    error: null // or error message
  },
  matchData: {
    player1: {
      name: 'John Doe',
      score: 3
    },
    player2: {
      name: 'Jane Smith',
      score: 2
    },
    raceInfo: 'Race to 7'
  }
}
```

## BroadcastChannel Messages

When data is synced, the bridge broadcasts:

```javascript
{
  type: 'MATCH_STATE_CHANGED',
  payload: {
    source: 'scoreholio-bridge',
    timestamp: 1640995200000
  }
}
```

Overlays listen for this message and read the latest state from IndexedDB.

## Customization

### Updating CSS Selectors

If Scoreholio changes their HTML structure, update the selectors in `BridgeController.js`:

```javascript:src/modules/scoreholio-bridge/BridgeController.js
parseScoreholioHtml(html) {
  // Update these selectors as needed
  const matchData = {
    player1: {
      name: this.extractText(doc, '.new-player-1-selector'),
      score: this.extractNumber(doc, '.new-score-1-selector')
    },
    // ...
  };
}
```

### Adding Custom Proxy

Add your own CORS proxy to the fallback list:

```javascript:src/modules/scoreholio-bridge/BridgeController.js
async fetchViaProxy(url) {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://your-custom-proxy.com/?url=${encodeURIComponent(url)}` // Add here
  ];
  // ...
}
```

### Changing Polling Frequency

Adjust the default polling interval in the constructor:

```javascript:src/modules/scoreholio-bridge/BridgeController.js
constructor() {
  this.pollingFrequency = 5000; // Change to 10000 for 10 seconds
}
```

## Debugging

### Enable Verbose Logging

The bridge logs all operations with `[ScoreholioBridge]` prefix. Check browser console for:

```
[ScoreholioBridge] Initializing...
[ScoreholioBridge] Connecting to: https://scoreholio.com/...
[ScoreholioBridge] Fetching data from: ...
[ScoreholioBridge] Data synced successfully: { player1: {...}, player2: {...} }
```

### Test Parsing

To see the raw HTML being parsed:

```javascript
// Add this to parseScoreholioHtml() for debugging
console.log('[ScoreholioBridge] Raw HTML:', html.substring(0, 1000));
```

### Manual Fetch

Use the standalone UI or call directly:

```javascript
await window.master.scoreholioBridge.fetchAndSync();
```

## Testing Checklist

- [ ] Enter a valid Scoreholio URL
- [ ] Click Connect and verify status changes to "Connected"
- [ ] Check console for successful fetch messages
- [ ] Verify player names appear in control panel
- [ ] Verify scores update correctly
- [ ] Test polling frequency changes (1s, 10s, 30s)
- [ ] Test disconnect and verify polling stops
- [ ] Test CORS fallback by blocking direct fetch (DevTools → Network)
- [ ] Test error handling with invalid URL
- [ ] Verify state persists after page reload

## Future Enhancements

- [ ] Support for multiple Scoreholio courts (tournament mode)
- [ ] Automatic reconnect on network failure
- [ ] WebSocket support for real-time updates (if Scoreholio adds it)
- [ ] More robust HTML parsing (machine learning?)
- [ ] Integration with other live scoring platforms (CueScore, FargoRate, etc.)

## Troubleshooting

### "CORS blocked" errors
- The bridge automatically tries proxy servers
- If all proxies fail, you may need to run a local proxy server
- Alternatively, contact Scoreholio to whitelist your domain

### Data not syncing
1. Check console for parsing errors
2. Verify CSS selectors match current Scoreholio HTML
3. Open Scoreholio URL in browser and inspect element structure
4. Update selectors in `BridgeController.js` if needed

### Polling stopped unexpectedly
- Check console for error count (max 3 failures)
- Click Disconnect then Connect to restart
- Verify Scoreholio URL is still valid

## License

Part of Dock-It.live scoreboard system.

## Contact

For questions or issues, open a GitHub issue or check the main project documentation.
