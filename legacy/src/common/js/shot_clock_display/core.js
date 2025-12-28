'use strict';

/**
 * PCPL ScoreBoard Shot Clock Display - Main Entry Point
 * Inspired by g4ScoreBoard concept
 * GitHub: https://github.com/dougm1966/g4ScoreBoard
 * Park County Pool League
 *
 * Local display for players on 2nd monitor
 * Simple clock display that receives updates via BroadcastChannel
 */

// BroadcastChannel for receiving time updates from browser_source
const bcr = new BroadcastChannel('g4-recv');
const bc = new BroadcastChannel('g4-main');

// Listen for stopClock command
bc.onmessage = (event) => {
  if (event.data.clockDisplay === 'stopClock') {
    setTimeout(() => {
      document.body.style.background = 'rgba(0,0,0,0)';
      document.body.innerHTML = '&nbsp;';
    }, 2000);
  }
};

// Listen for time updates from browser_source
bcr.onmessage = (event) => {
  const seconds = event.data;

  // Set background and display time
  document.body.style.background = 'darkgreen';
  document.body.innerHTML = seconds + 's';

  // Color transitions based on time remaining
  if (seconds > 5) {
    document.body.style.color = 'black';
  }
  if (seconds < 21) {
    document.body.style.background = 'orange';
  }
  if (seconds < 16) {
    document.body.style.background = 'yellow';
  }
  if (seconds < 11) {
    document.body.style.background = 'tomato';
  }
  if (seconds < 6) {
    document.body.style.background = 'red';
    document.body.style.color = 'white';
  }
  if (seconds === 0) {
    document.body.style.background = 'red';
    setTimeout(resetClock, 2000);
  }
};

/**
 * Reset clock display to initial state
 */
function resetClock() {
  document.body.style.background = 'darkgreen';
  document.body.innerHTML = '&nbsp;';
}
