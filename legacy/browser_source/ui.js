'use strict';

//  G4ScoreBoard addon for OBS Copyright 2022-2025 Norman Gholson IV
//  https://g4billiards.com http://www.g4creations.com

import { DOM_IDS, SLIDESHOW_INTERVAL } from './constants.js';

/**
 * UI module - handles all DOM manipulation and visual updates
 */
export class UI {
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
    [1, 2].forEach(player => {
      const photoElement = document.getElementById(DOM_IDS[`p${player}Photo`]);
      const photoData = localStorage.getItem(`player${player}_photo`);

      if (photoData && photoData !== '') {
        photoElement.src = photoData;
        photoElement.classList.add('photoVisible');
      } else {
        photoElement.classList.remove('photoVisible');
      }
    });
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

    if (useClock) {
      p1Ext.classList.replace('fadeOutElm', 'fadeInElm');
      p2Ext.classList.replace('fadeOutElm', 'fadeInElm');
      p1Photo.classList.add('clockActive');
      p2Photo.classList.add('clockActive');
    } else {
      p1Ext.classList.replace('fadeInElm', 'fadeOutElm');
      p2Ext.classList.replace('fadeInElm', 'fadeOutElm');
      p1Photo.classList.remove('clockActive');
      p2Photo.classList.remove('clockActive');
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
    const leftSponsorLogo = localStorage.getItem('leftSponsorLogo');
    const rightSponsorLogo = localStorage.getItem('rightSponsorLogo');

    if (leftSponsorLogo && leftSponsorLogo !== '') {
      document.getElementById(DOM_IDS.leftSponsorLogoImg).src = leftSponsorLogo;
    }
    if (rightSponsorLogo && rightSponsorLogo !== '') {
      document.getElementById(DOM_IDS.rightSponsorLogoImg).src = rightSponsorLogo;
    }
  }

  /**
   * Start logo slideshow
   */
  startSlideshow() {
    const slideshowDiv = document.getElementById(DOM_IDS.logoSlideshow);
    slideshowDiv.classList.replace('fadeOutElm', 'fadeInElm');

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
