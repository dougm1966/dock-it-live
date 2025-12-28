/**
 * State Module Public API
 *
 * Centralized reactive state management
 *
 * Usage:
 *   import { stateManager } from '@core/state';
 *
 *   // Initialize
 *   await stateManager.init();
 *
 *   // Update score (writes to database)
 *   await stateManager.incrementScore(1); // Player 1 +1
 *
 *   // Subscribe to automatic updates (reactive)
 *   stateManager.subscribeToPlayer1Score(score => {
 *     document.getElementById('score').textContent = score;
 *   });
 */

export { stateManager, default } from './StateManager.js';
