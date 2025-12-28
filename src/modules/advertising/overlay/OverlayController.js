/**
 * OverlayController.js
 * Advertising overlay display controller
 *
 * Renders 12 ad slots (T1-T6, L1-L3, R1-R3) using legacy grid layout
 * Syncs with Dexie.js state for real-time updates
 *
 * Layout Logic (from legacy advertising_frame.js):
 * - Top bar: 125px or 0px (when hidden)
 * - Left/Right bars: 125px or 0px (when hidden)
 * - When top hidden: Left/Right bars extend to TOP of viewport
 */

import { stateManager } from '../../../core/state/StateManager.js';
import { messenger } from '../../../core/messaging/BroadcastMessenger.js';
import { dexieDB } from '../../../core/database/index.js';

class OverlayController {
  constructor() {
    this.stateSubscription = null;
    this.renderPending = false;
    this.renderRunning = false;
    this.assetUrlCache = new Map(); // Cache object URLs to avoid memory leaks
    this.init();
  }

  /**
   * Initialize the overlay
   */
  async init() {
    console.log('📢 Advertising Overlay initializing...');

    try {
      // Initialize StateManager
      await stateManager.init();
      console.log('✅ StateManager ready');

      // Setup message listeners
      this.setupMessageListeners();

      // Setup reactive state subscription
      this.setupStateSubscription();

      // Apply viewport scaling
      this.applyViewportScale();

      // Initial render from state
      await this.requestRenderAll();

      // Re-scale on window resize
      window.addEventListener('resize', () => this.applyViewportScale());

      console.log('✅ Advertising Overlay ready!');
    } catch (error) {
      console.error('❌ Advertising Overlay initialization failed:', error);
    }
  }

  /**
   * Setup reactive state subscription
   */
  setupStateSubscription() {
    this.stateSubscription = stateManager.subscribe((state) => {
      if (state) {
        console.log('📡 State update received, triggering render');
        this.requestRenderAll();
      }
    });
  }

  /**
   * Setup message listeners for BroadcastChannel
   */
  setupMessageListeners() {
    messenger.on('ADS_REFRESH', () => {
      console.log('📡 ADS_REFRESH message received');
      this.requestRenderAll();
    });

    messenger.on('LOGO_SLOT_CHANGED', (message) => {
      console.log('📡 LOGO_SLOT_CHANGED:', message.payload?.slotId);
      this.requestRenderAll();
    });
  }

  // ============================================================================
  // RENDERING PIPELINE
  // ============================================================================

  /**
   * Request a full render (debounced to avoid excessive updates)
   */
  async requestRenderAll() {
    this.renderPending = true;

    if (this.renderRunning) {
      console.log('⏳ Render already running, queued for next cycle');
      return;
    }

    this.renderRunning = true;

    while (this.renderPending) {
      this.renderPending = false;

      try {
        await this.renderAll();
      } catch (error) {
        console.error('❌ Render error:', error);
      }
    }

    this.renderRunning = false;
  }

  /**
   * Render all ad regions
   */
  async renderAll() {
    console.log('🎨 Rendering all ad regions...');

    const state = await stateManager.getState();
    if (!state) {
      console.warn('⚠️ No state available for rendering');
      return;
    }

    // Apply region visibility
    await this.applyRegionVisibility(state);

    // Render each region
    await this.renderTopBar(state);
    await this.renderLeftBar(state);
    await this.renderRightBar(state);

    console.log('✅ All regions rendered');
  }

  /**
   * Apply region visibility based on state
   * Uses legacy logic from advertising_frame.js:applyRegionVisibility()
   */
  async applyRegionVisibility(state) {
    const root = document.getElementById('frameRoot');
    if (!root) return;

    // Get visibility from state (defaults to true if not set)
    const advertising = state.modules?.advertising || {};
    const showTop = advertising.showTop !== false;
    const showLeft = advertising.showLeft !== false;
    const showRight = advertising.showRight !== false;

    // Set CSS custom properties (THIS IS THE MAGIC!)
    root.style.setProperty('--ads-top-h', showTop ? '125px' : '0px');
    root.style.setProperty('--ads-left-w', showLeft ? '125px' : '0px');
    root.style.setProperty('--ads-right-w', showRight ? '125px' : '0px');

    // Also set display property
    const topEl = document.getElementById('adsTop');
    const leftEl = document.getElementById('adsLeft');
    const rightEl = document.getElementById('adsRight');

    if (topEl) topEl.style.display = showTop ? '' : 'none';
    if (leftEl) leftEl.style.display = showLeft ? '' : 'none';
    if (rightEl) rightEl.style.display = showRight ? '' : 'none';

    console.log(`👁️ Region visibility: Top=${showTop}, Left=${showLeft}, Right=${showRight}`);
  }

