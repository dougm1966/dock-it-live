/**
 * StateManager.js
 * Centralized reactive state management for Dock-It.live
 *
 * REACTIVE DATABASE-FIRST PATTERN:
 * - Database is the single source of truth
 * - Every state change writes to database
 * - UI components subscribe via liveQuery
 * - Changes propagate automatically to all subscribers
 */

import { dexieDB } from '../database/DexieWrapper.js';
import { messageBus } from '../messaging/MessageBus.js';
import * as MESSAGE_TYPES from '../messaging/messageTypes.js';
import initialState from '../../state/initialState.json';

class StateManager {
  constructor() {
    this.db = dexieDB;
    this.messageBus = messageBus;
    this.STATE_ID = 'current'; // Default state ID for active match
    this.broadcastEnabled = true; // Enable/disable message broadcasting
  }

  /**
   * Initialize database connection and messaging
   */
  async init() {
    await this.db.open();

    // Initialize BroadcastChannel for cross-window communication
    try {
      this.messageBus.init();
    } catch (error) {
      console.warn('BroadcastChannel not available:', error.message);
      this.broadcastEnabled = false;
    }

    // Ensure default state exists and has correct schema
    const existing = await this.db.getMatchState(this.STATE_ID);
    if (!existing) {
      // No state exists - initialize from initialState.json
      await this.initializeDefaultState();
    } else if (!existing.matchData || !existing.logoSlots || !existing.uiSettings || !existing.modules) {
      // State exists but has old schema - migrate to new schema
      console.warn('⚠️ Detected old schema, migrating to initialState.json structure...');
      await this.migrateToNewSchema(existing);
    } else if (existing.matchData?.shotClock && !existing.modules?.shotClock) {
      // Special case: shotClock still in old location (matchData) - migrate it
      console.warn('⚠️ Shot clock in old location, moving to modules.shotClock...');
      await this.migrateToNewSchema(existing);
    }
  }

  /**
   * Enable message broadcasting (default: enabled)
   */
  enableBroadcast() {
    this.broadcastEnabled = true;
  }

  /**
   * Disable message broadcasting
   */
  disableBroadcast() {
    this.broadcastEnabled = false;
  }

  /**
   * Initialize default match state from initialState.json
   * Schema includes:
   * - uiSettings: Controls visibility of scoreboard elements
   * - logoSlots: Logo positions linked to assets via assetId
   * - matchData: Game state (players, scores, shot clock, custom fields)
   */
  async initializeDefaultState() {
    await this.db.updateMatchState(this.STATE_ID, initialState);
  }

  /**
   * Migrate old schema to new initialState.json schema
   * @param {Object} oldState - State with old schema (player1, player2, shotClock at root)
   */
  async migrateToNewSchema(oldState) {
    // Start with initialState.json as base
    const newState = JSON.parse(JSON.stringify(initialState));

    // Migrate player data if exists
    if (oldState.player1) {
      newState.matchData.player1.name = oldState.player1.name || 'Player 1';
      newState.matchData.player1.score = oldState.player1.score || 0;
      newState.matchData.player1.timeouts = oldState.player1.timeouts || 1;
      newState.matchData.player1.extensions = oldState.player1.extensions || 0;
    }

    if (oldState.player2) {
      newState.matchData.player2.name = oldState.player2.name || 'Player 2';
      newState.matchData.player2.score = oldState.player2.score || 0;
      newState.matchData.player2.timeouts = oldState.player2.timeouts || 1;
      newState.matchData.player2.extensions = oldState.player2.extensions || 0;
    }

    // Migrate shot clock from OLD location (matchData.shotClock or root) to NEW location (modules.shotClock)
    const oldShotClock = oldState.matchData?.shotClock || oldState.shotClock;
    if (oldShotClock) {
      newState.modules.shotClock.enabled = oldShotClock.enabled || oldShotClock.isRunning || false;
      newState.modules.shotClock.visible = oldShotClock.visible !== false;
      newState.modules.shotClock.running = oldShotClock.running || oldShotClock.isRunning || false;
      newState.modules.shotClock.currentTime = oldShotClock.currentTime || oldShotClock.timeRemaining || 30;
      newState.modules.shotClock.duration = oldShotClock.duration || oldState.gameSettings?.shotClockSeconds || 30;
    }

    // Migrate race info if exists
    if (oldState.gameSettings?.raceTo) {
      newState.matchData.raceInfo = `Race to ${oldState.gameSettings.raceTo}`;
    }

    // Migrate ball tracker if exists
    if (oldState.matchData?.ballTracker) {
      newState.matchData.ballTracker = oldState.matchData.ballTracker;
    }

    // Preserve logoSlots if they exist in old state
    if (oldState.logoSlots) {
      newState.logoSlots = { ...newState.logoSlots, ...oldState.logoSlots };
    }

    // Preserve uiSettings if they exist in old state
    if (oldState.uiSettings) {
      newState.uiSettings = { ...newState.uiSettings, ...oldState.uiSettings };
    }

    await this.db.updateMatchState(this.STATE_ID, newState);
    console.log('✅ Schema migration complete - shot clock moved to modules.shotClock');
  }

