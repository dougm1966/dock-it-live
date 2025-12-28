/**
 * BilliardsController.js
 * Billiards-specific module controller
 *
 * Manages:
 * - Ball Tracker (8-ball, 9-ball, 10-ball)
 * - Shot Clock (30s/60s, start/stop/reset)
 * - Extensions (timeouts/extensions per player)
 *
 * Universal features (names, scores, logos) handled by Master Control Panel
 */

import { stateManager } from '../../../core/state/StateManager.js';
import { messenger } from '../../../core/messaging/BroadcastMessenger.js';

class BilliardsController {
  constructor() {
    this.stateSubscription = null;
    this.init();
  }

  /**
   * Initialize the billiards module
   */
  async init() {
    console.log('🎱 Billiards Module initializing...');

    try {
      // Initialize StateManager
      await stateManager.init();
      console.log('✅ StateManager ready');

      // Setup billiards-specific controls
      this.setupBallTrackerControls();

      // Setup reactive state subscription
      this.setupStateSubscription();

      // Initial UI render from state
      await this.renderFromState();

      console.log('✅ Billiards Module ready!');
    } catch (error) {
      console.error('❌ Billiards Module initialization failed:', error);
    }
  }

  /**
   * Setup reactive state subscription
   */
  setupStateSubscription() {
    this.stateSubscription = stateManager.subscribe((state) => {
      if (state) {
        this.updateUIFromState(state);
      }
    });
  }

  // ============================================================================
  // BALL TRACKER CONTROLS
  // ============================================================================

  setupBallTrackerControls() {
    // Enable ball tracker
    document.getElementById('btEnableChk')?.addEventListener('change', (e) => {
      this.toggleBallTracker(e.target.checked);
    });

    // Game type buttons
    document.getElementById('btGameEight')?.addEventListener('click', () => {
      this.setGameType('eight');
      this.highlightGameButton('btGameEight');
    });

    document.getElementById('btGameNine')?.addEventListener('click', () => {
      this.setGameType('nine');
      this.highlightGameButton('btGameNine');
    });

    document.getElementById('btGameTen')?.addEventListener('click', () => {
      this.setGameType('ten');
      this.highlightGameButton('btGameTen');
    });

    // Reset button - show confirmation modal
    document.getElementById('btResetBalls')?.addEventListener('click', () => {
      console.log('🔘 Reset button clicked - showing modal');
      this.showResetModal();
    });

    // Modal close button
    document.getElementById('btResetConfirmClose')?.addEventListener('click', () => {
      console.log('❌ Modal close button clicked');
      this.hideResetModal();
    });

    // Modal cancel button
    document.getElementById('btConfirmCancelBtn')?.addEventListener('click', () => {
      console.log('🚫 Cancel button clicked');
      this.hideResetModal();
    });

    // Modal confirm button - actually reset
    document.getElementById('btConfirmResetBtn')?.addEventListener('click', () => {
      console.log('✅ Confirm Reset button clicked');
      this.hideResetModal();
      this.resetBallTracker();
    });

    // Player ball set selectors (8-ball only)
    document.getElementById('btP1Set')?.addEventListener('change', (e) => {
      this.setPlayerBallSet(1, e.target.value);
    });

    document.getElementById('btP2Set')?.addEventListener('change', (e) => {
      this.setPlayerBallSet(2, e.target.value);
    });
  }

  async toggleBallTracker(enabled) {
    await stateManager.setBallTrackerEnabled(enabled);
    console.log('Ball tracker:', enabled ? 'Enabled' : 'Disabled');
  }

  async setGameType(type) {
    await stateManager.setGameType(type);

    // Get elements
    const p1Select = document.getElementById('btP1Set');
    const p2Select = document.getElementById('btP2Set');
    const p1RackRow = document.getElementById('btCpP1RackRow');
    const p2RackRow = document.getElementById('btCpP2RackRow');

    if (type === 'eight') {
      // 8-ball mode: Show dropdowns, show separate rack rows
      p1Select?.classList.remove('noShow');
      p2Select?.classList.remove('noShow');
      p1RackRow?.classList.remove('noShow');
      p2RackRow?.classList.remove('noShow');
    } else {
      // 9-ball/10-ball mode: Hide dropdowns AND rack rows (racks will show inline)
      p1Select?.classList.add('noShow');
      p2Select?.classList.add('noShow');
      p1RackRow?.classList.add('noShow');
      p2RackRow?.classList.add('noShow');
    }

    console.log('Game type set to:', type);

    // Re-render ball racks from state
    const state = await stateManager.getBallTrackerState();
    this.renderBallRacks(state);
  }

