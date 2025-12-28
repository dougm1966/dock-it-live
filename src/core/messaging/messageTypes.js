/**
 * messageTypes.js
 * Standard message type constants for BroadcastChannel communication
 *
 * MESSAGE PROTOCOL:
 * All messages follow the envelope pattern: { type: 'CONSTANT', payload: {...} }
 *
 * Messages are TRIGGERS, not data carriers.
 * Receivers fetch latest data from database, not from message payload.
 */

// Legacy message types (preserved from g4ScoreBoard for backward compatibility)
export const SCORE_UPDATE = 'SCORE_UPDATE';
export const UI_REFRESH = 'UI_REFRESH';
export const AD_TRIGGER = 'AD_TRIGGER';

// New Dock-It.live message types
export const STATE_CHANGED = 'STATE_CHANGED'; // Generic state change
export const MATCH_STATE_CHANGED = 'MATCH_STATE_CHANGED'; // Match state updated
export const SHOT_CLOCK_TICK = 'SHOT_CLOCK_TICK'; // Shot clock time changed
export const SHOT_CLOCK_START = 'SHOT_CLOCK_START'; // Shot clock started
export const SHOT_CLOCK_STOP = 'SHOT_CLOCK_STOP'; // Shot clock stopped
export const SHOT_CLOCK_RESET = 'SHOT_CLOCK_RESET'; // Shot clock reset
export const PLAYER_SCORE_CHANGED = 'PLAYER_SCORE_CHANGED'; // Player score updated
export const PLAYER_NAME_CHANGED = 'PLAYER_NAME_CHANGED'; // Player name updated
export const ASSET_UPLOADED = 'ASSET_UPLOADED'; // New sponsor logo/asset
export const ASSET_DELETED = 'ASSET_DELETED'; // Asset removed
export const THEME_CHANGED = 'THEME_CHANGED'; // Theme/styling changed

/**
 * All valid message types
 */
export const ALL_MESSAGE_TYPES = [
  SCORE_UPDATE,
  UI_REFRESH,
  AD_TRIGGER,
  STATE_CHANGED,
  MATCH_STATE_CHANGED,
  SHOT_CLOCK_TICK,
  SHOT_CLOCK_START,
  SHOT_CLOCK_STOP,
  SHOT_CLOCK_RESET,
  PLAYER_SCORE_CHANGED,
  PLAYER_NAME_CHANGED,
  ASSET_UPLOADED,
  ASSET_DELETED,
  THEME_CHANGED,
];

/**
 * Check if message type is valid
 * @param {string} type
 * @returns {boolean}
 */
export function isValidMessageType(type) {
  return ALL_MESSAGE_TYPES.includes(type);
}