  // ============================================================================
  // GETTERS (Read from Database)
  // ============================================================================

  /**
   * Get current match state
   * @returns {Promise<Object>}
   */
  async getState() {
    return await this.db.getMatchState(this.STATE_ID);
  }

  /**
   * Get specific value from state
   * @param {string} path - Dot notation path (e.g., 'player1.score')
   * @returns {Promise<any>}
   */
  async getValue(path) {
    const state = await this.getState();
    return this._getNestedValue(state, path);
  }

  // ============================================================================
  // SETTERS (Write to Database - Triggers liveQuery updates)
  // ============================================================================

  /**
   * Update entire match state
   * @param {Object} newState - New state object
   */
  async setState(newState) {
    await this.db.updateMatchState(this.STATE_ID, newState);

    // Broadcast state change to other windows
    if (this.broadcastEnabled) {
      this.messageBus.send(MESSAGE_TYPES.STATE_CHANGED);
    }
  }

  /**
   * Update specific value in state
   * @param {string} path - Dot notation path
   * @param {any} value - New value
   */
  async setValue(path, value) {
    const state = await this.getState();
    this._setNestedValue(state, path, value);
    await this.setState(state);
  }

  /**
   * Merge partial state (deep merge)
   * @param {Object} partialState - Partial state to merge
   */
  async mergeState(partialState) {
    const state = await this.getState();
    const merged = this._deepMerge(state, partialState);
    await this.setState(merged);
  }

  // ============================================================================
  // SCORE MANAGEMENT (Database writes trigger automatic UI updates)
  // ============================================================================

  /**
   * Increment player score
   * @param {number} playerNum - 1 or 2
   * @param {number} amount - Amount to add (default 1)
   */
  async incrementScore(playerNum, amount = 1) {
    const state = await this.getState();
    const playerKey = `player${playerNum}`;

    if (!state.matchData || !state.matchData[playerKey]) {
      throw new Error(`Invalid player number: ${playerNum}`);
    }

    state.matchData[playerKey].score += amount;

    await this.db.updateMatchState(this.STATE_ID, state);

    // Broadcast score change
    if (this.broadcastEnabled) {
      this.messageBus.send(MESSAGE_TYPES.PLAYER_SCORE_CHANGED, {
        playerNum,
        score: state.matchData[playerKey].score
      });
      this.messageBus.send(MESSAGE_TYPES.SCORE_UPDATE); // Legacy compatibility
    }
  }

  /**
   * Decrement player score
   * @param {number} playerNum - 1 or 2
   * @param {number} amount - Amount to subtract (default 1)
   */
  async decrementScore(playerNum, amount = 1) {
    const state = await this.getState();
    const playerKey = `player${playerNum}`;

    if (!state.matchData || !state.matchData[playerKey]) {
      throw new Error(`Invalid player number: ${playerNum}`);
    }

    state.matchData[playerKey].score = Math.max(0, state.matchData[playerKey].score - amount);
    await this.setState(state);
  }

