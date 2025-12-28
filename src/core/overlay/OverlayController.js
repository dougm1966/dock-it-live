/**
 * OverlayController.js
 * Universal ES6 controller for the Dock-It.live broadcast canvas
 *
 * Replaces legacy jQuery/localStorage with:
 * - StateManager reactive subscriptions
 * - MessageBus for BroadcastChannel listening
 * - DexieDB for loading images
 *
 * This is the UNIVERSAL CORE - handles:
 * - Player names, photos, scores
 * - Shot clock (universal timer)
 * - Sponsor logos and slideshow
 * - Game info tabs
 *
 * Sport-specific widgets (Ball Tracker, Cricket Board, etc.) are loaded separately
 */

import { stateManager } from '../state/StateManager.js';
import { messageBus } from '../messaging/MessageBus.js';
import { dexieDB } from '../database/index.js';
import * as MESSAGE_TYPES from '../messaging/messageTypes.js';

class OverlayController {
  constructor() {
    this.stateSubscription = null;
    this.shotClockInterval = null;
    this.logoSlideshowInterval = null;
    this.logoCache = new Map(); // Cache object URLs

    // Sport-specific widget (dynamically loaded based on active module)
    this.activeWidget = null;

    this.init();
  }

  /**
   * Initialize the overlay
   */
  async init() {
    console.log('🎬 Universal Overlay initializing...');

    try {
      // Initialize StateManager
      await stateManager.init();
      console.log('✅ StateManager ready');

      // Setup BroadcastChannel message listeners
      this.setupMessageListeners();

      // Setup reactive state subscription
      this.setupStateSubscription();

      // Load sport-specific widget if needed
      await this.loadActiveWidget();

      // Initial render from state
      await this.renderFromState();

      // Start logo slideshow if enabled
      this.startLogoSlideshow();

      console.log('✅ Universal Overlay ready!');
    } catch (error) {
      console.error('❌ Overlay initialization failed:', error);
    }
  }

  /**
   * Load sport-specific widget based on active module
   */
  async loadActiveWidget() {
    const state = await stateManager.getState();

    console.log('🔍 Checking active modules:', state?.modules);

    // Check which sport module is enabled
    const billiardsEnabled = state?.modules?.billiards?.enabled;

    console.log('🎱 Billiards enabled?', billiardsEnabled);

    if (billiardsEnabled) {
      console.log('🎱 Loading Billiards Widget...');
      try {
        const { BilliardsWidget } = await import('../../modules/billiards/BilliardsWidget.js');
        this.activeWidget = new BilliardsWidget();
        this.activeWidget.init();
        console.log('✅ Billiards Widget loaded');
      } catch (error) {
        console.error('❌ Failed to load Billiards Widget:', error);
        console.error('Error details:', error.message, error.stack);
      }
    } else {
      console.warn('⚠️ Billiards module not enabled in state');
    }

    // Future: Add other sport widgets here
    // if (dartsEnabled) { load DartsWidget }
  }

  /**
   * Setup BroadcastChannel message listeners
   */
  setupMessageListeners() {
    messageBus.on(MESSAGE_TYPES.STATE_CHANGED, async () => {
      console.log('📡 STATE_CHANGED received - refreshing overlay');
      await this.renderFromState();
    });

    messageBus.on(MESSAGE_TYPES.SCORE_UPDATE, async () => {
      console.log('📡 SCORE_UPDATE received - refreshing overlay');
      await this.renderFromState();
    });

    messageBus.on('PLAYER_INFO_UPDATED', async () => {
      console.log('📡 PLAYER_INFO_UPDATED received - refreshing overlay');
      await this.renderFromState();
    });

    messageBus.on('LOGO_SLOT_CHANGED', async () => {
      console.log('📡 LOGO_SLOT_CHANGED received - refreshing overlay');
      await this.renderFromState();
    });

    messageBus.on('ADS_REFRESH', async () => {
      console.log('📡 ADS_REFRESH received - refreshing overlay');
      await this.renderFromState();
    });

    console.log('✅ Message listeners setup - overlay will refresh on broadcasts');
  }

