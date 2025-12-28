/**
 * Messaging Module Public API
 *
 * BroadcastChannel messaging for cross-window communication
 *
 * Usage:
 *   import { messageBus, MESSAGE_TYPES } from '@core/messaging';
 *
 *   // Initialize
 *   messageBus.init();
 *
 *   // Send message
 *   messageBus.send(MESSAGE_TYPES.SCORE_UPDATE);
 *
 *   // Subscribe to messages
 *   messageBus.on(MESSAGE_TYPES.SCORE_UPDATE, () => {
 *     // Refresh UI from database
 *   });
 */

export { messageBus, default } from './MessageBus.js';
export * as MESSAGE_TYPES from './messageTypes.js';
