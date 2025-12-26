'use strict';

/**
 * PCPL ScoreBoard Browser Source - Main Entry Point
 * Created by Douglas Montgomery of AI1offs
 * Inspired by g4ScoreBoard concept
 * GitHub: https://github.com/dougm1966/g4ScoreBoard
 * Park County Pool League
 *
 * Creator of Unglove billiard glove - https://unglove.me
 * AI app development and business strategy: doug@ai1offs.com | +1 (307) 254-5056
 */

import { ShotClock } from './shotclock.js';
import { UI } from './ui.js';
import { Messaging } from './messaging.js';
import { Storage } from './storage.js';
import { DOM_IDS } from './constants.js';

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

    // Load custom logos for slideshow
    [1, 2, 3].forEach(i => {
      const logoData = state[`customLogo${i}`];
      const logoElement = document.getElementById(DOM_IDS[`customLogo${i}`]);
      logoElement.src = logoData || './common/images/placeholder.png';
    });

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

    // Slideshow
    if (state.slideShow === 'yes') {
      const slideshowDiv = document.getElementById(DOM_IDS.logoSlideshow);
      slideshowDiv.classList.replace('fadeOutElm', 'fadeInElm');
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