  /**
   * Setup reactive state subscription
   */
  setupStateSubscription() {
    this.stateSubscription = stateManager.subscribe(async (state) => {
      if (state) {
        console.log('🔄 State updated, re-rendering overlay...');
        await this.updateFromState(state);
      }
    });

    console.log('✅ State subscription active');
  }

  /**
   * Initial render from state
   */
  async renderFromState() {
    const state = await stateManager.getState();
    if (state) {
      await this.updateFromState(state);
    }
  }

  /**
   * Update overlay UI from state
   */
  async updateFromState(state) {
    if (!state || !state.matchData) {
      console.warn('⚠️ Invalid state received in overlay');
      return;
    }

    console.log('🔄 Overlay updating from state');

    // Update player info (pass maxExtensions from shot clock module)
    const maxExtensions = state.modules?.shotClock?.maxExtensions || 3;
    await this.updatePlayerInfo(state.matchData, maxExtensions);

    // Update scores
    this.updateScores(state.matchData);

    // Update shot clock (universal module - with split-state animation)
    if (state.modules?.shotClock) {
      console.log('📡 Shot clock module found in state, updating display...');
      this.updateShotClock(state.modules.shotClock);
    } else {
      console.warn('⚠️ Shot clock module NOT found in state');
    }

    // Update logo slots
    await this.updateLogoSlots(state.logoSlots);

    // Update game info (race info, wager info)
    this.updateGameInfo(state.matchData);

    // Update scoreboard visibility
    this.updateScoreboardVisibility(state.uiSettings);

    // Update sport-specific widget if active
    if (this.activeWidget && state.matchData?.ballTracker) {
      this.activeWidget.updateBallTracker(state.matchData.ballTracker);
    }
  }

  /**
   * Update player information (names, photos, extensions, Fargo info)
   * @param {Object} matchData - Match data object
   * @param {number} maxExtensions - Maximum extensions allowed per player
   */
  async updatePlayerInfo(matchData, maxExtensions = 3) {
    const { player1, player2 } = matchData;

    console.log('👤 Updating player info:', {
      p1Name: player1?.name,
      p2Name: player2?.name,
      p1Fargo: player1?.fargoInfo,
      p2Fargo: player2?.fargoInfo
    });

    // Player 1 name (with Fargo info if available)
    const p1NameSpan = document.querySelector('#player1Name .playerNameText');
    if (p1NameSpan) {
      let p1Text = player1.name || 'Player 1';
      if (player1.fargoInfo) {
        p1Text += ` (${player1.fargoInfo})`;
      }
      p1NameSpan.textContent = p1Text;
      console.log(`✅ P1 name displayed: "${p1Text}"`);
    } else {
      console.error('❌ P1 name element not found');
    }

    // Player 2 name (with Fargo info if available)
    const p2NameSpan = document.querySelector('#player2Name .playerNameText');
    if (p2NameSpan) {
      let p2Text = player2.name || 'Player 2';
      if (player2.fargoInfo) {
        p2Text += ` (${player2.fargoInfo})`;
      }
      p2NameSpan.textContent = p2Text;
      console.log(`✅ P2 name displayed: "${p2Text}"`);
    } else {
      console.error('❌ P2 name element not found');
    }

    // Player 1 photo
    await this.updatePlayerPhoto(1, player1.photoAssetId);

    // Player 2 photo
    await this.updatePlayerPhoto(2, player2.photoAssetId);

    // Extension icons (EXT tracking) - only show when shot clock is active
    const state = await stateManager.getState();
    const clockActive = state.modules?.shotClock?.enabled && state.modules?.shotClock?.visible;

    console.log(`🎯 Updating extension badges - P1: ${player1.extensions}/${maxExtensions}, P2: ${player2.extensions}/${maxExtensions}, clockActive: ${clockActive}`);

    this.updateExtensionIcon(1, player1.extensions, maxExtensions, clockActive);
    this.updateExtensionIcon(2, player2.extensions, maxExtensions, clockActive);
  }

