/**
 * MIGRATED CONTROL PANEL - StateManager Version
 *
 * Key Changes:
 * - Replaced ALL localStorage calls with StateManager
 * - Database-first architecture
 * - BroadcastChannel now trigger-only (no data in messages)
 *
 * To use: Load stateManagerBridge.js BEFORE this file
 */

'use strict';

// Shot clock duration selection (default 30s)
var selectedClockTime = 31000;
var clockIsPaused = false;

// Wait for StateManager to be ready
let stateManager;
window.addEventListener('stateManagerReady', () => {
  stateManager = window.stateManager;
  console.log('✅ Control Panel: StateManager ready');
  initializeControlPanel();
});

/**
 * Initialize control panel from database
 */
async function initializeControlPanel() {
  try {
    const state = await stateManager.getState();

    if (state && state.matchData) {
      // Load player names
      if (state.matchData.player1) {
        document.getElementById("p1Name").value = state.matchData.player1.name || 'Player 1';
      }
      if (state.matchData.player2) {
        document.getElementById("p2Name").value = state.matchData.player2.name || 'Player 2';
      }

      // Load Fargo ratings (if fields exist)
      const p1Fargo = document.getElementById("p1Fargo");
      const p2Fargo = document.getElementById("p2Fargo");

      if (p1Fargo && state.matchData.player1) {
        p1Fargo.value = state.matchData.player1.fargoInfo || 'Fargo 520';
      }
      if (p2Fargo && state.matchData.player2) {
        p2Fargo.value = state.matchData.player2.fargoInfo || 'Fargo 480';
      }

      // Load race/wager info
      if (state.matchData.infoTab1 || state.matchData.raceInfo) {
        document.getElementById("raceInfoTxt").value = state.matchData.infoTab1 || state.matchData.raceInfo || '';
      }
      if (state.matchData.infoTab2 || state.matchData.wagerInfo) {
        document.getElementById("wagerInfoTxt").value = state.matchData.infoTab2 || state.matchData.wagerInfo || '';
      }

      // Load scores (global variables for jQuery code compatibility)
      window.p1ScoreValue = state.matchData.player1?.score || 0;
      window.p2ScoreValue = state.matchData.player2?.score || 0;

      console.log('✅ Control panel initialized from database');
    }
  } catch (error) {
    console.error('❌ Failed to initialize control panel:', error);
  }
}

/**
 * MIGRATED: Send player names and race/wager info
 * OLD: Used localStorage.setItem() for each field
 * NEW: Uses StateManager with single database write
 */
async function sendNames() {
  try {
    const p1Name = document.getElementById("p1Name");
    const p2Name = document.getElementById("p2Name");
    const raceInfoTxt = document.getElementById("raceInfoTxt");
    const wagerInfoTxt = document.getElementById("wagerInfoTxt");

    // Update player names
    const p1NameValue = p1Name.value.trim();
    const p2NameValue = p2Name.value.trim();

    if (p1NameValue) {
      await stateManager.setPlayerName(1, p1NameValue.substring(0, 29));
    } else {
      await stateManager.setPlayerName(1, 'Player 1');
    }

    if (p2NameValue) {
      await stateManager.setPlayerName(2, p2NameValue.substring(0, 29));
    } else {
      await stateManager.setPlayerName(2, 'Player 2');
    }

    // Update Fargo ratings (if fields exist)
    const p1Fargo = document.getElementById("p1Fargo");
    const p2Fargo = document.getElementById("p2Fargo");

    if (p1Fargo) {
      const p1FargoValue = p1Fargo.value.trim();
      if (p1FargoValue) {
        await stateManager.setPlayerFargoInfo(1, p1FargoValue);
      } else {
        // Empty field = reset to default
        await stateManager.setPlayerFargoInfo(1, 'Fargo 520');
      }
    }

    if (p2Fargo) {
      const p2FargoValue = p2Fargo.value.trim();
      if (p2FargoValue) {
        await stateManager.setPlayerFargoInfo(2, p2FargoValue);
      } else {
        // Empty field = reset to default
        await stateManager.setPlayerFargoInfo(2, 'Fargo 480');
      }
    }

    // Update race/wager info (using new infoTab1/infoTab2 fields)
    const raceValue = raceInfoTxt.value.trim();
    const wagerValue = wagerInfoTxt.value.trim();

    await stateManager.setMatchInfoTab1(raceValue || '');
    await stateManager.setMatchInfoTab2(wagerValue || '');

    // Also update legacy fields for backward compatibility
    await stateManager.setRaceInfo(raceValue || '');
    await stateManager.setValue('matchData.wagerInfo', wagerValue || '');

    console.log('✅ Names, ratings, and info updated in database');

    // Update button labels (jQuery code compatibility)
    updateButtonLabels();

  } catch (error) {
    console.error('❌ Failed to send names:', error);
  }
}

