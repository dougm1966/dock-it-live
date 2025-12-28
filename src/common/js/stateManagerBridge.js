/**
 * StateManager Bridge
 * Makes StateManager available to legacy jQuery code
 *
 * Usage in legacy files:
 *   <script type="module" src="stateManagerBridge.js"></script>
 *
 * Then access via:
 *   window.stateManager.setPlayerName(1, "John");
 */

import { stateManager } from '../../core/state/StateManager.js';
import { dexieDB } from '../../core/database/DexieWrapper.js';

// Make StateManager globally available for legacy code
window.stateManager = stateManager;
window.dexieDB = dexieDB;

// Initialize on load
(async () => {
  try {
    console.log('🔧 Initializing StateManager bridge...');
    await stateManager.init();
    console.log('✅ StateManager ready - Legacy code can now use window.stateManager');

    // Dispatch event so legacy code knows StateManager is ready
    window.dispatchEvent(new CustomEvent('stateManagerReady'));
  } catch (error) {
    console.error('❌ StateManager initialization failed:', error);
  }
})();
