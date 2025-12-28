/**
 * AdController.js
 * Advertising module controller for master overlay ad zones
 *
 * Populates existing ad slots (T1-T6, L1-L3, R1-R3) in master overlay
 * Activates when modules.advertising.enabled = true
 *
 * Architecture:
 * - Master overlay ALWAYS has ad zones (topAdZone, leftAdZone, rightAdZone)
 * - This controller populates them when advertising module is purchased
 * - Ad slots remain empty/hidden when module is not enabled
 */

import { stateManager } from '../../core/state/StateManager.js';
import { messenger } from '../../core/messaging/BroadcastMessenger.js';
import { dexieDB } from '../../core/database/index.js';

class AdController {
  constructor() {
    this.stateSubscription = null;
    this.assetUrlCache = new Map(); // Cache object URLs to avoid memory leaks
    this.enabled = false;
    this.init();
  }

  /**
   * Initialize the controller
   */
  async init() {
    console.log('📢 Advertising Module initializing...');

    try {
      // Wait for StateManager to be ready
      await stateManager.init();

      // Check if advertising module is enabled
      const state = await stateManager.getState();
      this.enabled = state?.modules?.advertising?.enabled || false;

      if (!this.enabled) {
        console.log('ℹ️ Advertising module disabled - ad zones will remain empty');
        return;
      }

      console.log('✅ Advertising module ENABLED - activating ad zones');

      // Setup message listeners
      this.setupMessageListeners();

      // Setup reactive state subscription
      this.setupStateSubscription();

      // Initial render from state
      await this.renderAllSlots();

      // Apply initial background color
      const backgroundColor = state?.modules?.advertising?.backgroundColor;
      if (backgroundColor) {
        this.applyBackgroundColor(backgroundColor);
      }

      // Apply initial borders setting
      const showBorders = state?.modules?.advertising?.showBorders;
      if (showBorders !== undefined) {
        this.applyBorders(showBorders, backgroundColor);
      }

      // Apply initial dividers setting
      const showDividers = state?.modules?.advertising?.showDividers;
      if (showDividers !== undefined) {
        this.applyDividers(showDividers, backgroundColor);
      }

      console.log('✅ Advertising Module ready!');
    } catch (error) {
      console.error('❌ Advertising Module initialization failed:', error);
    }
  }

  /**
   * Setup reactive state subscription
   */
  setupStateSubscription() {
    this.stateSubscription = stateManager.subscribe((state) => {
      if (state) {
        console.log('📡 State update received, updating ad slots');
        this.renderAllSlots();
      }
    });
  }

  /**
   * Setup message listeners for BroadcastChannel
   */
  setupMessageListeners() {
    messenger.on('ADS_REFRESH', () => {
      console.log('📡 ADS_REFRESH message received');
      this.renderAllSlots();
    });

    messenger.on('LOGO_SLOT_CHANGED', (message) => {
      console.log('📡 LOGO_SLOT_CHANGED:', message.payload?.slotId);
      this.renderAllSlots();
    });

    messenger.on('ADS_BACKGROUND_CHANGED', async (message) => {
      console.log('📡 ADS_BACKGROUND_CHANGED:', message.payload?.backgroundColor);
      const backgroundColor = message.payload?.backgroundColor;
      this.applyBackgroundColor(backgroundColor);

      // Reapply borders and dividers with new contrasting color
      const state = await stateManager.getState();
      const showBorders = state?.modules?.advertising?.showBorders;
      const showDividers = state?.modules?.advertising?.showDividers;
      if (showBorders) {
        this.applyBorders(showBorders, backgroundColor);
      }
      if (showDividers) {
        this.applyDividers(showDividers, backgroundColor);
      }
    });

    messenger.on('ADS_BORDERS_CHANGED', async (message) => {
      console.log('📡 ADS_BORDERS_CHANGED:', message.payload?.showBorders);
      const state = await stateManager.getState();
      const backgroundColor = state?.modules?.advertising?.backgroundColor;
      this.applyBorders(message.payload?.showBorders, backgroundColor);
    });

    messenger.on('ADS_DIVIDERS_CHANGED', async (message) => {
      console.log('📡 ADS_DIVIDERS_CHANGED:', message.payload?.showDividers);
      const state = await stateManager.getState();
      const backgroundColor = state?.modules?.advertising?.backgroundColor;
      this.applyDividers(message.payload?.showDividers, backgroundColor);
    });
  }

