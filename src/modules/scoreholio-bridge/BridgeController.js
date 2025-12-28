/**
 * Scoreholio Bridge Controller
 *
 * Fetches live match data from Scoreholio and syncs it to the local state.
 * Handles CORS issues via proxy/fallback mechanisms.
 */

import { stateManager } from '../../core/state/StateManager.js';
import { messenger } from '../../core/messaging/BroadcastMessenger.js';
import * as MESSAGE_TYPES from '../../core/messaging/messageTypes.js';

export class ScoreholioBridgeController {
  constructor() {
    this.stateManager = null;
    this.messenger = null;
    this.scoreholioUrl = '';
    this.isConnected = false;
    this.pollingInterval = null;
    this.pollingFrequency = 5000; // 5 seconds default
    this.lastFetchTime = null;
    this.errorCount = 0;
    this.maxErrors = 3;
    this.activeSport = 'billiards'; // Default sport

    // Sport-specific CSS selector maps
    this.ratingSelectors = {
      billiards: {
        fargo: '.fargo-val, .fargo-rating, [data-rating="fargo"], .rating-pill.fargo',
        skillLevel: '.skill-level, .player-level'
      },
      darts: {
        ppd: '.ppd-val, .avg-val, [data-rating="ppd"], .rating-pill.ppd',
        mpr: '.mpr-val, [data-rating="mpr"], .rating-pill.mpr'
      }
    };
  }

  /**
   * Initialize the bridge controller
   */
  async init() {
    console.log('[ScoreholioBridge] Initializing...');

    // Use imported singleton instances
    this.stateManager = stateManager;
    this.messenger = messenger;

    // Load saved URL from state if available
    const state = await this.stateManager.getState();
    if (state.scoreholio?.url) {
      this.scoreholioUrl = state.scoreholio.url;
    }

    console.log('[ScoreholioBridge] Initialized successfully');
  }

  /**
   * Connect to a Scoreholio court URL
   * @param {string} url - The Scoreholio court URL
   */
  async connect(url) {
    if (!url || !this.isValidScoreholioUrl(url)) {
      throw new Error('Invalid Scoreholio URL. Expected format: https://scoreholio.com/court/...');
    }

    console.log('[ScoreholioBridge] Connecting to:', url);
    this.scoreholioUrl = url;
    this.errorCount = 0;

    // Save URL to state
    await this.stateManager.setValue('scoreholio.url', url);
    await this.stateManager.setValue('scoreholio.connected', true);

    // Start polling
    this.startPolling();
    this.isConnected = true;

    return { success: true, message: 'Connected to Scoreholio court' };
  }

  /**
   * Disconnect from Scoreholio
   */
  async disconnect() {
    console.log('[ScoreholioBridge] Disconnecting...');
    this.stopPolling();
    this.isConnected = false;

    await this.stateManager.setValue('scoreholio.connected', false);

    return { success: true, message: 'Disconnected from Scoreholio' };
  }