  /**
   * Set player score directly
   * @param {number} playerNum - 1 or 2
   * @param {number} score - New score
   */
  async setScore(playerNum, score) {
    const state = await this.getState();
    const playerKey = `player${playerNum}`;

    if (!state.matchData || !state.matchData[playerKey]) {
      throw new Error(`Invalid player number: ${playerNum}`);
    }

    state.matchData[playerKey].score = Math.max(0, score);
    await this.setState(state);
  }

  /**
   * Reset scores (new game)
   */
  async resetScores() {
    const state = await this.getState();
    state.matchData.player1.score = 0;
    state.matchData.player2.score = 0;

    // Reset shot clock if module exists
    if (state.modules?.shotClock) {
      state.modules.shotClock.currentTime = state.modules.shotClock.duration;
      state.modules.shotClock.running = false;
    }

    await this.setState(state);
  }

  /**
   * Reset entire match (new match)
   */
  async resetMatch() {
    const state = await this.getState();

    // Preserve player names
    const p1Name = state.matchData.player1.name;
    const p2Name = state.matchData.player2.name;

    // Reset to initial state but keep names
    state.matchData.player1 = {
      name: p1Name,
      fargoInfo: 'Fargo 520',
      score: 0,
      timeouts: 1,
      extensions: 0
    };
    state.matchData.player2 = {
      name: p2Name,
      fargoInfo: 'Fargo 480',
      score: 0,
      timeouts: 1,
      extensions: 0
    };

    // Reset shot clock if module exists
    if (state.modules?.shotClock) {
      state.modules.shotClock.currentTime = state.modules.shotClock.duration;
      state.modules.shotClock.running = false;
    }

    await this.setState(state);
  }

  // ============================================================================
  // UI SETTINGS MANAGEMENT
  // ============================================================================

  /**
   * Set UI visibility setting
   * @param {string} key - Setting key (e.g., 'showShotClock', 'showPlayerNames')
   * @param {boolean} value - Visibility state
   */
  async setUIVisibility(key, value) {
    await this.setValue(`uiSettings.${key}`, value);
  }

  /**
   * Set active theme
   * @param {string} theme - Theme name
   */
  async setActiveTheme(theme) {
    await this.setValue('uiSettings.activeTheme', theme);
  }

  // ============================================================================
  // LOGO SLOT MANAGEMENT
  // ============================================================================

  /**
   * Set logo for a slot
   * @param {string} slotId - Slot ID (e.g., 'T1', 'L1', 'R1', 'tableTopLeft')
   * @param {string} assetId - Asset ID from assets table
   */
  async setLogoSlot(slotId, assetId) {
    await this.setValue(`logoSlots.${slotId}.assetId`, assetId);
  }

  /**
   * Toggle logo slot active state
   * @param {string} slotId - Slot ID
   * @param {boolean} active - Active state
   */
  async setLogoSlotActive(slotId, active) {
    await this.setValue(`logoSlots.${slotId}.active`, active);
  }

  /**
   * Set logo slot opacity
   * @param {string} slotId - Slot ID
   * @param {number} opacity - Opacity (0.0 to 1.0)
   */
  async setLogoSlotOpacity(slotId, opacity) {
    await this.setValue(`logoSlots.${slotId}.opacity`, Math.max(0, Math.min(1, opacity)));
  }

  /**
   * Clear logo from slot
   * @param {string} slotId - Slot ID
   */
  async clearLogoSlot(slotId) {
    await this.mergeState({
      logoSlots: {
        [slotId]: { assetId: null, active: false }
      }
    });
  }

  // ============================================================================
  // PLAYER MANAGEMENT
  // ============================================================================

  /**
   * Set player name
   * @param {number} playerNum - 1 or 2
   * @param {string} name - Player name
   */
  async setPlayerName(playerNum, name) {
    await this.setValue(`matchData.player${playerNum}.name`, name);
  }

  /**
   * Set player Fargo rating (billiards-specific)
   * @param {number} playerNum - 1 or 2
   * @param {number|string} fargo - Fargo rating (e.g., 500)
   */
  async setPlayerFargo(playerNum, fargo) {
    await this.setValue(`matchData.player${playerNum}.fargo`, fargo);
  }

