'use strict';

//  G4ScoreBoard addon for OBS Copyright 2022-2025 Norman Gholson IV
//  https://g4billiards.com http://www.g4creations.com

// Shot Clock Durations (milliseconds)
export const CLOCK_30S = 31000; // 30s + 1s buffer
export const CLOCK_60S = 61000; // 60s + 1s buffer
export const EXTENSION_TIME = 30000; // 30s extension

// Shot Clock Thresholds (milliseconds)
export const THRESHOLD_SHOW = 31000;
export const THRESHOLD_FADE = 26000;
export const THRESHOLD_ORANGE = 21000;
export const THRESHOLD_YELLOW = 16000;
export const THRESHOLD_TOMATO = 11000;
export const THRESHOLD_RED = 6000;
export const THRESHOLD_BEEP = 11000;
export const THRESHOLD_BEEP_END = 9700;

// Animation Timings
export const FADE_DURATION = 1000;
export const BLINK_DURATION = 500;
export const SLIDESHOW_INTERVAL = 20000;

// BroadcastChannel Names
export const CHANNEL_MAIN = 'g4-main';
export const CHANNEL_RECV = 'g4-recv';

// localStorage Keys
export const STORAGE_KEYS = {
  customLogo1: 'customLogo1',
  customLogo2: 'customLogo2',
  customLogo3: 'customLogo3',
  leftSponsorLogo: 'leftSponsorLogo',
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
export const DOM_IDS = {
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