  /**
   * Update player photo
   */
  async updatePlayerPhoto(playerNum, assetId) {
    const photoImg = document.getElementById(`player${playerNum}-photo`);
    if (!photoImg) return;

    if (!assetId) {
      photoImg.src = '';
      photoImg.style.display = 'none';
      return;
    }

    try {
      const objectUrl = await this.getObjectUrl(assetId);
      if (objectUrl) {
        photoImg.src = objectUrl;
        photoImg.style.display = 'inline-block';
      }
    } catch (error) {
      console.error(`Failed to load player ${playerNum} photo:`, error);
      photoImg.src = '';
      photoImg.style.display = 'none';
    }
  }

  /**
   * Update extension icon (show "Ex" badge if player has extensions)
   * Display format: "Ex" for 0 or 1, "2x" for 2, "3x" for 3, etc.
   * Color: Green when extensions available, Red when all used
   * Shows when shot clock is active (enabled AND visible)
   */
  updateExtensionIcon(playerNum, extensions, maxExtensions = 3, clockActive = false) {
    const icon = document.getElementById(`p${playerNum}ExtIcon`);
    if (!icon) return;

    const count = extensions || 0;

    // Show badge when shot clock is ACTIVE (enabled + visible)
    if (clockActive) {
      icon.classList.remove('fadeOutElm');
      icon.classList.add('fadeInElm');

      // Display "Ex" for 0 or 1 extension, "2x" for 2, "3x" for 3, etc.
      icon.textContent = count === 0 || count === 1 ? 'Ex' : `${count}x`;

      // Green when still have extensions available, Red when maxed out
      if (count >= maxExtensions) {
        icon.style.backgroundColor = '#dc2626'; // Red - all extensions used
        icon.style.color = '#ffffff';
      } else {
        icon.style.backgroundColor = '#16a34a'; // Green - extensions still available
        icon.style.color = '#ffffff';
      }

      console.log(`✅ Extension badge P${playerNum}: ${icon.textContent} (${count}/${maxExtensions}) - ${count >= maxExtensions ? 'RED' : 'GREEN'}`);
    } else {
      icon.classList.add('fadeOutElm');
      icon.classList.remove('fadeInElm');
      icon.textContent = 'Ex';
      console.log(`❌ Extension badge P${playerNum}: Hidden (clock not active)`);
    }
  }

  /**
   * Update scores
   */
  updateScores(matchData) {
    const { player1, player2 } = matchData;

    // Player 1 score
    const p1ScoreSpan = document.getElementById('player1Score');
    if (p1ScoreSpan) {
      p1ScoreSpan.textContent = player1.score || 0;
    }

    // Player 2 score
    const p2ScoreSpan = document.getElementById('player2Score');
    if (p2ScoreSpan) {
      p2ScoreSpan.textContent = player2.score || 0;
    }
  }