  async setPlayerBallSet(playerNum, set) {
    await stateManager.setPlayerBallSet(playerNum, set);
    console.log(`Player ${playerNum} ball set:`, set);

    const otherPlayer = playerNum === 1 ? 2 : 1;
    const otherSelect = document.getElementById(`btP${otherPlayer}Set`);

    // If unassigned, set both to unassigned
    if (set === 'unassigned') {
      await stateManager.setPlayerBallSet(otherPlayer, 'unassigned');
      console.log(`Auto-set Player ${otherPlayer} to unassigned`);

      if (otherSelect) {
        otherSelect.value = 'unassigned';
      }
    }
    // Auto-select opposite ball set for other player
    else if (set === 'solids' || set === 'stripes') {
      const oppositeSet = set === 'solids' ? 'stripes' : 'solids';

      await stateManager.setPlayerBallSet(otherPlayer, oppositeSet);
      console.log(`Auto-set Player ${otherPlayer} to ${oppositeSet}`);

      if (otherSelect) {
        otherSelect.value = oppositeSet;
      }
    }

    // Re-render ball racks from state
    const state = await stateManager.getBallTrackerState();
    this.renderBallRacks(state);
  }

  async resetBallTracker() {
    console.log('🔄 Reset clicked - clearing pocketed balls...');

    // Only clear pocketed balls, keep assignments and game type
    await stateManager.clearPocketedBalls();
    console.log('✅ Pocketed balls cleared in state');

    // Re-render ball racks from state (assignments and game type unchanged)
    const state = await stateManager.getBallTrackerState();
    console.log('📊 State after clear:', state);
    this.renderBallRacks(state);
  }