  /**
   * Render all ad slots
   */
  async renderAllSlots() {
    const state = await stateManager.getState();
    if (!state) {
      console.warn('⚠️ No state available for rendering');
      return;
    }

    console.log('🎨 Rendering all ad slots...');

    // Apply region visibility
    await this.applyRegionVisibility(state);

    // Render each region
    await this.renderTopZone(state);
    await this.renderLeftZone(state);
    await this.renderRightZone(state);

    console.log('✅ All ad slots rendered');
  }

  /**
   * Apply region visibility based on state
   */
  async applyRegionVisibility(state) {
    // Get visibility from state (defaults to true if not set)
    const advertising = state.modules?.advertising || {};
    const showTop = advertising.showTop !== false;
    const showLeft = advertising.showLeft !== false;
    const showRight = advertising.showRight !== false;

    console.log('🔍 State advertising config:', advertising);
    console.log(`👁️ Calculated visibility: Top=${showTop}, Left=${showLeft}, Right=${showRight}`);

    // Get ad zone elements
    const topZone = document.getElementById('topAdZone');
    const leftZone = document.getElementById('leftAdZone');
    const rightZone = document.getElementById('rightAdZone');

    console.log('🔍 Found zones:', {
      topZone: !!topZone,
      leftZone: !!leftZone,
      rightZone: !!rightZone
    });

    // Show/hide zones
    if (topZone) {
      topZone.style.display = showTop ? '' : 'none';
      console.log('✅ Set topZone display to:', showTop ? 'visible' : 'none');
    }
    if (leftZone) {
      leftZone.style.display = showLeft ? '' : 'none';
      // Adjust top position based on whether top zone is visible
      // 125px = total height of top zone (117px content + 4px top + 4px bottom padding)
      leftZone.style.top = showTop ? '125px' : '0';
      console.log('✅ Set leftZone display to:', showLeft ? 'visible' : 'none');
    }
    if (rightZone) {
      rightZone.style.display = showRight ? '' : 'none';
      // Adjust top position based on whether top zone is visible
      // 125px = total height of top zone (117px content + 4px top + 4px bottom padding)
      rightZone.style.top = showTop ? '125px' : '0';
      console.log('✅ Set rightZone display to:', showRight ? 'visible' : 'none');
    }
  }

  /**
   * Render top zone (T1-T6)
   */
  async renderTopZone(state) {
    const slotIds = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

    for (const slotId of slotIds) {
      const slotEl = document.querySelector(`[data-slot="${slotId}"]`);
      if (!slotEl) continue;

      const slotData = state.logoSlots?.[slotId];
      await this.renderSlot(slotEl, slotId, slotData);
    }
  }

  /**
   * Render left zone (L1-L3)
   */
  async renderLeftZone(state) {
    const slotIds = ['L1', 'L2', 'L3'];

    for (const slotId of slotIds) {
      const slotEl = document.querySelector(`[data-slot="${slotId}"]`);
      if (!slotEl) continue;

      const slotData = state.logoSlots?.[slotId];
      await this.renderSlot(slotEl, slotId, slotData);
    }
  }

  /**
   * Render right zone (R1-R3)
   */
  async renderRightZone(state) {
    const slotIds = ['R1', 'R2', 'R3'];

    for (const slotId of slotIds) {
      const slotEl = document.querySelector(`[data-slot="${slotId}"]`);
      if (!slotEl) continue;

      const slotData = state.logoSlots?.[slotId];
      await this.renderSlot(slotEl, slotId, slotData);
    }
  }

