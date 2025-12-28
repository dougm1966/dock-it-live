/**
 * SkinManager.js
 * Universal skin loader and switcher for Dock-It.live overlay system
 *
 * Architecture: Each skin is a COMPLETE CSS file containing both layout and visuals
 * - Skins can have completely different layouts (fullwidth, sidebar, compact, etc.)
 * - SkinManager swaps ONE CSS file at a time
 * - No base CSS, no separation of structural/visual - full flexibility per skin
 *
 * Manages:
 * - Loading skin registry from JSON
 * - Swapping skin CSS at runtime via BroadcastChannel messages
 * - Integration with StateManager for persistence
 *
 * Follows THE LAW #3: Modern ES6 module
 * Database-first pattern: skin preference stored in IndexedDB
 */

import { stateManager } from '../state/StateManager.js';

class SkinManager {
  constructor() {
    this.currentSkin = null;
    this.skinLink = null;
    this.registry = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the skin manager
   * Loads registry and gets reference to skin <link> element
   */
  async init() {
    if (this.isInitialized) {
      console.warn('⚠️ SkinManager already initialized');
      return;
    }

    console.log('🎨 SkinManager initializing...');

    try {
      // Load skin registry
      await this.loadRegistry();

      // Get reference to skin link element (created in HTML)
      this.skinLink = document.getElementById('overlay-skin-link');

      if (!this.skinLink) {
        console.error('❌ overlay-skin-link element not found in HTML!');
        return;
      }

      // Load initial skin from state
      const state = await stateManager.getState();
      const skinName = state?.uiSettings?.overlaySkin || 'default';
      await this.loadSkin(skinName);

      this.isInitialized = true;
      console.log('✅ SkinManager ready!');
    } catch (error) {
      console.error('❌ SkinManager initialization failed:', error);
      // Fallback to default skin on error
      await this.loadSkin('default');
    }
  }

  /**
   * Load skin registry from JSON
   */
  async loadRegistry() {
    try {
      const response = await fetch('/src/core/skins/skins.registry.json');
      if (!response.ok) {
        throw new Error(`Failed to load registry: ${response.status}`);
      }
      this.registry = await response.json();
      console.log(`✅ Loaded ${this.registry.skins.length} skins from registry`);
    } catch (error) {
      console.error('❌ Failed to load skin registry:', error);
      // Fallback to minimal registry
      this.registry = {
        skins: [
          {
            id: 'default',
            name: 'Default Fullwidth',
            description: 'Classic PCPL steelblue gradient theme with fullwidth scoreboard',
            author: 'PCPL',
            version: '1.0.0'
          }
        ]
      };
    }
  }

  /**
   * Load a skin by name
   * Swaps the CSS file href to load the new skin
   * @param {string} skinName - Skin ID to load
   */
  async loadSkin(skinName) {
    if (!skinName) {
      console.warn('⚠️ No skin name provided, using default');
      skinName = 'default';
    }

    const metadata = this.getSkinMetadata(skinName);
    if (!metadata) {
      console.warn(`⚠️ Skin not found: "${skinName}", falling back to default`);
      skinName = 'default';
      // Try to get default metadata
      const defaultMetadata = this.getSkinMetadata('default');
      if (!defaultMetadata) {
        console.error('❌ Default skin not found in registry!');
        return;
      }
    }

    // Construct path to skin CSS file
    // Each skin is a COMPLETE CSS file: layout + visuals + animations
    const skinPath = `/src/modules/overlay/skins/${skinName}/${skinName}.css`;

    // Update link href (triggers browser to load new CSS)
    if (this.skinLink) {
      this.skinLink.href = skinPath;
      this.currentSkin = skinName;
      console.log(`✅ Skin loaded: "${skinName}"`);
      console.log(`   CSS: ${skinPath}`);
    } else {
      console.error('❌ skinLink element not found - cannot load skin');
    }
  }

  /**
   * Apply a skin (persist to database + broadcast)
   * This is called by the control panel when user changes theme
   * @param {string} skinName - Skin ID to apply
   */
  async applySkin(skinName) {
    if (!skinName) {
      console.warn('⚠️ No skin name provided for applySkin');
      return;
    }

    try {
      // Update state (persists to IndexedDB + broadcasts THEME_CHANGED)
      await stateManager.setValue('uiSettings.overlaySkin', skinName);

      // Load the skin locally
      await this.loadSkin(skinName);

      console.log(`✅ Skin applied and persisted: "${skinName}"`);
    } catch (error) {
      console.error(`❌ Failed to apply skin "${skinName}":`, error);
    }
  }

  /**
   * Get skin metadata from registry
   * @param {string} skinName - Skin ID
   * @returns {Object|null} Skin metadata or null if not found
   */
  getSkinMetadata(skinName) {
    if (!this.registry || !this.registry.skins) {
      console.warn('⚠️ Registry not loaded yet');
      return null;
    }

    return this.registry.skins.find(s => s.id === skinName) || null;
  }

  /**
   * Get all available skins
   * @returns {Array} Array of skin metadata objects
   */
  listAvailableSkins() {
    if (!this.registry || !this.registry.skins) {
      console.warn('⚠️ Registry not loaded yet');
      return [];
    }

    return this.registry.skins.map(skin => ({
      id: skin.id,
      name: skin.name,
      description: skin.description,
      author: skin.author,
      version: skin.version
    }));
  }

  /**
   * Get currently loaded skin name
   * @returns {string|null}
   */
  getCurrentSkin() {
    return this.currentSkin;
  }

  /**
   * Check if manager is initialized
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized;
  }
}

// Export singleton instance
export const skinManager = new SkinManager();

// Make available in console for debugging
if (typeof window !== 'undefined') {
  window.skinManager = skinManager;
}

console.log('✅ SkinManager.js loaded');