  highlightGameButton(activeId) {
    const buttons = ['btGameEight', 'btGameNine', 'btGameTen'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        if (id === activeId) {
          btn.style.border = '1px solid lime';
        } else {
          btn.style.border = '';
        }
      }
    });
  }

  showResetModal() {
    const modal = document.getElementById('btResetConfirmModal');
    if (modal) {
      modal.classList.remove('noShow');
      modal.style.display = 'flex';
    }
  }

  hideResetModal() {
    const modal = document.getElementById('btResetConfirmModal');
    if (modal) {
      modal.classList.add('noShow');
      modal.style.display = 'none';
    }
  }


  // ============================================================================
  // BALL RACK RENDERING (Control Panel Preview)
  // ============================================================================

  renderBallRacks(state) {
    const SOLIDS = ['1','2','3','4','5','6','7'];
    const STRIPES = ['9','10','11','12','13','14','15'];
    const NINE_BALL = ['1','2','3','4','5','6','7','8','9'];
    const TEN_BALL = ['1','2','3','4','5','6','7','8','9','10'];

    const p1Rack = document.getElementById('btCpP1Rack');
    const p1MidRack = document.getElementById('btCpP1MidRack');
    const p1FullRack = document.getElementById('btCpP1FullRack');

    const p2Rack = document.getElementById('btCpP2Rack');
    const p2MidRack = document.getElementById('btCpP2MidRack');
    const p2FullRack = document.getElementById('btCpP2FullRack');

    // Get the rack wrapper containers
    const p1RackWrap = p1Rack?.parentElement;
    const p2RackWrap = p2Rack?.parentElement;

    // Get the label rows
    const p1LabelRow = document.getElementById('btCpRowP1');
    const p2LabelRow = document.getElementById('btCpRowP2');

    // Clear all racks
    [p1Rack, p1MidRack, p1FullRack, p2Rack, p2MidRack, p2FullRack].forEach(rack => {
      if (rack) rack.innerHTML = '';
      if (rack) rack.classList.add('noShow');
    });

    if (!state.enabled) return;

    const gameType = state.gameType || 'eight';
    const p1Set = state.assignments?.p1Set || 'unassigned';
    const p2Set = state.assignments?.p2Set || 'unassigned';

    if (gameType === 'nine' || gameType === 'ten') {
      // 9-ball/10-ball: Move racks inline with labels
      const balls = gameType === 'nine' ? NINE_BALL : TEN_BALL;

      if (p1FullRack && p2FullRack && p1RackWrap && p2RackWrap && p1LabelRow && p2LabelRow) {
        // Move rack wrappers into label rows (inline with labels)
        p1LabelRow.appendChild(p1RackWrap);
        p2LabelRow.appendChild(p2RackWrap);

        p1FullRack.classList.remove('noShow');
        p2FullRack.classList.remove('noShow');

        this.renderRack(p1FullRack, balls, state.pocketed);
        this.renderRack(p2FullRack, balls, state.pocketed);
      }
    } else {
      // 8-ball mode
      console.log(`🎱 Control Panel - 8-ball mode: P1=${p1Set}, P2=${p2Set}`);

      // Move rack wrappers back to separate rack rows
      const p1RackRow = document.getElementById('btCpP1RackRow');
      const p2RackRow = document.getElementById('btCpP2RackRow');

      if (p1RackWrap && p2RackWrap && p1RackRow && p2RackRow) {
        p1RackRow.appendChild(p1RackWrap);
        p2RackRow.appendChild(p2RackWrap);
      }

      // If both are unassigned, keep all racks hidden
      if (p1Set === 'unassigned' && p2Set === 'unassigned') {
        console.log('🎱 Control Panel - Both unassigned, hiding all racks');
        return; // All racks already hidden by the clear loop above
      }

      // Show split racks since at least one player is assigned
      if (p1Rack && p1MidRack && p2Rack && p2MidRack) {
        p1Rack.classList.remove('noShow');
        p1MidRack.classList.remove('noShow');
        p2Rack.classList.remove('noShow');
        p2MidRack.classList.remove('noShow');

        // Only render balls if assigned (not 'unassigned')
        if (p1Set !== 'unassigned') {
          const p1Balls = p1Set === 'stripes' ? STRIPES : SOLIDS;
          this.renderRack(p1Rack, p1Balls, state.pocketed);
          console.log(`🎱 Control Panel - P1 balls rendered: ${p1Set}`);
        } else {
          console.log('🎱 Control Panel - P1 unassigned, no balls rendered');
        }

        // Show 8-ball in middle (when at least one player is assigned)
        this.renderRack(p1MidRack, ['8'], state.pocketed);

        if (p2Set !== 'unassigned') {
          const p2Balls = p2Set === 'stripes' ? STRIPES : SOLIDS;
          this.renderRack(p2Rack, p2Balls, state.pocketed);
          console.log(`🎱 Control Panel - P2 balls rendered: ${p2Set}`);
        } else {
          console.log('🎱 Control Panel - P2 unassigned, no balls rendered');
        }

        this.renderRack(p2MidRack, ['8'], state.pocketed);
        console.log('🎱 Control Panel - 8-ball rendered');
      }
    }
  }

  renderRack(element, ballNumbers, pocketed, placeholder = false) {
    if (!element) return;

    element.innerHTML = '';

    ballNumbers.forEach(num => {
      // Use image instead of div with text
      const ballImg = document.createElement('img');
      ballImg.className = 'btcp-ball';
      ballImg.src = `../assets/balls/render0/${num}.png`;
      ballImg.alt = num;
      ballImg.dataset.ball = num;
      ballImg.style.cursor = 'pointer';

      if (placeholder) {
        ballImg.classList.add('btcp-ball--placeholder');
      }

      if (pocketed && pocketed[num]) {
        ballImg.classList.add('btcp-ball--pocketed');
      }

      // Click to toggle pocketed state
      ballImg.addEventListener('click', () => {
        this.toggleBallPocketed(num);
      });

      element.appendChild(ballImg);
    });
  }

  async toggleBallPocketed(ballNumber) {
    await stateManager.toggleBallPocketed(ballNumber);

    const state = await stateManager.getBallTrackerState();
    console.log(`Ball ${ballNumber} pocketed:`, state.pocketed[ballNumber]);

    // Re-render to show updated state
    this.renderBallRacks(state);
  }

  // ============================================================================
  // STATE RENDERING
  // ============================================================================

  async renderFromState() {
    const state = await stateManager.getState();
    if (state) {
      this.updateUIFromState(state);
    }

    // Render ball tracker from state
    const btState = await stateManager.getBallTrackerState();
    this.renderBallRacks(btState);
  }

  async updateUIFromState(state) {
    if (!state) return;

    // Update player names on labels
    if (state.matchData) {
      this.updatePlayerNames(state.matchData.player1, state.matchData.player2);
    }

    // Update ball tracker UI from state
    const btState = await stateManager.getBallTrackerState();

    const enableChk = document.getElementById('btEnableChk');
    if (enableChk) {
      enableChk.checked = btState.enabled || false;
    }

    // Highlight active game type
    const gameType = btState.gameType || 'eight';
    if (gameType === 'eight') this.highlightGameButton('btGameEight');
    else if (gameType === 'nine') this.highlightGameButton('btGameNine');
    else if (gameType === 'ten') this.highlightGameButton('btGameTen');
  }

  /**
   * Update P1/P2 labels with actual player names
   */
  updatePlayerNames(player1, player2) {
    const p1Name = player1?.name || 'P1';
    const p2Name = player2?.name || 'P2';

    // Update ball tracker labels
    const p1Label = document.querySelector('label[for="btP1Set"]');
    const p2Label = document.querySelector('label[for="btP2Set"]');

    // Alternative: find labels by their text content
    const labels = document.querySelectorAll('#ballTrackerSection label');
    labels.forEach(label => {
      if (label.textContent === 'P1 Balls:') {
        label.textContent = `${p1Name} Balls:`;
      } else if (label.textContent === 'P2 Balls:') {
        label.textContent = `${p2Name} Balls:`;
      } else if (label.textContent.includes('P1 Balls:')) {
        label.textContent = `${p1Name} Balls:`;
      } else if (label.textContent.includes('P2 Balls:')) {
        label.textContent = `${p2Name} Balls:`;
      }
    });
  }

  /**
   * Cleanup on unload
   */
  destroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }
}

// Initialize controller
const controller = new BilliardsController();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  controller.destroy();
});

// Make available in console for debugging
window.billiards = controller;

console.log('✅ BilliardsController.js loaded');