  /**
   * Render top bar (T1-T6)
   */
  async renderTopBar(state) {
    const container = document.getElementById('adsTop');
    if (!container) return;

    this.clearContainer(container);

    const slotIds = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

    for (let i = 0; i < slotIds.length; i++) {
      const slotId = slotIds[i];
      const slotData = state.logoSlots?.[slotId];

      if (slotData && slotData.active && slotData.assetId) {
        const tile = await this.createAdTile(slotData.assetId, slotId);
        if (tile) {
          tile.style.gridColumn = `${i + 1} / span 1`;
          container.appendChild(tile);
        }
      }
    }
  }

  /**
   * Render left bar (L1-L3)
   */
  async renderLeftBar(state) {
    const container = document.getElementById('adsLeft');
    if (!container) return;

    this.clearContainer(container);

    const slotIds = ['L1', 'L2', 'L3'];

    for (let i = 0; i < slotIds.length; i++) {
      const slotId = slotIds[i];
      const slotData = state.logoSlots?.[slotId];

      if (slotData && slotData.active && slotData.assetId) {
        const tile = await this.createAdTile(slotData.assetId, slotId);
        if (tile) {
          tile.style.gridRow = `${i + 1} / span 1`;
          container.appendChild(tile);
        }
      }
    }
  }

  /**
   * Render right bar (R1-R3)
   */
  async renderRightBar(state) {
    const container = document.getElementById('adsRight');
    if (!container) return;

    this.clearContainer(container);

    const slotIds = ['R1', 'R2', 'R3'];

    for (let i = 0; i < slotIds.length; i++) {
      const slotId = slotIds[i];
      const slotData = state.logoSlots?.[slotId];

      if (slotData && slotData.active && slotData.assetId) {
        const tile = await this.createAdTile(slotData.assetId, slotId);
        if (tile) {
          tile.style.gridRow = `${i + 1} / span 1`;
          container.appendChild(tile);
        }
      }
    }
  }

  /**
   * Create an ad tile element
   */
  async createAdTile(assetId, slotId) {
    const tile = document.createElement('div');
    tile.className = 'ad-tile';
    tile.dataset.slotId = slotId;
    tile.dataset.assetId = assetId;

    try {
      // Get object URL from cache or create new one
      let objectUrl = this.assetUrlCache.get(assetId);

      if (!objectUrl) {
        objectUrl = await dexieDB.getAssetObjectUrl(assetId);

        if (objectUrl) {
          this.assetUrlCache.set(assetId, objectUrl);
        }
      }

      if (objectUrl) {
        const img = document.createElement('img');
        img.src = objectUrl;
        img.alt = slotId;
        img.addEventListener('error', () => {
          console.error(`❌ Failed to load image for ${slotId} (assetId: ${assetId})`);
        });
        tile.appendChild(img);
      } else {
        console.warn(`⚠️ No object URL for ${slotId} (assetId: ${assetId})`);
        this.appendPlaceholder(tile, slotId);
      }
    } catch (error) {
      console.error(`❌ Error creating ad tile for ${slotId}:`, error);
      this.appendPlaceholder(tile, slotId);
    }

    return tile;
  }

  /**
   * Append placeholder text to a tile
   */
  appendPlaceholder(tile, slotId) {
    const titleEl = document.createElement('div');
    titleEl.className = 'ad-title ad-title--placeholder';
    titleEl.textContent = slotId;
    tile.appendChild(titleEl);
  }

  /**
   * Clear all children from a container
   */
  clearContainer(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  // ============================================================================
  // VIEWPORT SCALING
  // ============================================================================

  /**
   * Apply viewport scaling to fit OBS window
   * From legacy advertising_frame.js:applyViewportScale()
   */
  applyViewportScale() {
    const root = document.getElementById('frameRoot');
    if (!root) return;

    const vw = Math.max(1, document.documentElement.clientWidth || window.innerWidth || 1);
    const vh = Math.max(1, document.documentElement.clientHeight || window.innerHeight || 1);

    // Calculate scale to fit 1920x1080 frame into viewport
    const scale = Math.min(vw / 1920, vh / 1080);

    root.style.transform = `scale(${scale})`;

    // Center the frame
    const left = Math.max(0, Math.floor((vw - 1920 * scale) / 2));
    const top = Math.max(0, Math.floor((vh - 1080 * scale) / 2));

    root.style.left = `${left}px`;
    root.style.top = `${top}px`;

    console.log(`📐 Viewport scaled: ${scale.toFixed(3)}x (${vw}x${vh} → 1920x1080)`);
  }

  /**
   * Cleanup on unload
   */
  destroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }

    // Revoke all cached object URLs to prevent memory leaks
    for (const url of this.assetUrlCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.assetUrlCache.clear();
  }
}

// Initialize controller
const controller = new OverlayController();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  controller.destroy();
});

// Make available in console for debugging
window.advertisingOverlay = controller;

console.log('✅ OverlayController.js loaded');