  /**
   * Render individual ad slot
   */
  async renderSlot(slotEl, slotId, slotData) {
    // Clear existing content
    slotEl.innerHTML = '';

    // Get title (if any)
    const title = slotData?.title || '';
    const hasImage = slotData && slotData.active && slotData.assetId;
    const hasTitle = title.trim().length > 0;

    // If slot is not active and has no title, leave empty
    if (!slotData || (!slotData.active && !hasTitle)) {
      slotEl.classList.remove('ad-slot--active');
      // Reset span to default
      slotEl.style.gridColumn = '';
      slotEl.style.gridRow = '';
      return;
    }

    // Get span value (default to 1 if not set)
    const span = Math.max(1, Math.min(3, parseInt(slotData.span) || 1));

    // Determine region from slotId (T1-T6 = top, L1-L3 = left, R1-R3 = right)
    const region = slotId[0]; // 'T', 'L', or 'R'

    // Apply grid span based on region
    if (region === 'T') {
      // Top zone: span columns
      slotEl.style.gridColumn = `span ${span}`;
      slotEl.style.gridRow = '';
    } else {
      // Left/Right zones: span rows
      slotEl.style.gridRow = `span ${span}`;
      slotEl.style.gridColumn = '';
    }

    console.log(`📐 Rendering ${slotId} with span ${span} (region: ${region}), hasImage: ${hasImage}, hasTitle: ${hasTitle}`);

    // Case 1: Only title, no image
    if (!hasImage && hasTitle) {
      const titleEl = document.createElement('div');
      titleEl.textContent = title;
      titleEl.style.width = '100%';
      titleEl.style.height = '100%';
      titleEl.style.display = 'flex';
      titleEl.style.alignItems = 'center';
      titleEl.style.justifyContent = 'center';
      titleEl.style.fontSize = '14px';
      titleEl.style.fontWeight = '600';
      titleEl.style.color = '#fff';
      titleEl.style.textAlign = 'center';
      titleEl.style.padding = '8px';
      titleEl.style.wordWrap = 'break-word';
      slotEl.appendChild(titleEl);
      slotEl.classList.add('ad-slot--active');
      return;
    }

    // Case 2 & 3: Has image (with or without title)
    if (hasImage) {
      try {
        // Get object URL from cache or create new one
        let objectUrl = this.assetUrlCache.get(slotData.assetId);

        if (!objectUrl) {
          objectUrl = await dexieDB.getAssetObjectUrl(slotData.assetId);

          if (objectUrl) {
            this.assetUrlCache.set(slotData.assetId, objectUrl);
          }
        }

        if (objectUrl) {
          // Create container for image and title
          const container = document.createElement('div');
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';

          // Create image
          const img = document.createElement('img');
          img.src = objectUrl;
          img.alt = slotId;
          img.style.width = '100%';
          img.style.objectFit = 'contain';

          // If there's a title, resize image to make room
          if (hasTitle) {
            img.style.height = 'calc(100% - 20px)'; // Reserve 20px for title
            img.style.flex = '1 1 auto';
          } else {
            img.style.height = '100%';
          }

          img.addEventListener('error', () => {
            console.error(`❌ Failed to load image for ${slotId} (assetId: ${slotData.assetId})`);
          });

          container.appendChild(img);

          // Add title if present
          if (hasTitle) {
            const titleEl = document.createElement('div');
            titleEl.textContent = title;
            titleEl.style.width = '100%';
            titleEl.style.fontSize = '11px';
            titleEl.style.fontWeight = '600';
            titleEl.style.color = '#fff';
            titleEl.style.textAlign = 'center';
            titleEl.style.padding = '2px 4px';
            titleEl.style.whiteSpace = 'nowrap';
            titleEl.style.overflow = 'hidden';
            titleEl.style.textOverflow = 'ellipsis';
            titleEl.style.flexShrink = '0';
            container.appendChild(titleEl);
          }

          slotEl.appendChild(container);
          slotEl.classList.add('ad-slot--active');
        } else {
          console.warn(`⚠️ No object URL for ${slotId} (assetId: ${slotData.assetId})`);
        }
      } catch (error) {
        console.error(`❌ Error rendering slot ${slotId}:`, error);
      }
    }
  }