  /**
   * Set player color (name plate background on overlay)
   * @param {number} playerNum - 1 or 2
   * @param {string} color - Hex color code (e.g., "#1e40af")
   */
  async setPlayerColor(playerNum, color) {
    await this.setValue(`matchData.player${playerNum}.color`, color);
  }

  /**
   * Set player Fargo info
   * @param {number} playerNum - 1 or 2
   * @param {string} fargoInfo - Fargo rating info (e.g., "Fargo 520")
   */
  async setPlayerFargoInfo(playerNum, fargoInfo) {
    await this.setValue(`matchData.player${playerNum}.fargoInfo`, fargoInfo);
  }

  /**
   * Set player ratings object (supports multiple rating types)
   * @param {number} playerNum - 1 or 2
   * @param {Object} ratings - { fargo, ppd, mpr, display, source }
   */
  async setPlayerRatings(playerNum, ratings) {
    await this.setValue(`matchData.player${playerNum}.ratings`, ratings);

    // Also update the legacy fargoInfo field for backward compatibility
    if (ratings.display && ratings[ratings.display]) {
      const displayValue = ratings[ratings.display];
      const displayName = ratings.display.toUpperCase();
      const fargoInfo = `${displayName} ${displayValue}`;
      await this.setValue(`matchData.player${playerNum}.fargoInfo`, fargoInfo);
    }
  }

  /**
   * Set active sport (billiards, darts, etc.)
   * @param {string} sport - Sport name
   */
  async setActiveSport(sport) {
    await this.setValue('matchData.activeSport', sport);
  }

  /**
   * Swap player positions
   */
  async swapPlayers() {
    const state = await this.getState();
    const temp = state.matchData.player1;
    state.matchData.player1 = state.matchData.player2;
    state.matchData.player2 = temp;
    await this.setState(state);
  }

  /**
   * Use player timeout
   * @param {number} playerNum - 1 or 2
   */
  async usePlayerTimeout(playerNum) {
    const state = await this.getState();
    const playerKey = `player${playerNum}`;

    if (state.matchData[playerKey] && state.matchData[playerKey].timeouts > 0) {
      state.matchData[playerKey].timeouts -= 1;
      await this.setState(state);
    }
  }

  /**
   * Set race info text (legacy - kept for compatibility)
   * @param {string} raceInfo - Race info text (e.g., "Race to 7")
   */
  async setRaceInfo(raceInfo) {
    await this.setValue('matchData.raceInfo', raceInfo);
  }

  /**
   * Set match info tab text (universal for all sports) - LEGACY
   * @param {string} infoTab - Info tab text (e.g., "Race to 7", "Best of 3")
   */
  async setMatchInfoTab(infoTab) {
    await this.setValue('matchData.infoTab', infoTab);
  }

  /**
   * Set match info tab 1 text (universal for all sports)
   * @param {string} infoTab1 - First info tab text (e.g., "Race to 7", "Best of 3")
   */
  async setMatchInfoTab1(infoTab1) {
    await this.setValue('matchData.infoTab1', infoTab1);
  }

  /**
   * Set match info tab 2 text (universal for all sports)
   * @param {string} infoTab2 - Second info tab text (e.g., "Fargo 500", "$50 Action")
   */
  async setMatchInfoTab2(infoTab2) {
    await this.setValue('matchData.infoTab2', infoTab2);
  }

  /**
   * Set custom field
   * @param {number} fieldNum - 1 or 2
   * @param {string} label - Field label
   * @param {string} value - Field value
   */
  async setCustomField(fieldNum, label, value) {
    await this.mergeState({
      matchData: {
        [`custom${fieldNum}`]: { label, value }
      }
    });
  }

  // ============================================================================
  // SHOT CLOCK MANAGEMENT (Universal module for all sports)
  // ============================================================================