  /**
   * Update shot clock display with split-state animation
   */
  updateShotClock(shotClock) {
    if (!shotClock) {
      console.warn('⚠️ Shot clock state is null/undefined');
      return;
    }

    console.log('⏱️ Updating shot clock:', {
      enabled: shotClock.enabled,
      visible: shotClock.visible,
      currentTime: shotClock.currentTime,
      running: shotClock.running
    });

    const shotClockDiv = document.getElementById('shotClock');
    const shotClockVis = document.getElementById('shotClockVis');
    const scoreBoardDiv = document.getElementById('scoreBoardDiv');
    const player1Name = document.getElementById('player1Name');
    const player2Name = document.getElementById('player2Name');

    if (!shotClockDiv || !shotClockVis || !scoreBoardDiv) {
      console.error('❌ Shot clock DOM elements not found');
      return;
    }

    const clockEnabled = shotClock.enabled;
    const clockVisible = shotClock.visible !== false; // Default to true if not specified

    // SPLIT-STATE ANIMATION: Toggle clock-visible class on scoreboard
    if (clockEnabled && clockVisible) {
      scoreBoardDiv.classList.add('clock-visible');
      shotClockDiv.classList.remove('fadeOutElm');
      shotClockDiv.classList.add('fadeInElm');
      shotClockVis.classList.remove('fadeOutElm');
      shotClockVis.classList.add('fadeInElm');

      // Add clock-enabled class to player names for extension icon spacing
      if (player1Name) player1Name.classList.add('clock-enabled');
      if (player2Name) player2Name.classList.add('clock-enabled');

      // Update shot clock text
      const time = shotClock.currentTime || shotClock.duration || 40;
      shotClockDiv.textContent = time;

      // Update shot clock visual bar (percentage)
      const percentage = (time / shotClock.duration) * 100;
      shotClockVis.style.width = `${percentage}%`;

      // LOW TIME WARNING: Red background when under 10 seconds
      if (time <= 10) {
        shotClockDiv.style.backgroundColor = 'red';
        shotClockDiv.classList.add('shotRed');
      } else {
        shotClockDiv.style.backgroundColor = 'green';
        shotClockDiv.classList.remove('shotRed');
      }
    } else {
      scoreBoardDiv.classList.remove('clock-visible');
      shotClockDiv.classList.add('fadeOutElm');
      shotClockDiv.classList.remove('fadeInElm');
      shotClockVis.classList.add('fadeOutElm');
      shotClockVis.classList.remove('fadeInElm');

      // Remove clock-enabled class from player names
      if (player1Name) player1Name.classList.remove('clock-enabled');
      if (player2Name) player2Name.classList.remove('clock-enabled');
    }
  }

  /**
   * Update logo slots
   */
  async updateLogoSlots(logoSlots) {
    if (!logoSlots) return;

    // Left sponsor logo (tableTopLeft)
    await this.updateSponsorLogo('leftSponsorLogoImg', logoSlots.tableTopLeft);

    // Right sponsor logo (tableTopRight)
    await this.updateSponsorLogo('rightSponsorLogoImg', logoSlots.tableTopRight);

    // Slideshow logos (for sponsor slideshow)
    await this.updateSlideshowLogos(logoSlots);
  }

  /**
   * Update a single sponsor logo
   */
  async updateSponsorLogo(imgId, slotData) {
    const img = document.getElementById(imgId);
    if (!img) return;

    if (!slotData || !slotData.assetId || !slotData.active) {
      img.src = '';
      img.classList.add('fadeOutElm');
      img.classList.remove('fadeInElm');
      return;
    }

    try {
      const objectUrl = await this.getObjectUrl(slotData.assetId);
      if (objectUrl) {
        img.src = objectUrl;
        img.classList.remove('fadeOutElm');
        img.classList.add('fadeInElm');
      }
    } catch (error) {
      console.error(`Failed to load sponsor logo ${imgId}:`, error);
      img.src = '';
      img.classList.add('fadeOutElm');
    }
  }

  /**
   * Update slideshow logos
   */
  async updateSlideshowLogos(logoSlots) {
    // Map sponsor assets to slideshow slots
    const slideshowAssets = await dexieDB.listAssets({ type: 'sponsor', tags: 'slideshow' });

    for (let i = 1; i <= 3; i++) {
      const img = document.getElementById(`customLogo${i}`);
      if (!img) continue;

      const asset = slideshowAssets[i - 1];
      if (asset) {
        const objectUrl = await this.getObjectUrl(asset.id);
        if (objectUrl) {
          img.src = objectUrl;
        }
      } else {
        img.src = '';
      }
    }
  }

