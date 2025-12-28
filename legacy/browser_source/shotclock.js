'use strict';

//  G4ScoreBoard addon for OBS Copyright 2022-2025 Norman Gholson IV
//  https://g4billiards.com http://www.g4creations.com

import {
  CLOCK_30S,
  CLOCK_60S,
  EXTENSION_TIME,
  THRESHOLD_SHOW,
  THRESHOLD_FADE,
  THRESHOLD_ORANGE,
  THRESHOLD_YELLOW,
  THRESHOLD_TOMATO,
  THRESHOLD_RED,
  THRESHOLD_BEEP,
  THRESHOLD_BEEP_END,
  DOM_IDS
} from './constants.js';

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
export class ShotClock {
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
    this.scoreBoard = document.getElementById(DOM_IDS.scoreBoard);
  }

  _setClockVisibleLayout(isVisible) {
    if (!this.scoreBoard) return;
    if (isVisible) {
      this.scoreBoard.classList.add('clock-visible');
    } else {
      this.scoreBoard.classList.remove('clock-visible');
    }
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