  /**
   * Start shot clock
   */
  async startShotClock() {
    console.log('⏱️ Starting shot clock...');
    await this.setValue('modules.shotClock.running', true);
    // Auto-enable when starting
    await this.setValue('modules.shotClock.enabled', true);
    console.log('✅ Shot clock started');
  }

  /**
   * Stop shot clock
   */
  async stopShotClock() {
    await this.setValue('modules.shotClock.running', false);
  }

  /**
   * Reset shot clock to default time
   */
  async resetShotClock() {
    const state = await this.getState();
    await this.mergeState({
      modules: {
        shotClock: {
          currentTime: state.modules.shotClock.duration,
          running: false,
        }
      }
    });
  }

  /**
   * Update shot clock time remaining
   * @param {number} seconds - Time remaining
   */
  async updateShotClockTime(seconds) {
    await this.setValue('modules.shotClock.currentTime', Math.max(0, seconds));
  }

  /**
   * Toggle shot clock enabled state
   * @param {boolean} enabled
   */
  async setShotClockEnabled(enabled) {
    await this.setValue('modules.shotClock.enabled', enabled);
  }

  /**
   * Set shot clock duration
   * @param {number} duration - Duration in seconds
   */
  async setShotClockDuration(duration) {
    await this.setValue('modules.shotClock.duration', duration);
    // Also reset currentTime to new duration
    await this.setValue('modules.shotClock.currentTime', duration);
  }

  /**
   * Set extension duration
   * @param {number} duration - Extension duration in seconds
   */
  async setExtensionDuration(duration) {
    await this.setValue('modules.shotClock.extensionDuration', duration);
  }

  /**
   * Set max extensions per player
   * @param {number} maxExtensions - Maximum extensions allowed per player
   */
  async setMaxExtensions(maxExtensions) {
    await this.setValue('modules.shotClock.maxExtensions', maxExtensions);
  }

  /**
   * Add shot clock extension for a player
   * @param {number} playerNum - 1 or 2
   */
  async addPlayerExtension(playerNum) {
    const state = await this.getState();
    const playerKey = `player${playerNum}`;

    if (state.matchData[playerKey] && state.modules?.shotClock) {
      const extensionDuration = state.modules.shotClock.extensionDuration || 10;
      const maxExtensions = state.modules.shotClock.maxExtensions || 3;
      const currentExtensions = state.matchData[playerKey].extensions;

      console.log(`🔵 P${playerNum} Extension clicked. Current: ${currentExtensions}/${maxExtensions}`);

      // Only add extension if player hasn't exceeded max
      if (currentExtensions < maxExtensions) {
        state.matchData[playerKey].extensions += 1;
        state.modules.shotClock.currentTime += extensionDuration;

        console.log(`✅ P${playerNum} Extension added: ${currentExtensions} → ${state.matchData[playerKey].extensions}/${maxExtensions}`);
        console.log(`⏱️ Clock time extended: +${extensionDuration}s → ${state.modules.shotClock.currentTime}s`);

        await this.setState(state);
      } else {
        console.warn(`❌ Player ${playerNum} has used all ${maxExtensions} extensions`);
      }
    }
  }

  /**
   * Remove one extension from a player (give back one extension)
   * Optionally subtracts extension duration from the clock time
   * @param {number} playerNum - 1 or 2
   * @param {boolean} removeTime - Whether to also subtract time from the clock (default: false)
   */
  async removePlayerExtension(playerNum, removeTime = false) {
    const state = await this.getState();
    const playerKey = `player${playerNum}`;

    if (state.matchData[playerKey] && state.modules?.shotClock) {
      const extensionDuration = state.modules.shotClock.extensionDuration || 10;
      const currentExtensions = state.matchData[playerKey].extensions;

      console.log(`🔵 P${playerNum} Remove Extension clicked. Current: ${currentExtensions}, Remove time: ${removeTime}`);

      // Only remove if player has extensions to remove
      if (currentExtensions > 0) {
        state.matchData[playerKey].extensions -= 1;

        // Optionally subtract extension duration from clock time
        if (removeTime) {
          const oldTime = state.modules.shotClock.currentTime;
          state.modules.shotClock.currentTime = Math.max(0, state.modules.shotClock.currentTime - extensionDuration);
          console.log(`⏱️ Clock time reduced: ${oldTime}s - ${extensionDuration}s = ${state.modules.shotClock.currentTime}s`);
        } else {
          console.log(`⏱️ Clock time unchanged (checkbox not checked)`);
        }

        console.log(`✅ P${playerNum} Extension removed: ${currentExtensions} → ${state.matchData[playerKey].extensions}`);

        await this.setState(state);
      } else {
        console.warn(`❌ Player ${playerNum} has no extensions to remove (already at 0)`);
      }
    }
  }

