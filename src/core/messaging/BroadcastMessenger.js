/**
 * BroadcastMessenger.js
 * Modern BroadcastChannel wrapper for cross-component messaging
 *
 * MESSAGE PATTERN (Following THE LAW #2):
 * - BroadcastChannel messages are TRIGGERS (not data carriers)
 * - Database (IndexedDB) is the SINGLE SOURCE OF TRUTH
 * - Overlay listens to messages → Reads from Database
 *
 * Channel: g4-main (legacy-compatible)
 */

export class BroadcastMessenger {
  constructor(channelName = 'g4-main') {
    this.channelName = channelName;
    this.channel = new BroadcastChannel(channelName);
    this.listeners = new Map();
  }

  /**
   * Send a message to all listeners
   * @param {string} type - Message type (e.g., 'SPONSOR_CHANGE', 'SCORE_UPDATE')
   * @param {Object} payload - Message payload (optional, prefer database for data)
   */
  send(type, payload = {}) {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.channel.postMessage(message);
    console.log(`[BroadcastMessenger] Sent: ${type}`, payload);
  }

  /**
   * Listen for messages of a specific type
   * @param {string} type - Message type to listen for
   * @param {Function} callback - Handler function (message) => void
   */
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    this.listeners.get(type).push(callback);

    // Set up the channel listener if not already done
    if (!this.boundMessageHandler) {
      this.boundMessageHandler = (event) => this.handleMessage(event);
      this.channel.addEventListener('message', this.boundMessageHandler);
    }
  }

  /**
   * Remove a message listener
   * @param {string} type - Message type
   * @param {Function} callback - Handler to remove
   */
  off(type, callback) {
    if (!this.listeners.has(type)) return;

    const handlers = this.listeners.get(type);
    const index = handlers.indexOf(callback);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Internal message handler
   * @private
   */
  handleMessage(event) {
    const { type, payload, timestamp } = event.data;

    if (!type) return;

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback({ type, payload, timestamp });
        } catch (error) {
          console.error(`[BroadcastMessenger] Handler error for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Close the channel
   */
  close() {
    if (this.boundMessageHandler) {
      this.channel.removeEventListener('message', this.boundMessageHandler);
    }
    this.channel.close();
    this.listeners.clear();
  }

  // ============================================================================
  // COMMON MESSAGE TYPES (Convenience methods)
  // ============================================================================

  /**
   * Send SPONSOR_CHANGE message
   * Overlay should read active sponsor from match_state.activeSponsor
   */
  sendSponsorChange(sponsorId) {
    this.send('SPONSOR_CHANGE', { sponsorId });
  }

  /**
   * Send SCORE_UPDATE message
   * Overlay should read scores from match_state.player1.score / player2.score
   */
  sendScoreUpdate(player1Score, player2Score) {
    this.send('SCORE_UPDATE', {
      player1: player1Score,
      player2: player2Score,
    });
  }

  /**
   * Send TIMER_UPDATE message
   * Overlay should read timer state from match_state.timer
   */
  sendTimerUpdate(timerState) {
    this.send('TIMER_UPDATE', timerState);
  }

  /**
   * Send MATCH_STATE_CHANGE message (generic state update)
   */
  sendMatchStateChange() {
    this.send('MATCH_STATE_CHANGE', {});
  }
}

// Export singleton instance
export const messenger = new BroadcastMessenger('g4-main');
export default messenger;