  /**
   * Validate Scoreholio URL format
   * @param {string} url
   */
  isValidScoreholioUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('scoreholio.com');
    } catch {
      return false;
    }
  }

  /**
   * Start polling Scoreholio for updates
   */
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Fetch immediately
    this.fetchAndSync();

    // Then poll at interval
    this.pollingInterval = setInterval(() => {
      this.fetchAndSync();
    }, this.pollingFrequency);

    console.log('[ScoreholioBridge] Polling started (interval:', this.pollingFrequency, 'ms)');
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[ScoreholioBridge] Polling stopped');
    }
  }

  /**
   * Fetch data from Scoreholio and sync to local state
   */
  async fetchAndSync() {
    if (!this.scoreholioUrl) {
      console.warn('[ScoreholioBridge] No URL configured');
      return;
    }

    try {
      console.log('[ScoreholioBridge] Fetching data from:', this.scoreholioUrl);

      // Attempt to fetch the HTML
      const data = await this.fetchScoreholioData(this.scoreholioUrl);

      if (data) {
        // Parse the HTML to extract match data
        const matchData = this.parseScoreholioHtml(data.html);

        if (matchData) {
          // Sync to local state
          await this.syncToState(matchData);

          this.lastFetchTime = new Date();
          this.errorCount = 0; // Reset error count on success

          console.log('[ScoreholioBridge] Data synced successfully:', matchData);
        }
      }
    } catch (error) {
      this.handleFetchError(error);
    }
  }

  /**
   * Fetch data from Scoreholio (handles CORS via proxy if needed)
   * @param {string} url
   */
  async fetchScoreholioData(url) {
    // Try direct fetch first
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return { html, method: 'direct' };
    } catch (directError) {
      console.warn('[ScoreholioBridge] Direct fetch failed:', directError.message);

      // Try CORS proxy as fallback
      return await this.fetchViaProxy(url);
    }
  }

  /**
   * Fetch via CORS proxy (fallback method)
   * @param {string} url
   */
  async fetchViaProxy(url) {
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      // Add more proxy options as needed
    ];

    for (const proxyUrl of proxies) {
      try {
        console.log('[ScoreholioBridge] Trying proxy:', proxyUrl);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html'
          }
        });

        if (response.ok) {
          const html = await response.text();
          console.log('[ScoreholioBridge] Proxy fetch successful');
          return { html, method: 'proxy', proxy: proxyUrl };
        }
      } catch (proxyError) {
        console.warn('[ScoreholioBridge] Proxy failed:', proxyError.message);
        continue;
      }
    }

    throw new Error('All fetch methods failed (direct + proxies). CORS may be blocking access.');
  }

  /**
   * Parse Scoreholio HTML to extract match data
   * @param {string} html
   */
  parseScoreholioHtml(html) {
    try {
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Detect sport from page (if available)
      const detectedSport = this.detectSportFromHtml(doc);
      if (detectedSport) {
        this.activeSport = detectedSport;
      }

      // Extract player names and scores
      // NOTE: These selectors are PLACEHOLDERS and need to be updated
      // based on actual Scoreholio HTML structure
      const matchData = {
        activeSport: this.activeSport,
        player1: {
          name: this.extractText(doc, '.player-1-name, .player1-name, [data-player="1"] .name, .p1-name'),
          score: this.extractNumber(doc, '.player-1-score, .player1-score, [data-player="1"] .score, .p1-score'),
          ratings: this.extractRatings(doc, 1)
        },
        player2: {
          name: this.extractText(doc, '.player-2-name, .player2-name, [data-player="2"] .name, .p2-name'),
          score: this.extractNumber(doc, '.player-2-score, .player2-score, [data-player="2"] .score, .p2-score'),
          ratings: this.extractRatings(doc, 2)
        },
        raceInfo: this.extractText(doc, '.race-to, .match-format, .game-info, .race-info'),
        gameType: this.extractText(doc, '.game-type, .match-type, .sport-type')
      };

      // Validate that we got at least player names
      if (!matchData.player1.name && !matchData.player2.name) {
        console.warn('[ScoreholioBridge] Could not parse player names. HTML structure may have changed.');
        console.log('[ScoreholioBridge] Sample HTML:', html.substring(0, 500));
        return null;
      }

      return matchData;
    } catch (error) {
      console.error('[ScoreholioBridge] Parse error:', error);
      return null;
    }
  }

  /**
   * Detect sport type from Scoreholio HTML
   * @param {Document} doc
   * @returns {string} 'billiards' | 'darts' | null
   */
  detectSportFromHtml(doc) {
    const sportIndicators = {
      billiards: ['.billiards-match', '.pool-match', '[data-sport="billiards"]', '[data-sport="pool"]'],
      darts: ['.darts-match', '[data-sport="darts"]']
    };

    for (const [sport, selectors] of Object.entries(sportIndicators)) {
      for (const selector of selectors) {
        if (doc.querySelector(selector)) {
          console.log(`[ScoreholioBridge] Detected sport: ${sport}`);
          return sport;
        }
      }
    }

    // Check meta tags or page title for sport hints
    const pageTitle = doc.querySelector('title')?.textContent.toLowerCase() || '';
    if (pageTitle.includes('darts')) return 'darts';
    if (pageTitle.includes('pool') || pageTitle.includes('billiards')) return 'billiards';

    return null; // Default to current activeSport
  }

  /**
   * Extract ratings for a player based on active sport
   * @param {Document} doc
   * @param {number} playerNum - 1 or 2
   * @returns {Object} ratings object { fargo, ppd, mpr, display, source }
   */
  extractRatings(doc, playerNum) {
    const ratings = {
      fargo: null,
      ppd: null,
      mpr: null,
      display: null,
      source: 'scoreholio'
    };

    const playerPrefix = `.player-${playerNum}, .p${playerNum}, [data-player="${playerNum}"]`;

    if (this.activeSport === 'billiards') {
      // Extract Fargo rating
      const fargoSelectors = this.ratingSelectors.billiards.fargo.split(',').map(s =>
        `${playerPrefix} ${s.trim()}, ${s.trim()}`
      ).join(', ');

      const fargoValue = this.extractNumber(doc, fargoSelectors);
      if (fargoValue) {
        ratings.fargo = fargoValue;
        ratings.display = 'fargo';
      }

      // Fallback: Try extracting from text like "Fargo 520"
      const fargoText = this.extractText(doc, `${playerPrefix} .rating, ${playerPrefix} .fargo-info`);
      if (!ratings.fargo && fargoText) {
        const match = fargoText.match(/fargo\s*(\d+)/i);
        if (match) {
          ratings.fargo = parseInt(match[1], 10);
          ratings.display = 'fargo';
        }
      }

    } else if (this.activeSport === 'darts') {
      // Extract PPD (Points Per Dart)
      const ppdSelectors = this.ratingSelectors.darts.ppd.split(',').map(s =>
        `${playerPrefix} ${s.trim()}, ${s.trim()}`
      ).join(', ');

      const ppdValue = this.extractFloat(doc, ppdSelectors);
      if (ppdValue) {
        ratings.ppd = ppdValue;
        ratings.display = 'ppd';
      }

      // Extract MPR (Marks Per Round)
      const mprSelectors = this.ratingSelectors.darts.mpr.split(',').map(s =>
        `${playerPrefix} ${s.trim()}, ${s.trim()}`
      ).join(', ');

      const mprValue = this.extractFloat(doc, mprSelectors);
      if (mprValue) {
        ratings.mpr = mprValue;
        if (!ratings.display) ratings.display = 'mpr';
      }
    }

    // Set default display if none found
    if (!ratings.display) {
      if (ratings.fargo) ratings.display = 'fargo';
      else if (ratings.ppd) ratings.display = 'ppd';
      else if (ratings.mpr) ratings.display = 'mpr';
    }

    return ratings;
  }

  /**
   * Extract text content from DOM using CSS selectors
   * @param {Document} doc
   * @param {string} selectors - Comma-separated CSS selectors
   */
  extractText(doc, selectors) {
    const selectorList = selectors.split(',').map(s => s.trim());

    for (const selector of selectorList) {
      const element = doc.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return '';
  }

  /**
   * Extract numeric value from DOM
   * @param {Document} doc
   * @param {string} selectors
   */
  extractNumber(doc, selectors) {
    const text = this.extractText(doc, selectors);
    const num = parseInt(text, 10);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Extract floating point value from DOM (for PPD, MPR, etc.)
   * @param {Document} doc
   * @param {string} selectors
   */
  extractFloat(doc, selectors) {
    const text = this.extractText(doc, selectors);
    const num = parseFloat(text);
    return isNaN(num) ? null : num;
  }

  /**
   * Sync parsed Scoreholio data to local state
   * @param {Object} matchData
   */
  async syncToState(matchData) {
    console.log('[ScoreholioBridge] Syncing to state:', matchData);

    // Update active sport if detected
    if (matchData.activeSport) {
      await this.stateManager.setValue('matchData.activeSport', matchData.activeSport);
    }

    // Update player names if available
    if (matchData.player1?.name) {
      await this.stateManager.setPlayerName(1, matchData.player1.name);
    }
    if (matchData.player2?.name) {
      await this.stateManager.setPlayerName(2, matchData.player2.name);
    }

    // Update scores if available
    if (matchData.player1?.score !== undefined) {
      await this.stateManager.setScore(1, matchData.player1.score);
    }
    if (matchData.player2?.score !== undefined) {
      await this.stateManager.setScore(2, matchData.player2.score);
    }

    // Update player ratings if available
    if (matchData.player1?.ratings) {
      await this.syncPlayerRatings(1, matchData.player1.ratings);
    }
    if (matchData.player2?.ratings) {
      await this.syncPlayerRatings(2, matchData.player2.ratings);
    }

    // Update race info if available
    if (matchData.raceInfo) {
      await this.stateManager.setRaceInfo(matchData.raceInfo);
    }

    // Broadcast update to overlay
    this.messenger.send(MESSAGE_TYPES.MATCH_STATE_CHANGED, {
      source: 'scoreholio-bridge',
      timestamp: Date.now()
    });

    console.log('[ScoreholioBridge] State updated successfully');
  }

  /**
   * Sync player ratings to state
   * @param {number} playerNum
   * @param {Object} ratings - { fargo, ppd, mpr, display, source }
   */
  async syncPlayerRatings(playerNum, ratings) {
    // Update the entire ratings object
    await this.stateManager.setValue(`matchData.player${playerNum}.ratings`, ratings);

    // Also update the legacy fargoInfo field for backward compatibility
    if (ratings.display && ratings[ratings.display]) {
      const displayValue = ratings[ratings.display];
      const displayName = ratings.display.toUpperCase();
      const fargoInfo = `${displayName} ${displayValue}`;
      await this.stateManager.setPlayerFargo(playerNum, fargoInfo);
    }

    console.log(`[ScoreholioBridge] Player ${playerNum} ratings updated:`, ratings);
  }

  /**
   * Handle fetch errors
   * @param {Error} error
   */
  handleFetchError(error) {
    this.errorCount++;
    console.error('[ScoreholioBridge] Fetch error:', error.message);

    // Stop polling after max errors
    if (this.errorCount >= this.maxErrors) {
      console.error('[ScoreholioBridge] Max errors reached. Stopping polling.');
      this.stopPolling();
      this.isConnected = false;

      // Update state
      this.stateManager.setValue('scoreholio.connected', false);
      this.stateManager.setValue('scoreholio.error', error.message);
    }
  }

  /**
   * Set polling frequency
   * @param {number} milliseconds
   */
  setPollingFrequency(milliseconds) {
    this.pollingFrequency = Math.max(1000, milliseconds); // Min 1 second

    if (this.isConnected) {
      this.startPolling(); // Restart with new frequency
    }
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      url: this.scoreholioUrl,
      lastFetch: this.lastFetchTime,
      errorCount: this.errorCount,
      pollingFrequency: this.pollingFrequency
    };
  }
}