  /**
   * Reset player extensions to 0
   * @param {number} playerNum - 1 or 2
   */
  async resetPlayerExtensions(playerNum) {
    await this.setValue(`matchData.player${playerNum}.extensions`, 0);
  }

  /**
   * Toggle shot clock visibility
   * Also enables the clock when showing it
   */
  async toggleShotClockVisibility() {
    const state = await this.getState();
    if (!state.modules?.shotClock) {
      console.error('❌ Shot clock module not found in state');
      return;
    }
    const currentVisibility = state.modules.shotClock.visible !== false;
    const newVisibility = !currentVisibility;

    console.log(`👁️ Toggling shot clock visibility: ${currentVisibility} → ${newVisibility}`);

    // Update both visibility and enabled state
    await this.mergeState({
      modules: {
        shotClock: {
          visible: newVisibility,
          enabled: newVisibility // Enable when showing, disable when hiding
        }
      }
    });

    console.log('✅ Shot clock visibility toggled');
  }

  // ============================================================================
  // ADVERTISING MODULE MANAGEMENT
  // ============================================================================

  /**
   * Set advertising region visibility
   * @param {string} region - Region name ('top', 'left', 'right')
   * @param {boolean} visible - Visibility state
   */
  async setAdRegionVisibility(region, visible) {
    const regionKey = region.toLowerCase();
    await this.setValue(`modules.advertising.show${regionKey.charAt(0).toUpperCase() + regionKey.slice(1)}`, visible);

    // Broadcast change to overlay
    if (this.broadcastEnabled) {
      this.messageBus.send(MESSAGE_TYPES.ADS_REFRESH);
    }
  }

  /**
   * Get advertising region visibility
   * @param {string} region - Region name ('top', 'left', 'right')
   * @returns {Promise<boolean>} Visibility state (defaults to true)
   */
  async getAdRegionVisibility(region) {
    const regionKey = region.toLowerCase();
    const value = await this.getValue(`modules.advertising.show${regionKey.charAt(0).toUpperCase() + regionKey.slice(1)}`);
    return value !== false; // Default to true if not set
  }

  /**
   * Get all advertising region visibility states
   * @returns {Promise<Object>} { showTop, showLeft, showRight }
   */
  async getAdRegionVisibilities() {
    const state = await this.getState();
    const advertising = state.modules?.advertising || {};
    return {
      showTop: advertising.showTop !== false,
      showLeft: advertising.showLeft !== false,
      showRight: advertising.showRight !== false
    };
  }

  // ============================================================================
  // BALL TRACKER MANAGEMENT
  // ============================================================================

  /**
   * Get ball tracker state
   * @returns {Promise<Object>} Ball tracker state
   */
  async getBallTrackerState() {
    const state = await this.getState();
    return state.matchData?.ballTracker || {
      enabled: false,
      gameType: 'eight',
      assignments: {},
      pocketed: {}
    };
  }

  /**
   * Set ball tracker enabled state
   * @param {boolean} enabled
   */
  async setBallTrackerEnabled(enabled) {
    await this.setValue('matchData.ballTracker.enabled', enabled);
  }

  /**
   * Set ball tracker game type
   * @param {string} gameType - 'eight', 'nine', or 'ten'
   */
  async setGameType(gameType) {
    await this.setValue('matchData.ballTracker.gameType', gameType);
  }

