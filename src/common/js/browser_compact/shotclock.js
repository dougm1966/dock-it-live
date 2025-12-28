'use strict';

//  G4ScoreBoard addon for OBS Copyright 2022-2025 Norman Gholson IV
//  https://g4billiards.com http://www.g4creations.com

import {
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

/**
 * Shot Clock module for browser_compact - simplified version
 */
export class ShotClock {
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