/**
 * Update button labels based on player names
 */
function updateButtonLabels() {
  const p1Name = document.getElementById("p1Name").value;
  const p2Name = document.getElementById("p2Name").value;
  const scoreAmount = document.getElementById("scoreAmount") ? document.getElementById("scoreAmount").value : 1;

  const p1FirstName = p1Name.split(" ")[0];
  const p2FirstName = p2Name.split(" ")[0];

  // Update extension buttons
  if (p1Name) {
    document.getElementById("p1ExtReset").innerHTML = "Reset<br>" + p1FirstName.substring(0, 9) + "'s Ext";
    document.getElementById("p1extensionBtn").innerHTML = p1FirstName.substring(0, 9) + "'s<br>Extension";
  } else {
    document.getElementById("p1ExtReset").innerHTML = "P1 Ext Reset";
    document.getElementById("p1extensionBtn").innerHTML = "P1 Extension";
  }

  if (p2Name) {
    document.getElementById("p2ExtReset").innerHTML = "Reset<br>" + p2FirstName.substring(0, 9) + "'s Ext";
    document.getElementById("p2extensionBtn").innerHTML = p2FirstName.substring(0, 9) + "'s<br>Extension";
  } else {
    document.getElementById("p2ExtReset").innerHTML = "P2 Ext Reset";
    document.getElementById("p2extensionBtn").innerHTML = "P2 Extension";
  }

  // Update score buttons
  if (p1Name) {
    document.getElementById("sendP1Score").innerHTML = p1FirstName.substring(0, 9) + "<br>+" + scoreAmount + " Score";
    document.getElementById("sendP1ScoreSub").innerHTML = p1FirstName.substring(0, 9) + "<br>-" + scoreAmount + " Score";
  } else {
    document.getElementById("sendP1Score").innerHTML = "P1 +1 Score";
    document.getElementById("sendP1ScoreSub").innerHTML = "P1 -1 Score";
  }

  if (p2Name) {
    document.getElementById("sendP2Score").innerHTML = p2FirstName.substring(0, 9) + "<br>+" + scoreAmount + " Score";
    document.getElementById("sendP2ScoreSub").innerHTML = p2FirstName.substring(0, 9) + "<br>-" + scoreAmount + " Score";
  } else {
    document.getElementById("sendP2Score").innerHTML = "P2 +1 Score";
    document.getElementById("sendP2ScoreSub").innerHTML = "P2 -1 Score";
  }
}

/**
 * MIGRATED: Update player score
 * OLD: Used localStorage.setItem() and manual BroadcastChannel
 * NEW: Uses StateManager (DB write + automatic broadcast)
 */
async function postScore(opt1, player) {
  try {
    const scoreAmount = parseInt(document.getElementById("scoreAmount")?.value || 1);

    if (opt1 == "add") {
      // Increment score
      await stateManager.incrementScore(player, scoreAmount);

      // Stop shot clock on score
      await stateManager.stopShotClock();

      // Update UI (jQuery compatibility)
      document.getElementById("sendP" + player + "Score").style.border = "1px solid lightgreen";
      setTimeout(rst_scr_btn, 100);

      // Reset extensions for both players
      resetExt('p1', 'noflash');
      resetExt('p2', 'noflash');

      // Update global variable for jQuery code
      const state = await stateManager.getState();
      if (player == 1) {
        window.p1ScoreValue = state.matchData.player1.score;
      } else {
        window.p2ScoreValue = state.matchData.player2.score;
      }

    } else {
      // Decrement score
      await stateManager.decrementScore(player, scoreAmount);

      // Update UI
      document.getElementById("sendP" + player + "ScoreSub").style.border = "1px solid tomato";
      setTimeout(rst_scr_btn, 100);

      // Update global variable
      const state = await stateManager.getState();
      if (player == 1) {
        window.p1ScoreValue = state.matchData.player1.score;
      } else {
        window.p2ScoreValue = state.matchData.player2.score;
      }
    }

    console.log(`✅ Player ${player} score updated in database`);

  } catch (error) {
    console.error(`❌ Failed to update score for player ${player}:`, error);
  }
}