  /**
   * Set player ball set assignment (8-ball only)
   * @param {number} playerNum - 1 or 2
   * @param {string} set - 'unassigned', 'solids', or 'stripes'
   */
  async setPlayerBallSet(playerNum, set) {
    await this.setValue(`matchData.ballTracker.assignments.p${playerNum}Set`, set);
  }

  /**
   * Toggle ball pocketed state
   * @param {string|number} ballNumber - Ball number (1-15)
   */
  async toggleBallPocketed(ballNumber) {
    const state = await this.getState();
    const ballNum = String(ballNumber);

    if (!state.matchData.ballTracker.pocketed) {
      state.matchData.ballTracker.pocketed = {};
    }

    state.matchData.ballTracker.pocketed[ballNum] = !state.matchData.ballTracker.pocketed[ballNum];
    await this.setState(state);
  }

  /**
   * Reset ball tracker to default state
   */
  async resetBallTracker() {
    await this.mergeState({
      matchData: {
        ballTracker: {
          enabled: true,
          gameType: 'eight',
          assignments: {
            p1Set: 'unassigned',
            p2Set: 'unassigned'
          },
          pocketed: {}
        }
      }
    });
  }

  /**
   * Clear only pocketed balls (keep game type and assignments)
   */
  async clearPocketedBalls() {
    console.log('🗑️ StateManager.clearPocketedBalls called');

    // Get current state
    const state = await this.getState();

    // Clear pocketed object by replacing it with empty object
    if (state.matchData?.ballTracker) {
      state.matchData.ballTracker.pocketed = {};
      await this.setState(state);
    }

    console.log('✅ StateManager.clearPocketedBalls - pocketed state cleared');
  }

  // ============================================================================
  // REACTIVE SUBSCRIPTIONS (liveQuery - UI auto-updates)
  // ============================================================================

  /**
   * Subscribe to entire match state (reactive)
   * UI automatically updates when ANY state change occurs
   *
   * Usage:
   *   const subscription = stateManager.subscribe(state => {
   *     console.log('State changed:', state);
   *     updateUI(state);
   *   });
   *
   *   // Later: subscription.unsubscribe()
   *
   * @param {Function} callback - Called with new state on every change
   * @returns {Subscription}
   */
  subscribe(callback) {
    return this.db.observeMatchState(this.STATE_ID).subscribe(callback);
  }

  /**
   * Subscribe to player1 score only (reactive)
   *
   * Usage:
   *   stateManager.subscribeToPlayer1Score(score => {
   *     document.getElementById('player1-score').textContent = score;
   *   });
   *
   * @param {Function} callback - Called with new score on every change
   * @returns {Subscription}
   */
  subscribeToPlayer1Score(callback) {
    return this.db.observeMatchState(this.STATE_ID).subscribe(state => {
      if (state?.matchData?.player1) {
        callback(state.matchData.player1.score);
      }
    });
  }

  /**
   * Subscribe to player2 score only (reactive)
   * @param {Function} callback
   * @returns {Subscription}
   */
  subscribeToPlayer2Score(callback) {
    return this.db.observeMatchState(this.STATE_ID).subscribe(state => {
      if (state?.matchData?.player2) {
        callback(state.matchData.player2.score);
      }
    });
  }

  /**
   * Subscribe to shot clock (reactive)
   * @param {Function} callback - Called with shot clock object
   * @returns {Subscription}
   */
  subscribeToShotClock(callback) {
    return this.db.observeMatchState(this.STATE_ID).subscribe(state => {
      if (state?.matchData?.shotClock) {
        callback(state.matchData.shotClock);
      }
    });
  }

  /**
   * Subscribe to specific value (reactive)
   * @param {string} path - Dot notation path
   * @param {Function} callback - Called with new value
   * @returns {Subscription}
   */
  subscribeToValue(path, callback) {
    return this.db.observeMatchState(this.STATE_ID).subscribe(state => {
      if (state) {
        const value = this._getNestedValue(state, path);
        callback(value);
      }
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get nested value from object using dot notation
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   * @private
   */
  _setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Deep merge two objects
   * @private
   */
  _deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }
}

// Export singleton instance
export const stateManager = new StateManager();
export default stateManager;
