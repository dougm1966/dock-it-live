/**
 * MessageBus.js
 * BroadcastChannel wrapper for cross-window communication
 *
 * CHANNEL: g4-main (preserved from legacy for compatibility)
 *
 * PATTERN: Messages are TRIGGERS, not data carriers
 * - Control Panel writes to database → broadcasts message
 * - Scoreboard receives message → fetches from database
 * - Database is single source of truth
 *
 * PREVENTS CIRCULAR LOOPS:
 * - Tracks sent message IDs to avoid responding to own messages
 */

import { isValidMessageType } from './messageTypes.js';

class MessageBus {
  constructor() {
    // Use legacy channel name for backward compatibility
    this.CHANNEL_NAME = 'g4-main';
    this.channel = null;
    this.listeners = new Map(); // type -> Set of callbacks
    this.sentMessageIds = new Set(); // Prevent circular loops
    this.messageIdCounter = 0;
  }

  /**
   * Initialize BroadcastChannel
   */
  init() {
    if (this.channel) {
      console.warn('MessageBus already initialized');
      return;
    }

    if (!('BroadcastChannel' in window)) {
      throw new Error('BroadcastChannel not supported in this browser');
    }

    this.channel = new BroadcastChannel(this.CHANNEL_NAME);

    // Listen for incoming messages
    this.channel.onmessage = event => {
      this._handleIncomingMessage(event.data);
    };

    this.channel.onerror = error => {
      console.error('BroadcastChannel error:', error);
    };

    console.log(`📡 MessageBus initialized on channel: ${this.CHANNEL_NAME}`);
  }

  /**
   * Send message to all windows/tabs
   *
   * @param {string} type - Message type constant
   * @param {Object} payload - Optional metadata (keep minimal - messages are triggers!)
   */
  send(type, payload = {}) {
    if (!this.channel) {
      console.error('MessageBus not initialized. Call init() first.');
      return;
    }

    // Validate message type
    if (!isValidMessageType(type)) {
      console.warn(`Unknown message type: ${type}`);
    }

    // Generate unique message ID to prevent circular loops
    const messageId = `${Date.now()}_${this.messageIdCounter++}`;
    this.sentMessageIds.add(messageId);

    // Clean up old message IDs (keep last 100)
    if (this.sentMessageIds.size > 100) {
      const oldest = Array.from(this.sentMessageIds)[0];
      this.sentMessageIds.delete(oldest);
    }

    // Construct message envelope
    const message = {
      type,
      payload: {
        ...payload,
        timestamp: Date.now(),
      },
      _meta: {
        id: messageId,
        sender: 'control-panel', // Can be made dynamic later
      },
    };

    // Broadcast message
    try {
      this.channel.postMessage(message);
      console.log(`📤 Sent message:`, type, payload);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Subscribe to message type
   *
   * @param {string} type - Message type to listen for
   * @param {Function} callback - Called when message received
   * @returns {Function} Unsubscribe function
   */
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Subscribe to all message types
   *
   * @param {Function} callback - Called for every message
   * @returns {Function} Unsubscribe function
   */
  onAny(callback) {
    return this.on('*', callback);
  }

  /**
   * Unsubscribe from message type
   *
   * @param {string} type - Message type
   * @param {Function} callback - Callback to remove
   */
  off(type, callback) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Clear all listeners for a type (or all types if no type specified)
   *
   * @param {string} [type] - Message type to clear
   */
  clearListeners(type) {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Close BroadcastChannel connection
   */
  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
      this.listeners.clear();
      this.sentMessageIds.clear();
      console.log('📡 MessageBus closed');
    }
  }

  /**
   * Handle incoming message
   * @private
   */
  _handleIncomingMessage(message) {
    // Validate message structure
    if (!message || typeof message !== 'object') {
      console.warn('Invalid message received:', message);
      return;
    }

    if (!message.type) {
      console.warn('Message missing type:', message);
      return;
    }

    // Prevent circular loops - ignore messages we sent
    if (message._meta && this.sentMessageIds.has(message._meta.id)) {
      console.log('🔁 Ignoring own message:', message.type);
      return;
    }

    console.log(`📥 Received message:`, message.type, message.payload);

    // Call type-specific listeners
    const typeListeners = this.listeners.get(message.type);
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(message.payload, message);
        } catch (error) {
          console.error(`Error in listener for ${message.type}:`, error);
        }
      });
    }

    // Call wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => {
        try {
          callback(message.payload, message);
        } catch (error) {
          console.error('Error in wildcard listener:', error);
        }
      });
    }
  }

  /**
   * Get channel info
   * @returns {Object}
   */
  getInfo() {
    return {
      channelName: this.CHANNEL_NAME,
      isInitialized: !!this.channel,
      listenerCount: Array.from(this.listeners.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
      messageTypes: Array.from(this.listeners.keys()),
    };
  }
}

// Export singleton instance
export const messageBus = new MessageBus();
export default messageBus;
