'use strict';

//  G4ScoreBoard addon for OBS Copyright 2022-2025 Norman Gholson IV
//  https://g4billiards.com http://www.g4creations.com

import { CHANNEL_MAIN, CHANNEL_RECV, DOM_IDS } from './constants.js';

/**
 * Messaging module - handles BroadcastChannel communication
 */
export class Messaging {
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
