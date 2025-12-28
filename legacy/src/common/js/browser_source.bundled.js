(function() {
'use strict';

/**
 * g4ScoreBoard Browser Source - Bundled Version
 * Copyright 2022-2025 Norman Gholson IV
 * https://g4billiards.com http://www.g4creations.com
 *
 * This file bundles all ES6 modules into a single file for OBS compatibility.
 * The modular source files are kept in common/js/browser_source/ for reference.
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

// localStorage Keys
const STORAGE_KEYS = {
  leftSponsorLogo: 'leftSponsorLogo',
  customLogo1: 'customLogo1',
  customLogo2: 'customLogo2',
  customLogo3: 'customLogo3',
  rightSponsorLogo: 'rightSponsorLogo',
  p1Score: 'p1ScoreCtrlPanel',
  p2Score: 'p2ScoreCtrlPanel',
  p1Name: 'p1NameCtrlPanel',
  p2Name: 'p2NameCtrlPanel',
  p1Color: 'p1colorSet',
  p2Color: 'p2colorSet',
  raceInfo: 'raceInfo',
  wagerInfo: 'wagerInfo',
  useClock: 'useClock',
  showLeftSponsorLogo: 'showLeftSponsorLogo',
  showRightSponsorLogo: 'showRightSponsorLogo',
  slideShow: 'slideShow',
  browserStyle: 'b_style',
  player1Photo: 'player1_photo',
  player2Photo: 'player2_photo'
};

// DOM Element IDs
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
  p1Photo: 'player1-photo',
  p2Photo: 'player2-photo',
  leftSponsorLogoImg: 'leftSponsorLogoImg',
  rightSponsorLogoImg: 'rightSponsorLogoImg',
  customLogo1: 'customLogo1',
  customLogo2: 'customLogo2',
  customLogo3: 'customLogo3',
  logoSlideshow: 'logoSlideshowDiv'
};

// ===== STORAGE MODULE =====

/**
 * Storage module - handles localStorage operations
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
      leftSponsorLogo: this.get(STORAGE_KEYS.leftSponsorLogo, ''),
      customLogo1: this.get(STORAGE_KEYS.customLogo1, ''),
      customLogo2: this.get(STORAGE_KEYS.customLogo2, ''),
      customLogo3: this.get(STORAGE_KEYS.customLogo3, ''),
      rightSponsorLogo: this.get(STORAGE_KEYS.rightSponsorLogo, ''),
      p1Score: this.get(STORAGE_KEYS.p1Score, '0'),
      p2Score: this.get(STORAGE_KEYS.p2Score, '0'),
      p1Name: this.get(STORAGE_KEYS.p1Name, 'Player 1'),
      p2Name: this.get(STORAGE_KEYS.p2Name, 'Player 2'),
      p1Color: this.get(STORAGE_KEYS.p1Color, ''),
      p2Color: this.get(STORAGE_KEYS.p2Color, ''),
      raceInfo: this.get(STORAGE_KEYS.raceInfo, ''),
      wagerInfo: this.get(STORAGE_KEYS.wagerInfo, ''),
      useClock: this.get(STORAGE_KEYS.useClock, 'no'),
      showLeftSponsorLogo: this.get(STORAGE_KEYS.showLeftSponsorLogo, 'no'),
      showRightSponsorLogo: this.get(STORAGE_KEYS.showRightSponsorLogo, 'no'),
      slideShow: this.get(STORAGE_KEYS.slideShow, 'no'),
      browserStyle: this.get(STORAGE_KEYS.browserStyle, '2'),
      player1Photo: this.get(STORAGE_KEYS.player1Photo, ''),
      player2Photo: this.get(STORAGE_KEYS.player2Photo, '')
    };
  }
};

// ===== SHOT CLOCK MODULE =====

const SHOTCLOCK_STORAGE_KEYS = {
  endTime: 'shotClock_endTime',
  originalDuration: 'shotClock_originalDuration',
  pausedRemaining: 'shotClock_pausedRemaining',
  isRunning: 'shotClock_isRunning',
  isPaused: 'shotClock_isPaused',
  isVisible: 'shotClock_isVisible'
};

/**
 * Shot Clock module - handles all timer logic
 */
class ShotClock {
  constructor() {
    this.intervalId = null;
    this.countDownTime = 0;
    this.clockPaused = false;
    this.pausedTimeRemaining = 0;
    this.originalDuration = CLOCK_30S;
    this.lastSecondsValue = 0; // Track last displayed seconds to avoid duplicates

    // BroadcastChannel for sending time updates to shot_clock_display
    this.bcr = new BroadcastChannel('g4-recv');

    // Cache DOM elements
    this.clockDisplay = document.getElementById(DOM_IDS.shotClock);
    this.progressBar = document.getElementById(DOM_IDS.shotClockVis);

	// Layout elements (used to split name bars when clock is visible)
	this.scoreBoardRoot = document.getElementById('scoreBoardDiv');
	this.scoreTable = document.getElementById('scoreBoard');
	this._colApplyAttempts = 0;
	this._colApplyRaf = null;
	this._colApplyTimer = null;
  }

	_setClockVisibleLayout(isVisible) {
		if (!this.scoreBoardRoot) return;
		if (isVisible) {
			this.scoreBoardRoot.classList.add('clock-visible');
		} else {
			this.scoreBoardRoot.classList.remove('clock-visible');
		}
		if (!isVisible) {
			this._clearColumnWidths();
			return;
		}
		this._scheduleApplyColumnWidths();
	}

	_clearColumnWidths() {
		if (!this.scoreTable) return;
		const colgroup = this.scoreTable.querySelector('colgroup');
		if (!colgroup) return;
		const cols = colgroup.querySelectorAll('col');
		if (!cols || cols.length < 3) return;
		cols[0].style.width = '';
		cols[1].style.width = '';
		cols[2].style.width = '';
	}

	_scheduleApplyColumnWidths() {
		// Cancel pending attempts
		if (this._colApplyRaf != null) {
			cancelAnimationFrame(this._colApplyRaf);
			this._colApplyRaf = null;
		}
		if (this._colApplyTimer != null) {
			clearTimeout(this._colApplyTimer);
			this._colApplyTimer = null;
		}

		this._colApplyAttempts = 0;
		const attempt = () => {
			this._colApplyAttempts += 1;
			const ok = this._applyColumnWidths();
			if (!ok && this._colApplyAttempts < 6) {
				// Retry after layout settles
				this._colApplyRaf = requestAnimationFrame(attempt);
			}
		};

		// First attempt next frame
		this._colApplyRaf = requestAnimationFrame(attempt);
		// Safety attempt after a short delay (OBS refresh can lay out late)
		this._colApplyTimer = setTimeout(() => {
			this._applyColumnWidths();
		}, 250);
	}

	_applyColumnWidths() {
		if (!this.scoreTable) return;
		const colgroup = this.scoreTable.querySelector('colgroup');
		if (!colgroup) return;
		const cols = colgroup.querySelectorAll('col');
		if (!cols || cols.length < 3) return;

		// Read desired mid width from CSS variable. This is authored in px.
		let midPx = 72;
		if (this.scoreBoardRoot) {
			const midVar = getComputedStyle(this.scoreBoardRoot).getPropertyValue('--bs-mid-w').trim();
			const parsed = parseFloat(midVar);
			if (!Number.isNaN(parsed) && parsed > 0) midPx = parsed;
		}

		const tableW = this.scoreTable.offsetWidth || this.scoreTable.getBoundingClientRect().width;
		// If layout isn't ready yet, don't stamp bad widths.
		if (!tableW || tableW < 300) return false;
		// Prevent pathological values if mid is larger than the table.
		if (midPx > tableW - 100) midPx = Math.max(40, tableW - 100);
		const side = Math.max(0, Math.floor((tableW - midPx) / 2));
		const mid = Math.max(0, Math.floor(midPx));

		cols[0].style.width = `${side}px`;
		cols[1].style.width = `${mid}px`;
		cols[2].style.width = `${side}px`;
		
		console.log('Applied column widths:', { side, mid, tableW, midPx });
		return true;
	}

  restoreFromStorage() {
    const isVisible = localStorage.getItem(SHOTCLOCK_STORAGE_KEYS.isVisible) === 'yes';
    const isRunning = localStorage.getItem(SHOTCLOCK_STORAGE_KEYS.isRunning) === 'yes';
    const isPaused = localStorage.getItem(SHOTCLOCK_STORAGE_KEYS.isPaused) === 'yes';
    const endTime = parseInt(localStorage.getItem(SHOTCLOCK_STORAGE_KEYS.endTime) || '0', 10);
    const originalDuration = parseInt(localStorage.getItem(SHOTCLOCK_STORAGE_KEYS.originalDuration) || '0', 10);
    const pausedRemaining = parseInt(localStorage.getItem(SHOTCLOCK_STORAGE_KEYS.pausedRemaining) || '0', 10);

    if (!isVisible && !isRunning && !isPaused) return;

    if (isRunning && endTime > 0) {
      const remaining = endTime - new Date().getTime();
      if (remaining > 0) {
        this.show();
        this.start(remaining);
        return;
      }
    }

    if (isPaused && pausedRemaining > 0) {
      this.originalDuration = originalDuration > 0 ? originalDuration : pausedRemaining;
      this.pausedTimeRemaining = pausedRemaining;
      this.clockPaused = true;
      const secondsRemaining = Math.floor((pausedRemaining + 999) / 1000);
      this._updateDisplay(secondsRemaining);

      // Restore progress bar position (90% -> 0%) without restarting timer
      const fractionRemaining = this.originalDuration > 0
        ? Math.max(0, Math.min(1, pausedRemaining / this.originalDuration))
        : 0;
      this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
      this.progressBar.style.transition = 'none';
      this.progressBar.style.width = `${90 * fractionRemaining}%`;

      // Ensure clock is visible but do not call show()/stop() since they reset display
      this.clockDisplay.classList.replace('fadeOutElm', 'fadeInElm');
		this._setClockVisibleLayout(true);
      this._persistState();
      return;
    }

    if (isVisible) {
      this.show();
    }
  }

  _persistState() {
    localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.endTime, String(this.countDownTime || 0));
    localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.originalDuration, String(this.originalDuration || 0));
    localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.pausedRemaining, String(this.pausedTimeRemaining || 0));
    localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.isRunning, this.intervalId ? 'yes' : 'no');
    localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.isPaused, this.clockPaused ? 'yes' : 'no');
    const visible = this.clockDisplay.classList.contains('fadeInElm');
    localStorage.setItem(SHOTCLOCK_STORAGE_KEYS.isVisible, visible ? 'yes' : 'no');
  }

  /**
   * Start shot clock timer
   * @param {number} duration - Duration in milliseconds
   */
  start(duration) {
    this.stop();
    this.clockPaused = false;
    this.originalDuration = duration;
    this.countDownTime = new Date().getTime() + duration;

    // Sleep 1ms to fix clock 0 glitch
    const start = new Date().getTime();
    while ((new Date().getTime() - start) < 1) {}

    this._resetProgressBar();
    this._startProgressBar(duration);
    this._startInterval();

    this.clockDisplay.classList.replace('fadeOutElm', 'fadeInElm');
    this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
    this._persistState();
  }

  /**
   * Stop/pause the clock
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const now = new Date().getTime();
    this.pausedTimeRemaining = this.countDownTime - now;
    if (this.pausedTimeRemaining < 0) this.pausedTimeRemaining = 0;
    this.clockPaused = true;

    this._freezeProgressBar();

    this._persistState();
  }

  /**
   * Resume paused clock
   */
  resume() {
    if (!this.clockPaused || this.pausedTimeRemaining <= 0) return;

    this.clockPaused = false;
    this.countDownTime = new Date().getTime() + this.pausedTimeRemaining;

    const remainingSecs = this.pausedTimeRemaining / 1000;
    this.progressBar.style.transition = `width ${remainingSecs}s linear`;
    this.progressBar.style.width = '0px';

    this._startInterval();

    this.clockDisplay.classList.replace('fadeOutElm', 'fadeInElm');
    this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
    this._persistState();
  }

  /**
   * Reset clock to initial state
   * @param {number} resetTime - Optional duration to reset to
   */
  reset(resetTime) {
    this.stop();
    this.clockPaused = false;
    this.pausedTimeRemaining = 0;

    if (resetTime) {
      this.originalDuration = resetTime;
    }

    const seconds = Math.floor(this.originalDuration / 1000) - 1;
    this._updateDisplay(seconds, 'green', 'white');
    this._resetProgressBar();
    this.clockDisplay.classList.remove('shotRed');

    this._persistState();
  }

  /**
   * Add extension time
   * @param {number} player - Player number (1 or 2)
   */
  addExtension(player) {
    this.countDownTime += EXTENSION_TIME;
    this._showExtensionIndicator(player);
  }

  /**
   * Show clock display
   * @param {number} selectedTime - Optional duration to display
   */
  show(selectedTime) {
    this.clockDisplay.classList.replace('fadeOutElm', 'fadeInElm');
	this._setClockVisibleLayout(true);

    if (!this.intervalId) {
      if (selectedTime) {
        this.originalDuration = selectedTime;
      }
      const seconds = Math.floor(this.originalDuration / 1000) - 1;
      this._updateDisplay(seconds, 'green', 'white');

      this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
      this.progressBar.style.transition = 'none';
      this.progressBar.style.width = '90%';
      this.progressBar.style.background = 'lime';
    }

    this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
    this._persistState();
  }

  /**
   * Hide clock display
   */
  hide() {
    this.clockDisplay.classList.replace('fadeInElm', 'fadeOutElm');
	this._setClockVisibleLayout(false);

	// Also hide progress bar when hiding clock
	this.progressBar.classList.replace('fadeInElm', 'fadeOutElm');
    this._persistState();
  }

  // Private methods
  _startInterval() {
    this.intervalId = setInterval(() => this._tick(), 1000);
  }

  _tick() {
    const now = new Date().getTime();
    const distance = this.countDownTime - now;
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (distance > 60000) seconds += 60;

    this._updateClockColors(distance);

    // Avoid duplicate seconds display
    if (seconds === this.lastSecondsValue) {
      const adjustedSeconds = seconds - 1;
      this._updateDisplay(adjustedSeconds);
      console.log('dup Detected - corrected tev:' + adjustedSeconds);
      this.bcr.postMessage(adjustedSeconds);
      this.lastSecondsValue = adjustedSeconds;
    } else {
      this._updateDisplay(seconds);
      console.log('tev:' + seconds);
      this.bcr.postMessage(seconds);
      this.lastSecondsValue = seconds;
    }

    if (distance < 1000) {
      this.stop();
      this._updateDisplay(0, 'red', 'white');
    }

    // Show clock when beeping would start
    if (distance < THRESHOLD_BEEP && distance > THRESHOLD_BEEP_END) {
      this.show();
    }

    this._persistState();
  }

  _updateClockColors(distance) {
    let bgColor = 'green';
    let textColor = 'white';
    let barColor = 'lime';
    let barOpacity = '0.7';

    this.clockDisplay.style.background = bgColor;
    this.clockDisplay.style.color = textColor;

    if (distance > 21000) {
      textColor = 'white';
      this.clockDisplay.style.color = textColor;
    }
    if (distance > 5000 && distance < 21000) {
      textColor = 'black';
      this.clockDisplay.style.color = textColor;
    }

    if (distance < THRESHOLD_SHOW) {
      this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
      this.progressBar.style.background = barColor;
    }
    if (distance < THRESHOLD_FADE) {
      barOpacity = '0.7';
      this.progressBar.style.opacity = barOpacity;
    }
    if (distance < THRESHOLD_ORANGE) {
      bgColor = 'orange';
      barColor = 'orange';
      this.clockDisplay.style.background = bgColor;
      this.progressBar.style.background = barColor;
    }
    if (distance < THRESHOLD_YELLOW) {
      bgColor = 'yellow';
      barColor = 'yellow';
      this.clockDisplay.style.background = bgColor;
      this.progressBar.style.background = barColor;
    }
    if (distance < THRESHOLD_TOMATO) {
      bgColor = 'tomato';
      barColor = 'tomato';
      barOpacity = '1';
      this.clockDisplay.style.background = bgColor;
      this.progressBar.style.background = barColor;
      this.progressBar.style.opacity = barOpacity;
    }
    if (distance < THRESHOLD_RED && distance > 999) {
      bgColor = 'red';
      barColor = 'red';
      textColor = 'white';
      this.clockDisplay.classList.add('shotRed');
      this.clockDisplay.style.background = bgColor;
      this.clockDisplay.style.color = textColor;
      this.progressBar.style.background = barColor;
    }
  }

  _updateDisplay(seconds, bgColor = null, textColor = null) {
    this.clockDisplay.innerHTML = seconds + 's';
    if (bgColor) this.clockDisplay.style.background = bgColor;
    if (textColor) this.clockDisplay.style.color = textColor;
  }

  _resetProgressBar() {
    this.progressBar.classList.remove('startTimer', 'start60');
    this.progressBar.style.transition = 'none';
    this.progressBar.style.width = '90%';
    this.progressBar.offsetHeight; // Force reflow
  }

  _startProgressBar(duration) {
    if (duration === CLOCK_60S) {
      this.progressBar.style.transition = 'width 60s linear';
      this.progressBar.classList.replace('fadeOutElm', 'fadeInElm');
    } else {
      this.progressBar.style.transition = 'width 30s linear';
    }
    this.progressBar.style.width = '0px';
  }

  _freezeProgressBar() {
    const computedWidth = window.getComputedStyle(this.progressBar).width;
    this.progressBar.style.transition = 'none';
    this.progressBar.style.width = computedWidth;
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
 * UI module - handles all DOM manipulation and visual updates
 */
class UI {
  constructor() {
    this.slideIndex = 0;
    this.slideshowInterval = null;
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
   * Update player name
   * @param {number} player - Player number (1 or 2)
   * @param {string} name - Player name
   */
  updatePlayerName(player, name) {
    const nameElement = document.getElementById(DOM_IDS[`p${player}Name`]);
    const nameSpan = nameElement.querySelector('.playerNameText');
    if (name && name !== '') {
      nameSpan.innerHTML = name;
    } else {
      nameSpan.innerHTML = `Player ${player}`;
    }
  }

  /**
   * Load and display player photos
   */
  loadPlayerPhotos() {
		(async () => {
			for (const player of [1, 2]) {
				const photoElement = document.getElementById(DOM_IDS[`p${player}Photo`]);
				const nameCell = document.getElementById(DOM_IDS[`p${player}Name`]);
				const key = `player${player}_photo`;
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
					photoElement.src = url;
					photoElement.classList.add('photoVisible');
					nameCell.classList.add('has-photo');
				} else {
					photoElement.classList.remove('photoVisible');
					nameCell.classList.remove('has-photo');
				}
			}
		})();
  }

  /**
   * Show/hide extension icons based on clock usage
   * @param {boolean} useClock - Whether clock is enabled
   */
  toggleExtensionIcons(useClock) {
    const p1Ext = document.getElementById(DOM_IDS.p1ExtIcon);
    const p2Ext = document.getElementById(DOM_IDS.p2ExtIcon);
    const p1Photo = document.getElementById(DOM_IDS.p1Photo);
    const p2Photo = document.getElementById(DOM_IDS.p2Photo);
		const p1Name = document.getElementById(DOM_IDS.p1Name);
		const p2Name = document.getElementById(DOM_IDS.p2Name);

    if (useClock) {
      p1Ext.classList.replace('fadeOutElm', 'fadeInElm');
      p2Ext.classList.replace('fadeOutElm', 'fadeInElm');
      p1Photo.classList.add('clockActive');
      p2Photo.classList.add('clockActive');
			p1Name.classList.add('clock-enabled');
			p2Name.classList.add('clock-enabled');
    } else {
      p1Ext.classList.replace('fadeInElm', 'fadeOutElm');
      p2Ext.classList.replace('fadeInElm', 'fadeOutElm');
      p1Photo.classList.remove('clockActive');
      p2Photo.classList.remove('clockActive');
			p1Name.classList.remove('clock-enabled');
			p2Name.classList.remove('clock-enabled');
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
    document.getElementById(DOM_IDS.rightSponsorLogoImg).classList.replace('fadeOutElm', 'fadeInElm');
		document.getElementById(DOM_IDS.p2Name).classList.add('has-right-sponsor-logo');
  }

  /**
   * Hide right sponsor logo
   */
  hideRightSponsorLogo() {
    document.getElementById(DOM_IDS.rightSponsorLogoImg).classList.replace('fadeInElm', 'fadeOutElm');
		document.getElementById(DOM_IDS.p2Name).classList.remove('has-right-sponsor-logo');
  }

  /**
   * Show left sponsor logo
   */
  showLeftSponsorLogo() {
    document.getElementById(DOM_IDS.leftSponsorLogoImg).classList.replace('fadeOutElm', 'fadeInElm');
		document.getElementById(DOM_IDS.p1Name).classList.add('has-left-sponsor-logo');
  }

  /**
   * Hide left sponsor logo
   */
  hideLeftSponsorLogo() {
    document.getElementById(DOM_IDS.leftSponsorLogoImg).classList.replace('fadeInElm', 'fadeOutElm');
		document.getElementById(DOM_IDS.p1Name).classList.remove('has-left-sponsor-logo');
  }

  /**
   * Load logos from localStorage
   */
  loadLogos() {
		(async () => {
			for (const key of [STORAGE_KEYS.leftSponsorLogo, STORAGE_KEYS.rightSponsorLogo]) {
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
					const targetId = key === STORAGE_KEYS.leftSponsorLogo ? DOM_IDS.leftSponsorLogoImg : DOM_IDS.rightSponsorLogoImg;
					document.getElementById(targetId).src = url;
				}
			}
		})();
  }

  /**
   * Start logo slideshow
   */
  startSlideshow() {
    const slideshowDiv = document.getElementById(DOM_IDS.logoSlideshow);
    slideshowDiv.classList.replace('fadeOutElm', 'fadeInElm');

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
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = null;
    }
  }

  /**
   * Change stylesheet for scaling
   * @param {number} styleNum - Style number (1-4)
   */
  changeStyle(styleNum) {
    const html = document.documentElement;
    html.classList.remove('scale-100', 'scale-125', 'scale-150', 'scale-200');

    if (styleNum == 2) {
      html.classList.add('scale-125');
    }
    if (styleNum == 3) {
      html.classList.add('scale-150');
    }
    if (styleNum == 4) {
      html.classList.add('scale-200');
    }
    // styleNum == 1 is default (100%), no class needed
  }

  // Private methods
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
 * Messaging module - handles BroadcastChannel communication
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
      this._handleClockCommand(data.clockDisplay, data);
    }
  }

  /**
   * Handle clock-related commands
   * @param {string} command - Command name
   * @param {Object} data - Additional data
   */
  _handleClockCommand(command, data) {
    switch (command) {
      case 'show':
        this.shotClock.show(data.selectedTime);
        break;
      case 'hide':
        this.shotClock.hide();
        break;
      case 'stopClock':
        this.shotClock.stop();
        break;
      case 'resumeClock':
        this.shotClock.resume();
        break;
      case 'resetClock':
        this.shotClock.reset(data.resetTime);
        break;
      case 'noClock':
        this.ui.toggleExtensionIcons(false);
		// Ensure clock and progress bar are hidden when clock feature is disabled
		this.shotClock.hide();
        break;
      case 'useClock':
		this.ui.toggleExtensionIcons(true);
		// When clock feature is enabled, show the clock display by default
		this.shotClock.show(data.selectedTime);
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
			this.ui.loadLogos();
			break;
      case 'postPlayerPhoto':
        this.ui.loadPlayerPhotos();
        break;
      case 'logoSlideShow-show':
        this.ui.startSlideshow();
        break;
      case 'logoSlideShow-hide':
        this.ui.stopSlideshow();
        break;
      case 'style100':
        this.ui.changeStyle(1);
        break;
      case 'style125':
        this.ui.changeStyle(2);
        break;
      case 'style150':
        this.ui.changeStyle(3);
        break;
      case 'style200':
        this.ui.changeStyle(4);
        break;
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
 * Main application class
 */
class BrowserSource {
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

    // Load scores
    document.getElementById(DOM_IDS.p1Score).innerHTML = state.p1Score;
    document.getElementById(DOM_IDS.p2Score).innerHTML = state.p2Score;

    // Load player names
    this.ui.updatePlayerName(1, state.p1Name);
    this.ui.updatePlayerName(2, state.p2Name);

    // Load player colors
    if (state.p1Color && state.p1Color !== '') {
      this.ui.updatePlayerColor(1, state.p1Color);
      console.log(`p1color: ${state.p1Color}`);
    }
    if (state.p2Color && state.p2Color !== '') {
      this.ui.updatePlayerColor(2, state.p2Color);
      console.log(`p2color: ${state.p2Color}`);
    }

    // Load game info
    if (state.raceInfo && state.raceInfo !== '') {
      document.getElementById(DOM_IDS.raceInfo).classList.remove('noShow');
      document.getElementById(DOM_IDS.raceInfo).innerHTML = state.raceInfo;
    } else {
      document.getElementById(DOM_IDS.raceInfo).classList.add('noShow');
      document.getElementById(DOM_IDS.raceInfo).classList.remove('fadeInElm');
    }

    if (state.wagerInfo && state.wagerInfo !== '') {
      document.getElementById(DOM_IDS.wagerInfo).classList.remove('noShow');
      document.getElementById(DOM_IDS.wagerInfo).innerHTML = state.wagerInfo;
    } else {
      document.getElementById(DOM_IDS.wagerInfo).classList.add('noShow');
      document.getElementById(DOM_IDS.wagerInfo).classList.remove('fadeInElm');
    }

    // Load logos
    this.ui.loadLogos();
    this.ui.loadPlayerPhotos();

    // Load custom logos for slideshow (prefer IndexedDB, fall back to localStorage)
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
					url = state[key] || '';
				}
				logoElement.src = url || './common/images/placeholder.png';
			}
		})();

    // Show/hide sponsor logos
    if (state.showLeftSponsorLogo === 'yes') {
      this.ui.showLeftSponsorLogo();
    }
    if (state.showRightSponsorLogo === 'yes') {
      this.ui.showRightSponsorLogo();
    }

    // Clock settings
    this.ui.toggleExtensionIcons(state.useClock === 'yes');

    // Restore shot clock state (so OBS browser source refresh doesn't hide it)
    this.shotClock.restoreFromStorage();

    // Slideshow (kept for future advertiser module)
    if (state.slideShow === 'yes') {
      this.ui.startSlideshow();
    }

    // Style/scaling
    if (state.browserStyle) {
      this.ui.changeStyle(parseInt(state.browserStyle));
    } else {
      // Default to 100%
      this.ui.changeStyle(1);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new BrowserSource());
} else {
  new BrowserSource();
}

})();
