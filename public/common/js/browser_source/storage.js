'use strict';

//  G4ScoreBoard addon for OBS Copyright 2022-2025 Norman Gholson IV
//  https://g4billiards.com http://www.g4creations.com

import { STORAGE_KEYS } from './constants.js';

/**
 * Storage module - handles localStorage operations
 */
export const Storage = {
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
      customLogo1: this.get(STORAGE_KEYS.customLogo1, ''),
      customLogo2: this.get(STORAGE_KEYS.customLogo2, ''),
      customLogo3: this.get(STORAGE_KEYS.customLogo3, ''),
      leftSponsorLogo: this.get(STORAGE_KEYS.leftSponsorLogo, ''),
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