  /**
   * Update game info (match info tabs - universal for all sports)
   */
  updateGameInfo(matchData) {
    // Info Tab 1 (Race to 7, Best of 3, etc.)
    const raceInfoDiv = document.getElementById('raceInfo');
    if (raceInfoDiv) {
      // Use infoTab1, fall back to infoTab or raceInfo for legacy compatibility
      const infoText = matchData.infoTab1 || matchData.infoTab || matchData.raceInfo || '';

      if (infoText) {
        raceInfoDiv.textContent = infoText;
        raceInfoDiv.classList.remove('noShow');
        raceInfoDiv.classList.add('fadeInElm');
      } else {
        // Hide gracefully when empty
        raceInfoDiv.classList.add('noShow');
        raceInfoDiv.classList.remove('fadeInElm');
      }
    }

    // Info Tab 2 (Fargo 500, $50 Action, etc.)
    const wagerInfoDiv = document.getElementById('wagerInfo');
    if (wagerInfoDiv) {
      // Use infoTab2, fall back to wagerInfo for legacy compatibility
      const infoText = matchData.infoTab2 || matchData.wagerInfo || '';

      if (infoText) {
        wagerInfoDiv.textContent = infoText;
        wagerInfoDiv.classList.remove('noShow');
        wagerInfoDiv.classList.add('fadeInElm');
      } else {
        // Hide gracefully when empty
        wagerInfoDiv.classList.add('noShow');
        wagerInfoDiv.classList.remove('fadeInElm');
      }
    }
  }

  /**
   * Update scoreboard visibility
   */
  updateScoreboardVisibility(uiSettings) {
    if (!uiSettings) return;

    const scoreboard = document.getElementById('scoreBoardDiv');
    if (!scoreboard) return;

    if (uiSettings.showScoreboard === false) {
      scoreboard.classList.add('fadeOutElm');
      scoreboard.classList.remove('fadeInElm');
    } else {
      scoreboard.classList.remove('fadeOutElm');
      scoreboard.classList.add('fadeInElm');
    }
  }

  /**
   * Start logo slideshow
   */
  startLogoSlideshow() {
    let slideIndex = 0;

    const showSlides = () => {
      const slides = document.getElementsByClassName('mySlides');

      for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = 'none';
      }

      slideIndex++;
      if (slideIndex > slides.length) {
        slideIndex = 1;
      }

      if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].style.display = 'block';
      }
    };

    // Show first slide immediately
    showSlides();

    // Change slide every 3 seconds
    this.logoSlideshowInterval = setInterval(showSlides, 3000);
  }

  /**
   * Get object URL for an asset (with caching)
   * Uses relative paths for OBS compatibility
   */
  async getObjectUrl(assetId) {
    if (!assetId) return null;

    // Check cache first
    if (this.logoCache.has(assetId)) {
      return this.logoCache.get(assetId);
    }

    // Fetch from database
    try {
      const objectUrl = await dexieDB.getAssetObjectUrl(assetId);

      if (objectUrl) {
        this.logoCache.set(assetId, objectUrl);
        return objectUrl;
      }
    } catch (error) {
      console.error(`Failed to get object URL for ${assetId}:`, error);
    }

    return null;
  }

  /**
   * Cleanup on unload
   */
  destroy() {
    // Unsubscribe from state
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }

    // Clear intervals
    if (this.shotClockInterval) {
      clearInterval(this.shotClockInterval);
    }

    if (this.logoSlideshowInterval) {
      clearInterval(this.logoSlideshowInterval);
    }

    // Revoke cached object URLs
    for (const url of this.logoCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.logoCache.clear();

    console.log('✅ Overlay destroyed');
  }
}

// Initialize controller
const controller = new OverlayController();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  controller.destroy();
});

// Make available in console for debugging
window.overlay = controller;
window.stateManager = stateManager;

// Debugging helpers
window.debugOverlayState = async () => {
  const state = await stateManager.getState();
  console.log('📊 Overlay Current State:', state);
  return state;
};

window.refreshOverlay = async () => {
  console.log('🔄 Manually refreshing overlay...');
  await controller.renderFromState();
  console.log('✅ Overlay refreshed');
};

window.enableBilliards = async () => {
  console.log('🎱 Enabling billiards module...');
  await stateManager.setValue('modules.billiards', { enabled: true });
  console.log('✅ Billiards module enabled - refreshing overlay...');
  location.reload();
};

console.log('✅ Universal OverlayController.js loaded');
console.log('💡 Debug commands: debugOverlayState(), refreshOverlay(), enableBilliards()');
