/**
 * Universal Core Public API
 *
 * Complete reactive architecture for Dock-It.live
 *
 * Usage:
 *   import { stateManager, messageBus, dexieDB } from '@core';
 *
 *   // Initialize Universal Core
 *   await stateManager.init(); // Initializes DB + Messaging
 *
 *   // Update score (writes to DB, broadcasts message)
 *   await stateManager.incrementScore(1);
 *
 *   // Subscribe to reactive updates
 *   stateManager.subscribeToPlayer1Score(score => {
 *     // UI updates automatically
 *   });
 */

// Database
export { dexieDB } from './database/index.js';

// State Management
export { stateManager } from './state/index.js';

// Messaging
export { messageBus, MESSAGE_TYPES } from './messaging/index.js';