  /**
   * Apply background color to ad zones
   */
  applyBackgroundColor(color) {
    const topZone = document.getElementById('topAdZone');
    const leftZone = document.getElementById('leftAdZone');
    const rightZone = document.getElementById('rightAdZone');

    console.log('🎨 Applying background color to ad zones:', color);

    if (topZone) {
      topZone.style.backgroundColor = color;
    }
    if (leftZone) {
      leftZone.style.backgroundColor = color;
    }
    if (rightZone) {
      rightZone.style.backgroundColor = color;
    }

    // Store current background color for dividers
    this.currentBackgroundColor = color;
  }

  /**
   * Apply borders to ad slots
   */
  applyBorders(showBorders, backgroundColor) {
    const bgColor = backgroundColor || this.currentBackgroundColor;
    const contrastColor = this.getContrastColor(bgColor);

    console.log('🔲 Applying borders:', showBorders, 'Contrast color:', contrastColor);

    // Get all ad slots
    const slots = document.querySelectorAll('.ad-slot');

    slots.forEach(slot => {
      if (showBorders) {
        slot.style.border = `1px solid ${contrastColor}`;
      } else {
        slot.style.border = 'none';
      }
    });
  }

  /**
   * Apply dividers (80% tall lines between slots)
   */
  applyDividers(showDividers, backgroundColor) {
    const bgColor = backgroundColor || this.currentBackgroundColor;
    const contrastColor = this.getContrastColor(bgColor);

    console.log('📏 Applying dividers:', showDividers, 'Contrast color:', contrastColor);

    // Get ad zone elements
    const topZone = document.getElementById('topAdZone');
    const leftZone = document.getElementById('leftAdZone');
    const rightZone = document.getElementById('rightAdZone');

    // Remove existing dividers
    document.querySelectorAll('.ad-divider').forEach(el => el.remove());

    if (!showDividers) {
      return;
    }

    // Create dividers for top zone (5 vertical dividers between 6 columns)
    if (topZone) {
      for (let i = 1; i <= 5; i++) {
        const divider = document.createElement('div');
        divider.className = 'ad-divider';
        divider.style.position = 'absolute';
        divider.style.left = `${(i / 6) * 100}%`;
        divider.style.top = '10%'; // Center vertically (10% margin top + bottom = 80% height)
        divider.style.width = '1px';
        divider.style.height = '80%';
        divider.style.backgroundColor = contrastColor;
        divider.style.pointerEvents = 'none';
        topZone.appendChild(divider);
      }
    }

    // Create dividers for left zone (2 horizontal dividers between 3 rows)
    if (leftZone) {
      for (let i = 1; i <= 2; i++) {
        const divider = document.createElement('div');
        divider.className = 'ad-divider';
        divider.style.position = 'absolute';
        divider.style.top = `${(i / 3) * 100}%`;
        divider.style.left = '10%'; // Center horizontally (10% margin left + right = 80% width)
        divider.style.height = '1px';
        divider.style.width = '80%';
        divider.style.backgroundColor = contrastColor;
        divider.style.pointerEvents = 'none';
        leftZone.appendChild(divider);
      }
    }

    // Create dividers for right zone (2 horizontal dividers between 3 rows)
    if (rightZone) {
      for (let i = 1; i <= 2; i++) {
        const divider = document.createElement('div');
        divider.className = 'ad-divider';
        divider.style.position = 'absolute';
        divider.style.top = `${(i / 3) * 100}%`;
        divider.style.left = '10%'; // Center horizontally (10% margin left + right = 80% width)
        divider.style.height = '1px';
        divider.style.width = '80%';
        divider.style.backgroundColor = contrastColor;
        divider.style.pointerEvents = 'none';
        rightZone.appendChild(divider);
      }
    }
  }

  /**
   * Calculate contrasting color (black or white) based on background brightness
   */
  getContrastColor(color) {
    if (!color) return 'rgba(255, 255, 255, 0.3)';

    // Parse rgba/rgb color
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return 'rgba(255, 255, 255, 0.3)';

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5
      ? 'rgba(0, 0, 0, 0.4)'
      : 'rgba(255, 255, 255, 0.3)';
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
const adController = new AdController();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  adController.destroy();
});

// Make available in console for debugging
window.adController = adController;

export default adController;

console.log('✅ AdController.js loaded');
