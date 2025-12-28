(function() {
'use strict';

/**
 * g4ScoreBoard Browser Compact - Bundled Version
 * Copyright 2022-2025 Norman Gholson IV
 * https://g4billiards.com http://www.g4creations.com
 *
 * This file bundles all ES6 modules into a single file for OBS compatibility.
 * The modular source files are kept in common/js/browser_compact/ for reference.
 */

// ===== CONSTANTS MODULE =====

// Shot Clock Durations (milliseconds)
const CLOCK_30S = 31000; // 30s + 1s buffer
const CLOCK_60S = 61000; // 60s + 1s buffer
const EXTENSION_TIME = 30000; // 30s extension

// Shot Clock Thresholds (milliseconds)
const THRESHOLD_SHOW = 31000;
const THRESHOLD_FADE = 26000;
const THRESHOLD_ORANGE = 21000;
const THRESHOLD_YELLOW = 16000;
const THRESHOLD_TOMATO = 11000;
const THRESHOLD_RED = 6000;
const THRESHOLD_BEEP = 11000;
const THRESHOLD_BEEP_END = 9700;

// Animation Timings
const FADE_DURATION = 1000;
const BLINK_DURATION = 500;
const SLIDESHOW_INTERVAL = 20000;

// BroadcastChannel Names
const CHANNEL_MAIN = 'g4-main';
const CHANNEL_RECV = 'g4-recv';

// localStorage Keys (browser_compact specific)
const STORAGE_KEYS = {
  customImage: 'customImage', // Different from browser_source
  customLogo1: 'customLogo1',
  customLogo2: 'customLogo2',
  customLogo3: 'customLogo3',
  customLogo4: 'customLogo4',
  p1Score: 'p1ScoreCtrlPanel',
  p2Score: 'p2ScoreCtrlPanel',
  p1Name: 'p1NameCtrlPanel',
  p2Name: 'p2NameCtrlPanel',
  p1Color: 'p1colorSet',
  p2Color: 'p2colorSet',
  raceInfo: 'raceInfo',
  wagerInfo: 'wagerInfo',
  useClock: 'useClock',
  useCustomLogo: 'useCustomLogo',
  useSalotto: 'useSalotto',
  slideShow: 'slideShow'
};

// DOM Element IDs (browser_compact has some differences)
const DOM_IDS = {
  scoreBoard: 'scoreBoardDiv',
  raceInfo: 'raceInfo',
  wagerInfo: 'wagerInfo',
  shotClock: 'shotClock',
  shotClockVis: 'shotClockVis',
  p1Name: 'player1Name',
  p2Name: 'player2Name',
  p1Score: 'player1Score',
  p2Score: 'player2Score',
  p1ExtIcon: 'p1ExtIcon',
  p2ExtIcon: 'p2ExtIcon',
  salottoLogo: 'salottoLogo',
  g4Logo: 'g4Logo',
  customLogo1: 'customLogo1',
  customLogo2: 'customLogo2',
  customLogo3: 'customLogo3',
  logoSlideshow: 'logoSlideshowDiv'
};

// ===== STORAGE MODULE =====

/**
 * Storage module - handles localStorage operations for browser_compact
 */
const Storage = {
  /**
   * Get value from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  },

  /**
   * Set value in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  set(key, value) {
    localStorage.setItem(key, value);
  },

  /**
   * Load all initial state from localStorage
   * @returns {Object} State object with all values
   */
  loadInitialState() {
    return {
      customImage: this.get(STORAGE_KEYS.customImage, ''),
      customLogo1: this.get(STORAGE_KEYS.customLogo1, ''),
      customLogo2: this.get(STORAGE_KEYS.customLogo2, ''),
      customLogo3: this.get(STORAGE_KEYS.customLogo3, ''),
      customLogo4: this.get(STORAGE_KEYS.customLogo4, ''),
      p1Score: this.get(STORAGE_KEYS.p1Score, '0'),
      p2Score: this.get(STORAGE_KEYS.p2Score, '0'),
      p1Name: this.get(STORAGE_KEYS.p1Name, 'Player 1'),
      p2Name: this.get(STORAGE_KEYS.p2Name, 'Player 2'),
      p1Color: this.get(STORAGE_KEYS.p1Color, ''),
      p2Color: this.get(STORAGE_KEYS.p2Color, ''),
      raceInfo: this.get(STORAGE_KEYS.raceInfo, ''),
      wagerInfo: this.get(STORAGE_KEYS.wagerInfo, ''),
      useClock: this.get(STORAGE_KEYS.useClock, 'no'),
      useCustomLogo: this.get(STORAGE_KEYS.useCustomLogo, 'no'),
      useSalotto: this.get(STORAGE_KEYS.useSalotto, 'no'),
      slideShow: this.get(STORAGE_KEYS.slideShow, 'no')
    };
  }
};

// ===== SHOT CLOCK MODULE =====

/**
 * Shot Clock module for browser_compact - simplified version
 */
class ShotClock {
  constructor() {
    this.intervalId = null;
    this.countDownTime = 0;
    this.lastSecondsValue = 0;

    // BroadcastChannel for sending time updates
    this.bcr = new BroadcastChannel('g4-recv');

    // Cache DOM elements
    this.clockDisplay = document.getElementById(DOM_IDS.shotClock);
    this.progressBar = document.getElementById(DOM_IDS.shotClockVis);
  }

  /**
   * Start shot clock timer
   * @param {number} duration - Duration in milliseconds
   */
  start(duration) {
    this.countDownTime = new Date().getTime() + duration;

    this.intervalId = setInterval(() => this._tick(duration), 1000);
  }

  /**
   * Stop clock and hide display
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.hide();
    this.clockDisplay.innerHTML = '&nbsp;';
    this.clockDisplay.classList.remove('shotRed');
    this.clockDisplay.style.background = '';
    this.progressBar.classList.replace('fadeInElm', 'fadeOutElm');
    this.progressBar.classList.remove('startTimer', 'start60');
    this.progressBar.style.background = '';
  }

  /**
   * Show clock display
   */
  show() {
    this.clockDisplay.classList.replace('fadeOutElm', 'fadeInElm');
  }

  /**
   * Hide clock display
   */
  hide() {
    this.clockDisplay.classList.replace('fadeInElm', 'fadeOutElm');
  }

  /**
   * Add extension time
   * @param {number} player - Player number (1 or 2)
   */
  addExtension(player) {
    this.countDownTime += EXTENSION_TIME;
    this._showExtensionIndicator(player);
  }

  // Private methods
  _tick(shottime) {
    const now = new Date().getTime();
    const distance = this.countDownTime - now;
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
    this.progressBar.style.background = 'lime';
    this.clockDisplay.style.background = 'green';

    if (distance > 21000) {
      this.clockDisplay.style.color = 'white';
    }
    if (distance > 5000 && distance < 21000) {
      this.clockDisplay.style.color = 'black';
    }

    if (shottime === CLOCK_60S) {
      this.progressBar.classList.add('start60');
    } else {
      this.progressBar.classList.add('startTimer');
    }

    if (distance > 60000) {
      seconds += 60;
    }
    this.clockDisplay.innerHTML = seconds + 's';

    if (distance < THRESHOLD_SHOW) {
      this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
      this.progressBar.style.background = 'lime';
      this.progressBar.classList.add('startTimer');
    }
    if (distance < THRESHOLD_FADE) {
      this.progressBar.style.background = '#5aa500';
      this.progressBar.style.opacity = '0.7';
    }
    if (distance < THRESHOLD_ORANGE) {
      this.progressBar.style.background = '#639b00';
      this.clockDisplay.style.background = 'orange';
    }
    if (distance < THRESHOLD_YELLOW) {
      this.clockDisplay.style.background = 'yellow';
      this.progressBar.style.background = '#926d00';
    }
    if (distance < THRESHOLD_TOMATO) {
      this.clockDisplay.style.background = 'tomato';
      this.progressBar.style.background = '#d12f00';
      this.progressBar.style.opacity = '1';
    }
    if (distance < THRESHOLD_BEEP && distance > THRESHOLD_BEEP_END) {
      this.show();
    }
    if (distance < THRESHOLD_RED && distance > 999) {
      this.clockDisplay.classList.add('shotRed');
      this.clockDisplay.style.background = 'red';
      this.progressBar.style.background = 'red';
      this.clockDisplay.style.color = 'white';
    }
    if (distance < 1000) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.clockDisplay.style.background = 'red';
      this.progressBar.style.background = 'red';
      this.clockDisplay.style.color = 'white';
    }

    // Handle duplicate seconds
    if (seconds === this.lastSecondsValue) {
      const adjustedSeconds = seconds - 1;
      this.clockDisplay.innerHTML = adjustedSeconds + 's';
      console.log('dup Detected- tev:' + adjustedSeconds);
      this.bcr.postMessage(adjustedSeconds);
      this.lastSecondsValue = adjustedSeconds;
    } else {
      this.clockDisplay.innerHTML = seconds + 's';
      console.log('tev:' + seconds);
      this.bcr.postMessage(seconds);
      this.lastSecondsValue = seconds;
    }
  }

  _showExtensionIndicator(player) {
    const extIcon = document.getElementById(`p${player}ExtIcon`);
    extIcon.style.background = 'darkred';
    extIcon.classList.add('extBlink');

    this.clockDisplay.classList.remove('shotRed');
    this.clockDisplay.style.background = '';
    this.progressBar.classList.remove('startTimer', 'start60');
    this.progressBar.style.background = '';
    this.clockDisplay.classList.replace('fadeInElm', 'fadeOutElm');
    this.progressBar.classList.replace('fadeInElm', 'fadeOutElm');

    setTimeout(() => {
      extIcon.classList.remove('extBlink');
      extIcon.style.background = 'darkred';
    }, 500);
  }
}

// ===== UI MODULE =====

/**
 * UI module for browser_compact - simplified version
 */
class UI {
  constructor() {
    this.slideIndex = 0;
  }

  /**
   * Update player score with optional blink animation
   * @param {number} player - Player number (1 or 2)
   * @param {number} newScore - New score value
   * @param {number} currentScore - Current score value
   */
  updateScore(player, newScore, currentScore) {
    const scoreElement = document.getElementById(DOM_IDS[`p${player}Score`]);
    scoreElement.innerHTML = newScore;

    if (newScore > currentScore) {
      scoreElement.classList.add('winBlink');
      setTimeout(() => this.clearWinBlink(), 500);
    }
  }

  /**
   * Clear win blink animation from both scores
   */
  clearWinBlink() {
    document.getElementById(DOM_IDS.p1Score).classList.remove('winBlink');
    document.getElementById(DOM_IDS.p2Score).classList.remove('winBlink');
  }

  /**
   * Update opacity of scoreboard elements
   * @param {number} opacity - Opacity value (0-1)
   */
  updateOpacity(opacity) {
    document.getElementById(DOM_IDS.scoreBoard).style.opacity = opacity;
    document.getElementById(DOM_IDS.raceInfo).style.opacity = opacity;
    document.getElementById(DOM_IDS.wagerInfo).style.opacity = opacity;
  }

  /**
   * Update race info display
   * @param {string} raceText - Race text to display
   */
  updateRaceInfo(raceText) {
    const raceElement = document.getElementById(DOM_IDS.raceInfo);
    if (raceText === '') {
      raceElement.classList.add('noShow');
      raceElement.classList.remove('fadeInElm');
    } else {
      raceElement.classList.remove('noShow');
      raceElement.classList.add('fadeInElm');
      raceElement.innerHTML = raceText;
    }
  }

  /**
   * Update wager info display
   * @param {string} wagerText - Wager text to display
   */
  updateWagerInfo(wagerText) {
    const wagerElement = document.getElementById(DOM_IDS.wagerInfo);
    if (wagerText === '') {
      wagerElement.classList.add('noShow');
      wagerElement.classList.remove('fadeInElm');
    } else {
      wagerElement.classList.remove('noShow');
      wagerElement.classList.add('fadeInElm');
      wagerElement.innerHTML = wagerText;
    }
  }

  /**
   * Update player color
   * @param {number} player - Player number (1 or 2)
   * @param {string} color - Color value
   */
  updatePlayerColor(player, color) {
    const nameElement = document.getElementById(DOM_IDS[`p${player}Name`]);
    const direction = player === 1 ? 'left' : 'right';
    nameElement.style.background = `linear-gradient(to ${direction}, white, ${color}`;
  }

  /**
   * Update player name (browser_compact sets directly on element)
   * @param {number} player - Player number (1 or 2)
   * @param {string} name - Player name
   */
  updatePlayerName(player, name) {
    const nameElement = document.getElementById(DOM_IDS[`p${player}Name`]);
    if (name && name !== '') {
      nameElement.innerHTML = name;
    } else {
      nameElement.innerHTML = `Player ${player}`;
    }
  }

  /**
   * Show/hide extension icons based on clock usage
   * @param {boolean} useClock - Whether clock is enabled
   */
  toggleExtensionIcons(useClock) {
    const p1Ext = document.getElementById(DOM_IDS.p1ExtIcon);
    const p2Ext = document.getElementById(DOM_IDS.p2ExtIcon);

    if (useClock) {
      p1Ext.classList.replace('fadeOutElm', 'fadeInElm');
      p2Ext.classList.replace('fadeOutElm', 'fadeInElm');
    } else {
      p1Ext.classList.replace('fadeInElm', 'fadeOutElm');
      p2Ext.classList.replace('fadeInElm', 'fadeOutElm');
    }
  }

  /**
   * Reset extension indicator to green
   * @param {number} player - Player number (1 or 2)
   */
  resetExtension(player) {
    const extIcon = document.getElementById(`p${player}ExtIcon`);
    extIcon.style.background = 'green';
  }

  /**
   * Show right sponsor logo
   */
  showRightSponsorLogo() {
    document.getElementById(DOM_IDS.salottoLogo).classList.replace('fadeOutElm', 'fadeInElm');
  }

  /**
   * Hide right sponsor logo
   */
  hideRightSponsorLogo() {
    document.getElementById(DOM_IDS.salottoLogo).classList.replace('fadeInElm', 'fadeOutElm');
  }

  /**
   * Show left sponsor logo
   */
  showLeftSponsorLogo() {
    const logo = document.getElementById(DOM_IDS.g4Logo);
    if (logo.classList.contains('logoSlide')) {
      logo.classList.replace('logoSlide', 'fadeOutElm');
    }
    if (logo.classList.contains('fade')) {
      logo.classList.remove('fade');
    }
    logo.style.display = 'block';
    logo.classList.replace('fadeOutElm', 'fadeInElm');
  }

  /**
   * Hide left sponsor logo
   */
  hideLeftSponsorLogo() {
    const logo = document.getElementById(DOM_IDS.g4Logo);
    logo.classList.replace('fadeInElm', 'fadeOutElm');
    logo.style.display = 'none';
  }

  /**
   * Load logo from localStorage (browser_compact uses customImage)
   */
  loadLogo() {
		(async () => {
			const key = STORAGE_KEYS.customImage;
			let url = '';
			try {
				if (window.PCPLImageDB && window.PCPLImageDB.getObjectUrl) {
					if (window.PCPLImageDB.revokeObjectUrl) {
						window.PCPLImageDB.revokeObjectUrl(key);
					}
					url = await window.PCPLImageDB.getObjectUrl(key);
				}
			} catch (err) {
				url = '';
			}
			if (!url) {
				url = localStorage.getItem(key) || '';
			}
			if (url && url !== '') {
				document.getElementById(DOM_IDS.g4Logo).src = url;
			}
		})();
  }

  /**
   * Start logo slideshow
   */
  startSlideshow() {
    this.hideLeftSponsorLogo();

    const slideshowDiv = document.getElementById(DOM_IDS.logoSlideshow);
    const g4Logo = document.getElementById(DOM_IDS.g4Logo);

    slideshowDiv.classList.replace('fadeOutElm', 'fadeInElm');
    g4Logo.classList.replace('fadeOutElm', 'logoSlide');
    setTimeout(() => g4Logo.classList.add('fade'), 500);

		(async () => {
			for (const i of [1, 2, 3]) {
				const key = `customLogo${i}`;
				const logoElement = document.getElementById(DOM_IDS[`customLogo${i}`]);
				let url = '';
				try {
					if (window.PCPLImageDB && window.PCPLImageDB.getObjectUrl) {
						if (window.PCPLImageDB.revokeObjectUrl) {
							window.PCPLImageDB.revokeObjectUrl(key);
						}
						url = await window.PCPLImageDB.getObjectUrl(key);
					}
				} catch (err) {
					url = '';
				}
				if (!url) {
					url = localStorage.getItem(key) || '';
				}
				logoElement.src = url || './common/images/placeholder.png';
			}
		})();

    this._showSlides();
  }

  /**
   * Stop logo slideshow
   */
  stopSlideshow() {
    const slideshowDiv = document.getElementById(DOM_IDS.logoSlideshow);
    slideshowDiv.classList.replace('fadeInElm', 'fadeOutElm');
  }

  // Private method
  _showSlides() {
    const slides = document.getElementsByClassName('logoSlide');

    for (let i = 0; i < slides.length; i++) {
      slides[i].style.display = 'none';
    }

    this.slideIndex++;
    if (this.slideIndex > slides.length) {
      this.slideIndex = 1;
    }

    slides[this.slideIndex - 1].style.display = 'block';
    setTimeout(() => this._showSlides(), SLIDESHOW_INTERVAL);
  }
}

// ===== MESSAGING MODULE =====

/**
 * Messaging module for browser_compact - handles BroadcastChannel communication
 */
class Messaging {
  constructor(shotClock, ui) {
    this.shotClock = shotClock;
    this.ui = ui;
    this.mainChannel = new BroadcastChannel(CHANNEL_MAIN);
    this.recvChannel = new BroadcastChannel(CHANNEL_RECV);
    this._setupListeners();
  }

  /**
   * Setup message listeners
   */
  _setupListeners() {
    this.mainChannel.onmessage = (event) => this._handleMessage(event);
  }

  /**
   * Handle incoming messages
   * @param {MessageEvent} event - BroadcastChannel event
   */
  _handleMessage(event) {
    const data = event.data;

    // Score updates
    if (data.score != null) {
      console.log(`event.data.player: ${data.player}  event.data.score: ${data.score}`);
      const currentScore = parseInt(document.getElementById(`player${data.player}Score`).innerHTML);
      this.ui.updateScore(data.player, data.score, currentScore);
    }

    // Opacity
    if (data.opacity != null) {
      console.log(`event.data(opacity): ${data.opacity}`);
      this.ui.updateOpacity(data.opacity);
    }

    // Race info
    if (data.race != null) {
      console.log(`event.data.race: ${data.race}`);
      this.ui.updateRaceInfo(data.race);
    }

    // Wager info
    if (data.wager != null) {
      console.log(`event.data.wager: ${data.wager}`);
      this.ui.updateWagerInfo(data.wager);
    }

    // Shot clock timer
    if (data.time != null) {
      console.log(`event.data.time: ${data.time}`);
      this.shotClock.start(data.time);
    }

    // Player color
    if (data.color != null) {
      console.log(`event.data.player: ${data.player} event.data.color: ${data.color}`);
      this.ui.updatePlayerColor(data.player, data.color);
    }

    // Player name
    if (data.name != null) {
      console.log(`event.data.player: ${data.player} event.data.name: ${data.name}`);
      this.ui.updatePlayerName(data.player, data.name);
    }

    // Clock display commands
    if (data.clockDisplay != null) {
      console.log(`event.data.clockDisplay: ${data.clockDisplay}`);
      this._handleClockCommand(data.clockDisplay);
    }
  }

  /**
   * Handle clock-related commands (browser_compact specific)
   * @param {string} command - Command name
   */
  _handleClockCommand(command) {
    switch (command) {
      case 'show':
        this.shotClock.show();
        break;
      case 'hide':
        this.shotClock.hide();
        break;
      case 'stopClock':
        this.shotClock.stop();
        break;
      case 'noClock':
        this.ui.toggleExtensionIcons(false);
        break;
      case 'useClock':
        this.ui.toggleExtensionIcons(true);
        break;
      case 'p1extension':
        this.shotClock.addExtension(1);
        break;
      case 'p2extension':
        this.shotClock.addExtension(2);
        break;
      case 'p1ExtReset':
        this.ui.resetExtension(1);
        break;
      case 'p2ExtReset':
        this.ui.resetExtension(2);
        break;
      case 'hideRightSponsorLogo':
        this.ui.hideRightSponsorLogo();
        break;
      case 'showRightSponsorLogo':
        this.ui.showRightSponsorLogo();
        break;
      case 'hideLeftSponsorLogo':
        this.ui.hideLeftSponsorLogo();
        break;
      case 'showLeftSponsorLogo':
        this.ui.showLeftSponsorLogo();
        break;
      case 'postLogo':
        this.ui.loadLogo();
        break;
      case 'logoSlideShow-show':
        this.ui.startSlideshow();
        break;
      case 'logoSlideShow-hide':
        this.ui.stopSlideshow();
        break;
      // Note: browser_compact doesn't support style100/125/150
    }
  }

  /**
   * Send message to control panel
   * @param {*} data - Data to send
   */
  send(data) {
    this.recvChannel.postMessage(data);
  }
}

// ===== CORE / INITIALIZATION =====

/**
 * Main application class for browser_compact
 */
class BrowserCompact {
  constructor() {
    this.shotClock = new ShotClock();
    this.ui = new UI();
    this.messaging = new Messaging(this.shotClock, this.ui);
    this._initialize();
  }

  /**
   * Initialize application from localStorage
   */
  _initialize() {
    const state = Storage.loadInitialState();

		// Load slideshow logos (prefer IndexedDB, fall back to localStorage)
		(async () => {
			for (const i of [1, 2, 3]) {
				const key = `customLogo${i}`;
				const logoElement = document.getElementById(DOM_IDS[`customLogo${i}`]);
				let url = '';
				try {
					if (window.PCPLImageDB && window.PCPLImageDB.getObjectUrl) {
						url = await window.PCPLImageDB.getObjectUrl(key);
					}
				} catch (err) {
					url = '';
				}
				if (!url) {
					url = state[`customLogo${i}`] || '';
				}
				logoElement.src = url || './common/images/placeholder.png';
			}
		})();

		// Load custom logo (browser_compact uses customImage)
		this.ui.loadLogo();

    // Load scores
    document.getElementById(DOM_IDS.p1Score).innerHTML = state.p1Score;
    document.getElementById(DOM_IDS.p2Score).innerHTML = state.p2Score;

    // Load wager/race info
    if (state.wagerInfo && state.wagerInfo !== '') {
      document.getElementById(DOM_IDS.wagerInfo).classList.remove('noShow');
      document.getElementById(DOM_IDS.wagerInfo).innerHTML = state.wagerInfo;
    }

    if (state.raceInfo && state.raceInfo !== '') {
      document.getElementById(DOM_IDS.raceInfo).classList.remove('noShow');
      document.getElementById(DOM_IDS.raceInfo).innerHTML = state.raceInfo;
    }

    // Load player names
    document.getElementById(DOM_IDS.p1Name).innerHTML = state.p1Name;
    document.getElementById(DOM_IDS.p2Name).innerHTML = state.p2Name;

    // Show/hide features
    if (state.useCustomLogo === 'yes') {
      document.getElementById(DOM_IDS.g4Logo).classList.replace('fadeOutElm', 'fadeInElm');
    }

    if (state.useSalotto === 'yes') {
      document.getElementById(DOM_IDS.salottoLogo).classList.replace('fadeOutElm', 'fadeInElm');
    }

    // Clock settings
    this.ui.toggleExtensionIcons(state.useClock === 'yes');

    // Player colors
    if (state.p1Color && state.p1Color !== '') {
      this.ui.updatePlayerColor(1, state.p1Color);
      console.log(`p1color: ${state.p1Color}`);
    }
    if (state.p2Color && state.p2Color !== '') {
      this.ui.updatePlayerColor(2, state.p2Color);
      console.log(`p2color: ${state.p2Color}`);
    }

    // Slideshow
    if (state.slideShow === 'yes') {
      const slideshowDiv = document.getElementById(DOM_IDS.logoSlideshow);
      const g4Logo = document.getElementById(DOM_IDS.g4Logo);
      slideshowDiv.classList.replace('fadeOutElm', 'fadeInElm');
      g4Logo.classList.replace('fadeOutElm', 'logoSlide');
      g4Logo.classList.add('fade');
    }

    // Start slideshow
    this.ui._showSlides();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new BrowserCompact());
} else {
  new BrowserCompact();
}

})();
