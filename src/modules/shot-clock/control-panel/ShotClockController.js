/**
 * ShotClockController.js
 * Universal shot clock module controller
 *
 * Manages:
 * - Shot Clock (30s/60s, start/stop/reset)
 * - Extensions (timeouts/extensions per player)
 *
 * Universal module - works with any sport (Billiards, Darts, Chess, etc.)
 */

import { stateManager } from '../../../core/state/StateManager.js';
import { messenger } from '../../../core/messaging/BroadcastMessenger.js';

class ShotClockController {
  constructor() {
    this.stateSubscription = null;
    this.shotClockInterval = null;
    this.init();
  }

  /**
   * Initialize the shot clock module
   */
  async init() {
    console.log('⏱️ Shot Clock Module initializing...');

    try {
      // Initialize StateManager
      await stateManager.init();
      console.log('✅ StateManager ready');

      // Setup shot clock controls
      this.setupClockControls();

      // Setup reactive state subscription
      this.setupStateSubscription();

      // Initial UI render from state
      await this.renderFromState();

      // Start shot clock timer
      this.startShotClockTimer();

      console.log('✅ Shot Clock Module ready!');
    } catch (error) {
      console.error('❌ Shot Clock Module initialization failed:', error);
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
  // SHOT CLOCK CONTROLS
  // ============================================================================

  setupClockControls() {
    // 30s clock
    document.getElementById('shotClock30')?.addEventListener('click', async () => {
      try {
        await stateManager.setShotClockDuration(30);
        this.updateClockButtonHighlight(30);
        console.log('✅ Shot clock set to 30s');
      } catch (error) {
        console.error('❌ Failed to set 30s duration:', error);
      }
    });

    // 60s clock
    document.getElementById('shotClock60')?.addEventListener('click', async () => {
      try {
        await stateManager.setShotClockDuration(60);
        this.updateClockButtonHighlight(60);
        console.log('✅ Shot clock set to 60s');
      } catch (error) {
        console.error('❌ Failed to set 60s duration:', error);
      }
    });

    // Custom duration
    document.getElementById('setCustomDuration')?.addEventListener('click', async () => {
      try {
        const input = document.getElementById('customDuration');
        if (input) {
          const duration = parseInt(input.value) || 40;
          const clamped = Math.max(5, Math.min(300, duration)); // Clamp between 5-300 seconds
          await stateManager.setShotClockDuration(clamped);
          this.updateClockButtonHighlight(null); // Remove highlight from 30s/60s
          console.log(`✅ Shot clock set to ${clamped}s`);
        }
      } catch (error) {
        console.error('❌ Failed to set custom duration:', error);
      }
    });

    // Show/Hide clock
    document.getElementById('shotClockShow')?.addEventListener('click', async () => {
      try {
        await stateManager.toggleShotClockVisibility();
        console.log('✅ Shot clock visibility toggled');
      } catch (error) {
        console.error('❌ Failed to toggle visibility:', error);
      }
    });

    // Start clock
    document.getElementById('startClockDiv')?.addEventListener('click', async () => {
      try {
        await stateManager.startShotClock();
        console.log('✅ Shot clock started');
      } catch (error) {
        console.error('❌ Failed to start clock:', error);
      }
    });

    // Stop clock
    document.getElementById('stopClockDiv')?.addEventListener('click', async () => {
      try {
        await stateManager.stopShotClock();
        console.log('✅ Shot clock stopped');
      } catch (error) {
        console.error('❌ Failed to stop clock:', error);
      }
    });

    // Reset clock
    document.getElementById('resetClockDiv')?.addEventListener('click', async () => {
      try {
        await stateManager.resetShotClock();
        console.log('✅ Shot clock reset');
      } catch (error) {
        console.error('❌ Failed to reset clock:', error);
      }
    });

    // Extension duration
    document.getElementById('setExtensionDuration')?.addEventListener('click', async () => {
      try {
        const input = document.getElementById('extensionDuration');
        if (input) {
          const duration = parseInt(input.value) || 10;
          const clamped = Math.max(5, Math.min(60, duration)); // Clamp between 5-60 seconds
          await stateManager.setExtensionDuration(clamped);
          console.log(`✅ Extension duration set to ${clamped}s`);
        }
      } catch (error) {
        console.error('❌ Failed to set extension duration:', error);
      }
    });

    // Max extensions per player
    document.getElementById('setMaxExtensions')?.addEventListener('click', async () => {
      try {
        const input = document.getElementById('maxExtensions');
        if (input) {
          const maxExt = parseInt(input.value) || 3;
          const clamped = Math.max(0, Math.min(10, maxExt)); // Clamp between 0-10
          await stateManager.setMaxExtensions(clamped);
          console.log(`✅ Max extensions set to ${clamped} per player`);
        }
      } catch (error) {
        console.error('❌ Failed to set max extensions:', error);
      }
    });

    // P1 Extension
    document.getElementById('p1extensionBtn')?.addEventListener('click', async () => {
      try {
        await stateManager.addPlayerExtension(1);
        console.log('✅ P1 extension added');
      } catch (error) {
        console.error('❌ Failed to add P1 extension:', error);
      }
    });

    // P2 Extension
    document.getElementById('p2extensionBtn')?.addEventListener('click', async () => {
      try {
        await stateManager.addPlayerExtension(2);
        console.log('✅ P2 extension added');
      } catch (error) {
        console.error('❌ Failed to add P2 extension:', error);
      }
    });

    // P1 Remove Extension (give back one)
    document.getElementById('p1ExtRemove')?.addEventListener('click', async () => {
      try {
        const removeTimeCheckbox = document.getElementById('removeTimeWithExtension');
        const shouldRemoveTime = removeTimeCheckbox ? removeTimeCheckbox.checked : false;
        await stateManager.removePlayerExtension(1, shouldRemoveTime);
        console.log(`✅ P1 extension removed (given back) - Time removed: ${shouldRemoveTime}`);
      } catch (error) {
        console.error('❌ Failed to remove P1 extension:', error);
      }
    });

    // P2 Remove Extension (give back one)
    document.getElementById('p2ExtRemove')?.addEventListener('click', async () => {
      try {
        const removeTimeCheckbox = document.getElementById('removeTimeWithExtension');
        const shouldRemoveTime = removeTimeCheckbox ? removeTimeCheckbox.checked : false;
        await stateManager.removePlayerExtension(2, shouldRemoveTime);
        console.log(`✅ P2 extension removed (given back) - Time removed: ${shouldRemoveTime}`);
      } catch (error) {
        console.error('❌ Failed to remove P2 extension:', error);
      }
    });
  }

  updateClockButtonHighlight(duration) {
    const btn30 = document.getElementById('shotClock30');
    const btn60 = document.getElementById('shotClock60');

    // If duration is null, remove all highlights (custom duration was set)
    if (duration === null) {
      if (btn30) btn30.style.border = '';
      if (btn60) btn60.style.border = '';
      return;
    }

    if (btn30) btn30.style.border = duration === 30 ? '1px solid lime' : '';
    if (btn60) btn60.style.border = duration === 60 ? '1px solid lime' : '';
  }

  /**
   * Start shot clock timer interval
   * Automatically decrements clock when running
   */
  startShotClockTimer() {
    // Clear any existing interval
    if (this.shotClockInterval) {
      clearInterval(this.shotClockInterval);
    }

    console.log('⏱️ Shot clock timer interval starting...');

    // Timer ticks every 1 second
    this.shotClockInterval = setInterval(async () => {
      const state = await stateManager.getState();

      if (!state || !state.modules || !state.modules.shotClock) return;

      const shotClock = state.modules.shotClock;

      // Only decrement if clock is running and time > 0
      if (shotClock.running && shotClock.currentTime > 0) {
        const newTime = shotClock.currentTime - 1;
        console.log(`⏱️ Tick: ${shotClock.currentTime} → ${newTime}`);
        await stateManager.updateShotClockTime(newTime);

        // Stop clock when time reaches 0
        if (newTime === 0) {
          await stateManager.stopShotClock();
          console.log('⏰ Shot clock expired!');
        }
      }
    }, 1000);

    console.log('✅ Shot clock timer interval running');
  }

  // ============================================================================
  // STATE RENDERING
  // ============================================================================

  async renderFromState() {
    const state = await stateManager.getState();
    if (state) {
      this.updateUIFromState(state);
    }
  }

  updateUIFromState(state) {
    if (!state) return;

    // Update shot clock UI if needed
    if (state.modules?.shotClock) {
      const { duration } = state.modules.shotClock;
      this.updateClockButtonHighlight(duration || 30);
    }

    // Update player names on buttons
    if (state.matchData) {
      this.updatePlayerNames(state.matchData.player1, state.matchData.player2);
    }
  }

  /**
   * Update P1/P2 labels with actual player names
   */
  updatePlayerNames(player1, player2) {
    const p1Name = player1?.name || 'P1';
    const p2Name = player2?.name || 'P2';

    // Update extension buttons
    const p1ExtBtn = document.getElementById('p1extensionBtn');
    const p2ExtBtn = document.getElementById('p2extensionBtn');
    const p1ExtRemove = document.getElementById('p1ExtRemove');
    const p2ExtRemove = document.getElementById('p2ExtRemove');

    if (p1ExtBtn) p1ExtBtn.textContent = `${p1Name} Use Extension`;
    if (p2ExtBtn) p2ExtBtn.textContent = `${p2Name} Use Extension`;
    if (p1ExtRemove) p1ExtRemove.textContent = `${p1Name} Return Extension`;
    if (p2ExtRemove) p2ExtRemove.textContent = `${p2Name} Return Extension`;
  }

  /**
   * Cleanup on unload
   */
  destroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }

    if (this.shotClockInterval) {
      clearInterval(this.shotClockInterval);
    }
  }
}

// Initialize controller
const controller = new ShotClockController();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  controller.destroy();
});

// Make available in console for debugging
window.shotClock = controller;

console.log('✅ ShotClockController.js loaded');
