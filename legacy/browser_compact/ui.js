'use strict';

//  G4ScoreBoard addon for OBS Copyright 2022-2025 Norman Gholson IV
//  https://g4billiards.com http://www.g4creations.com

import { DOM_IDS, SLIDESHOW_INTERVAL } from './constants.js';

/**
 * UI module for browser_compact - simplified version
 */
export class UI {
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
    const customImage = localStorage.getItem('customImage');
    if (customImage && customImage !== '') {
      document.getElementById(DOM_IDS.g4Logo).src = customImage;
    }
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

    [1, 2, 3].forEach(i => {
      const logoData = localStorage.getItem(`customLogo${i}`);
      const logoElement = document.getElementById(DOM_IDS[`customLogo${i}`]);
      logoElement.src = logoData || './common/images/placeholder.png';
    });

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