/**
 * MIGRATED: Reset all scores
 * OLD: Used localStorage.setItem() to set scores to 0
 * NEW: Uses StateManager.resetScores()
 */
async function resetScore() {
  try {
    if (confirm("Click OK to confirm score reset")) {
      // Reset scores in database
      await stateManager.resetScores();

      // Update global variables for jQuery code
      window.p1ScoreValue = 0;
      window.p2ScoreValue = 0;

      // Reset extensions
      resetExt('p1', 'noflash');
      resetExt('p2', 'noflash');

      console.log('✅ Scores reset in database');
    }
  } catch (error) {
    console.error('❌ Failed to reset scores:', error);
  }
}

/**
 * MIGRATED: Complete reset - clears ALL fields
 * Resets: scores, names, fargo, race/wager info, extensions
 */
async function completeReset() {
  try {
    if (confirm("Reset EVERYTHING (scores, names, race info, Fargo ratings)? This cannot be undone.")) {
      // Reset to default state
      await stateManager.resetMatch();

      // Clear UI fields
      document.getElementById("p1Name").value = "Player 1";
      document.getElementById("p2Name").value = "Player 2";
      document.getElementById("raceInfoTxt").value = "";
      document.getElementById("wagerInfoTxt").value = "";

      // Update global variables
      window.p1ScoreValue = 0;
      window.p2ScoreValue = 0;

      // Reset button labels
      updateButtonLabels();

      console.log('✅ Complete reset - all fields cleared');
      alert('✅ Complete reset successful!');
    }
  } catch (error) {
    console.error('❌ Failed to complete reset:', error);
    alert('❌ Reset failed: ' + error.message);
  }
}

/**
 * MIGRATED: Clear player names and info (keeps scores)
 */
async function clearNamesAndInfo() {
  try {
    if (confirm("Clear player names and race/wager info? (Scores will be kept)")) {
      // Reset names to defaults
      await stateManager.setPlayerName(1, 'Player 1');
      await stateManager.setPlayerName(2, 'Player 2');

      // Reset Fargo info to defaults
      await stateManager.setPlayerFargoInfo(1, 'Fargo 520');
      await stateManager.setPlayerFargoInfo(2, 'Fargo 480');

      // Clear race/wager info
      await stateManager.setMatchInfoTab1('');
      await stateManager.setMatchInfoTab2('');

      // Clear UI fields
      document.getElementById("p1Name").value = "Player 1";
      document.getElementById("p2Name").value = "Player 2";
      document.getElementById("raceInfoTxt").value = "";
      document.getElementById("wagerInfoTxt").value = "";

      // Reset button labels
      updateButtonLabels();

      console.log('✅ Names and info cleared');
    }
  } catch (error) {
    console.error('❌ Failed to clear names and info:', error);
  }
}

/**
 * Helper function to reset score button styles
 */
function rst_scr_btn() {
  document.getElementById("sendP1Score").style.border = "none";
  document.getElementById("sendP2Score").style.border = "none";
  document.getElementById("sendP1ScoreSub").style.border = "none";
  document.getElementById("sendP2ScoreSub").style.border = "none";
}

/**
 * Placeholder for resetExt function (to be migrated)
 */
function resetExt(player, flash) {
  // TODO: Migrate extension reset to StateManager
  console.log(`Extension reset for ${player}`);
}

// Export functions for HTML onclick handlers
window.sendNames = sendNames;
window.postScore = postScore;
window.resetScore = resetScore;
window.completeReset = completeReset;
window.clearNamesAndInfo = clearNamesAndInfo;
