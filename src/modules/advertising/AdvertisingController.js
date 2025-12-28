/**
 * AdvertisingController.js
 * Modern ES6 controller for the Advertising module (Premium add-on)
 *
 * Manages 12 ad slots: T1-T6 (Top), L1-L3 (Left), R1-R3 (Right)
 * Features: Upload, Span, Frame, Show/Hide, Title, Color Picker, Image Library
 */

import { stateManager } from '../../core/state/StateManager.js';
import { AssetUploader } from '../../core/ads/AssetUploader.js';
import { messenger } from '../../core/messaging/BroadcastMessenger.js';
import { dexieDB } from '../../core/database/index.js';

class AdvertisingController {
  constructor() {
    this.adSlots = {}; // Track ad slot states
    this.stateSubscription = null;
    this.currentDeleteTarget = null; // For delete confirmation modal
    this.currentSlot = null; // Track current slot for image picker
    this.init();
  }

  /**
   * Initialize the advertising module
   */
  async init() {
    console.log('📢 Advertising Module initializing...');

    try {
      // Initialize StateManager
      await stateManager.init();
      console.log('✅ StateManager ready');

      // Setup all event listeners
      this.setupAdControls();
      this.setupSettingsControls();
      this.setupModalControls();

      // Setup reactive state subscription
      this.setupStateSubscription();

      // Initial UI render from state
      await this.renderFromState();

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
        this.updateUIFromState(state);
      }
    });
  }

  /**
   * Setup advertising controls (12 ad slots: T1-T6, L1-L3, R1-R3)
   */
  setupAdControls() {
    // Top ads (T1-T6)
    for (let i = 1; i <= 6; i++) {
      this.setupAdSlot('top', i);
    }

    // Left ads (L1-L3)
    for (let i = 1; i <= 3; i++) {
      this.setupAdSlot('left', i);
    }

    // Right ads (R1-R3)
    for (let i = 1; i <= 3; i++) {
      this.setupAdSlot('right', i);
    }

    // Ads tab button
    document.getElementById('adsTabAds')?.addEventListener('click', () => {
      this.switchToTab('ads');
    });

    // Settings tab button
    document.getElementById('adsTabSettings')?.addEventListener('click', () => {
      this.switchToTab('settings');
    });

    // Frame background color button
    document.getElementById('adsFrameBgOpen')?.addEventListener('click', () => {
      this.openFrameBgModal();
    });
  }

  /**
   * Setup a single ad slot
   */
  setupAdSlot(region, index) {
    const prefix = `ad${this.capitalize(region)}${index}`;
    const slotId = `${region.charAt(0).toUpperCase()}${index}`; // T1, L1, R1, etc.

    // Upload button - now opens image picker modal
    const uploadBtn = document.getElementById(`triggerAd${this.capitalize(region)}${index}`);

    uploadBtn?.addEventListener('click', () => {
      this.currentSlot = { slotId, region, index };
      this.openImagePickerModal();
    });

    // Legacy file input (kept for compatibility but not primary method)
    const fileInput = document.getElementById(`FileUploadAd${this.capitalize(region)}${index}`);
    fileInput?.addEventListener('change', async (e) => {
      await this.handleAdUpload(slotId, e.target.files[0], region, index);
    });

    // Span selector
    const spanSelect = document.getElementById(`${prefix}Span`);
    console.log(`Setting up span selector for ${slotId}:`, spanSelect ? 'Found' : 'NOT FOUND', `ID: ${prefix}Span`);
    spanSelect?.addEventListener('change', (e) => {
      console.log(`Span changed for ${slotId} to:`, e.target.value);
      this.setAdSpan(slotId, parseInt(e.target.value));
    });

    // Frame checkbox
    document.getElementById(`${prefix}Frame`)?.addEventListener('change', (e) => {
      this.setAdFrame(slotId, e.target.checked);
    });

    // Show checkbox
    document.getElementById(`${prefix}Show`)?.addEventListener('change', (e) => {
      this.setAdShow(slotId, e.target.checked);
    });

    // Title input
    document.getElementById(`${prefix}Title`)?.addEventListener('input', (e) => {
      this.setAdTitle(slotId, e.target.value);
    });

    // Delete button
    const deleteBtn = document.querySelector(`#${prefix}Preview .ad-preview__delete`);
    deleteBtn?.addEventListener('click', () => {
      this.confirmDeleteAd(slotId, region, index);
    });
  }

  /**
   * Setup settings controls
   */
  setupSettingsControls() {
    // Master region toggles (in Settings tab)
    document.getElementById('adsShowTopChk')?.addEventListener('change', (e) => {
      console.log('🔵 Show top ads:', e.target.checked);
      this.toggleAdRegion('top', e.target.checked);
      this.updateAdRowsVisibility();
      this.updateMinimap();
    });

    document.getElementById('adsShowLeftChk')?.addEventListener('change', (e) => {
      console.log('🔵 Show left ads:', e.target.checked);
      this.toggleAdRegion('left', e.target.checked);
      this.updateAdRowsVisibility();
      this.updateMinimap();
    });

    document.getElementById('adsShowRightChk')?.addEventListener('change', (e) => {
      console.log('🔵 Show right ads:', e.target.checked);
      this.toggleAdRegion('right', e.target.checked);
      this.updateAdRowsVisibility();
      this.updateMinimap();
    });

    // Show borders checkbox (mutually exclusive with dividers)
    document.getElementById('adsShowBordersChk')?.addEventListener('change', async (e) => {
      const showBorders = e.target.checked;
      console.log('🔲 Show borders:', showBorders);

      // If borders are being enabled, disable dividers
      if (showBorders) {
        const dividersChk = document.getElementById('adsShowDividersChk');
        if (dividersChk) dividersChk.checked = false;
        await stateManager.setValue('modules.advertising.showDividers', false);
        messenger.send('ADS_DIVIDERS_CHANGED', { showDividers: false });
      }

      await stateManager.setValue('modules.advertising.showBorders', showBorders);
      messenger.send('ADS_BORDERS_CHANGED', { showBorders });
    });

    // Show dividers checkbox (mutually exclusive with borders)
    document.getElementById('adsShowDividersChk')?.addEventListener('change', async (e) => {
      const showDividers = e.target.checked;
      console.log('📏 Show dividers:', showDividers);

      // If dividers are being enabled, disable borders
      if (showDividers) {
        const bordersChk = document.getElementById('adsShowBordersChk');
        if (bordersChk) bordersChk.checked = false;
        await stateManager.setValue('modules.advertising.showBorders', false);
        messenger.send('ADS_BORDERS_CHANGED', { showBorders: false });
      }

      await stateManager.setValue('modules.advertising.showDividers', showDividers);
      messenger.send('ADS_DIVIDERS_CHANGED', { showDividers });
    });

    // Initial visibility update
    this.updateAdRowsVisibility();
  }

  /**
   * Setup modal controls
   */
  setupModalControls() {
    // Frame background modal controls
    document.getElementById('adsFrameBgClose')?.addEventListener('click', () => {
      this.closeFrameBgModal();
    });

    // Close on backdrop click
    document.getElementById('adsFrameBgModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'adsFrameBgModal') {
        this.closeFrameBgModal();
      }
    });

    // Color picker canvas and sliders
    this.initColorPicker();

    // Hue slider
    document.getElementById('adsColorHue')?.addEventListener('input', () => {
      this.updateColorFromSliders();
    });

    // Alpha/transparency slider
    document.getElementById('adsColorAlpha')?.addEventListener('input', () => {
      this.updateColorFromSliders();
    });

    // Image picker modal controls
    document.getElementById('adsImagePickerClose')?.addEventListener('click', () => {
      this.closeImagePickerModal();
    });

    document.getElementById('adsImagePickerCancel')?.addEventListener('click', () => {
      this.closeImagePickerModal();
    });

    document.getElementById('adsPickUploadNew')?.addEventListener('click', () => {
      document.getElementById('adsImagePickerFile')?.click();
    });

    // Close on backdrop click
    document.getElementById('adsImagePickerModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'adsImagePickerModal') {
        this.closeImagePickerModal();
      }
    });

    // Bulk image upload handler
    document.getElementById('adsImagePickerFile')?.addEventListener('change', async (e) => {
      await this.handleBulkImageUpload(e);
    });

    // Delete confirmation modal controls
    document.getElementById('adsDeleteConfirmClose')?.addEventListener('click', () => {
      this.closeDeleteConfirmModal();
    });

    document.getElementById('adsConfirmDeleteBtn')?.addEventListener('click', () => {
      this.executeDelete();
    });

    document.getElementById('adsConfirmCancelBtn')?.addEventListener('click', () => {
      this.closeDeleteConfirmModal();
    });

    // Close modals on backdrop click
    document.getElementById('adsDeleteConfirmModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'adsDeleteConfirmModal') {
        this.closeDeleteConfirmModal();
      }
    });
  }

  // ============================================================================
  // AD SLOT HANDLING
  // ============================================================================

  async handleAdUpload(slotId, file, region, index) {
    if (!file) return;

    try {
      const result = await AssetUploader.upload(file, {
        type: 'advertisement',
        tags: [slotId, region]
      });

      if (result.success) {
        // Map to logo slot (T1-T6, L1-L3, R1-R3)
        await stateManager.setLogoSlot(slotId, result.id);
        await stateManager.setLogoSlotActive(slotId, true);

        // Update UI preview
        const prefix = `ad${this.capitalize(region)}${index}`;
        const preview = document.getElementById(`${prefix}Preview`);
        const img = document.getElementById(`${prefix}Img`);

        if (preview && img && result.asset && result.asset.data) {
          const objectUrl = await dexieDB.getAssetObjectUrl(result.id);
          img.src = objectUrl;
          preview.classList.remove('noShow');
        }

        // Broadcast refresh message
        messenger.send('LOGO_SLOT_CHANGED', { slotId });

        console.log(`✅ Ad uploaded to ${slotId}:`, result.id);
      } else {
        alert(`Ad upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`Ad upload error for ${slotId}:`, error);
      alert('Ad upload failed. Check console for details.');
    }
  }

  confirmDeleteAd(slotId, region, index) {
    this.currentDeleteTarget = { slotId, region, index };
    this.openDeleteConfirmModal();
  }

  async executeDelete() {
    if (!this.currentDeleteTarget) return;

    const { type } = this.currentDeleteTarget;

    try {
      if (type === 'asset') {
        // Deleting from library (image picker modal)
        await this.executeAssetDelete();
      } else {
        // Deleting from ad slot
        await this.executeSlotDelete();
      }
    } catch (error) {
      console.error('❌ Delete failed:', error);
    } finally {
      this.closeDeleteConfirmModal();
    }
  }

  /**
   * Delete an asset from the library
   */
  async executeAssetDelete() {
    const { assetId, filename } = this.currentDeleteTarget;

    try {
      // Get all slots using this asset and clear them
      const state = await stateManager.getState();
      const logoSlots = state?.logoSlots || {};

      for (const [slotId, slotData] of Object.entries(logoSlots)) {
        if (slotData.assetId === assetId) {
          await stateManager.setLogoSlot(slotId, null);
          await stateManager.setLogoSlotActive(slotId, false);
          console.log(`🔄 Cleared ${slotId} (was using deleted asset)`);
        }
      }

      // Delete the asset from database
      await dexieDB.deleteAsset(assetId);

      // Refresh the library
      await this.loadImageLibrary();

      // Refresh all ad previews
      await this.renderFromState();

      // Broadcast refresh to overlay
      messenger.send('ADS_REFRESH');

      console.log(`✅ Asset "${filename}" deleted from library`);
    } catch (error) {
      console.error(`❌ Failed to delete asset:`, error);
      throw error;
    }
  }

  /**
   * Delete an ad from a specific slot
   */
  async executeSlotDelete() {
    const { slotId, region, index } = this.currentDeleteTarget;

    try {
      const state = await stateManager.getState();
      const assetId = state?.logoSlots?.[slotId]?.assetId;

      if (assetId) {
        // Note: We do NOT delete the asset from library here
        // We only clear it from this slot
        // To delete from library, user must use the image picker modal
      }

      await stateManager.setLogoSlot(slotId, null);
      await stateManager.setLogoSlotActive(slotId, false);

      // Update UI
      const prefix = `ad${this.capitalize(region)}${index}`;
      const preview = document.getElementById(`${prefix}Preview`);
      const img = document.getElementById(`${prefix}Img`);
      const dimsActual = document.getElementById(`${prefix}DimsActual`);

      if (preview && img) {
        img.src = '';
        preview.classList.add('noShow');
      }

      // Clear actual dimensions
      if (dimsActual) {
        dimsActual.textContent = '';
      }

      // Broadcast refresh message
      messenger.send('LOGO_SLOT_CHANGED', { slotId });

      console.log(`✅ Ad cleared from ${slotId}`);
    } catch (error) {
      console.error(`❌ Delete ad error for ${slotId}:`, error);
      throw error;
    }
  }

  async setAdSpan(slotId, span) {
    console.log(`🎯 setAdSpan called - slotId: ${slotId}, span: ${span}`);

    const region = slotId[0]; // 'T', 'L', or 'R'
    const slotNum = parseInt(slotId[1]);
    const regionName = region === 'T' ? 'top' : region === 'L' ? 'left' : 'right';

    // Clamp span to valid range (1-3)
    const validSpan = Math.max(1, Math.min(3, parseInt(span) || 1));

    // Store span in logo slot metadata
    await stateManager.setLogoSlotMetadata(slotId, { span: validSpan });

    // Update expected dimensions display
    this.updateExpectedDimensions(slotId, regionName, validSpan);

    // Recalculate which slots are blocked based on ALL spans in this region
    await this.recalculateRegionBlocking(regionName);

    // Broadcast change to overlay
    messenger.send('LOGO_SLOT_CHANGED', { slotId, span: validSpan });

    console.log(`✅ Span set to ${validSpan} for ${slotId}`);
  }

  async setAdFrame(slotId, hasFrame) {
    console.log(`🖼️ Ad ${slotId} frame:`, hasFrame);
    await stateManager.setLogoSlotMetadata(slotId, { frame: hasFrame });
    messenger.send('LOGO_SLOT_CHANGED', { slotId, frame: hasFrame });
  }

  setAdShow(slotId, show) {
    stateManager.setLogoSlotActive(slotId, show);
    messenger.send('LOGO_SLOT_CHANGED', { slotId, active: show });
    console.log(`Ad ${slotId} visibility:`, show);
  }

  async setAdTitle(slotId, title) {
    console.log(`📝 Ad ${slotId} title:`, title);
    await stateManager.setLogoSlotMetadata(slotId, { title });
    messenger.send('LOGO_SLOT_CHANGED', { slotId, title });
  }

  /**
   * Update expected dimensions display based on span
   */
  updateExpectedDimensions(slotId, regionName, span) {
    const slotNum = slotId[1];
    const prefix = `ad${this.capitalize(regionName)}${slotNum}`;
    const uploadBtn = document.getElementById(`triggerAd${this.capitalize(regionName)}${slotNum}`);
    const container = uploadBtn?.closest('.ads-row');
    const dimsEl = container?.querySelector('.ads-dims');

    let dimensions = '';
    if (regionName === 'top') {
      dimensions = `${320 * span}×180`; // Legacy format: 320×180, 640×180, 960×180
    } else {
      dimensions = `320×${360 * span}`; // Legacy format: 320×360, 320×720, 320×1080
    }

    if (dimsEl) {
      dimsEl.textContent = dimensions;
    }
  }

  /**
   * Recalculate which slots are blocked based on all spans in the region
   * This matches the legacy adsNormalizePlacementPositions logic
   */
  async recalculateRegionBlocking(regionName) {
    const maxSlots = regionName === 'top' ? 6 : 3;
    const regionLetter = regionName === 'top' ? 'T' : regionName === 'left' ? 'L' : 'R';
    const isSidePanel = maxSlots === 3; // Left or right panel

    // Get all spans for this region from state
    const state = await stateManager.getState();
    const covered = new Array(maxSlots + 1).fill(false);

    // For side panels with span 3, check if any slot has span 3
    let hasFullSpan = false;
    let fullSpanSlot = null;
    if (isSidePanel) {
      for (let i = 1; i <= maxSlots; i++) {
        const slotId = `${regionLetter}${i}`;
        const slotData = state?.logoSlots?.[slotId];
        const span = Math.max(1, Math.min(3, parseInt(slotData?.span) || 1));
        const isActive = slotData?.active !== false;
        if (isActive && span === 3) {
          hasFullSpan = true;
          fullSpanSlot = i;
          break;
        }
      }
    }

    // If side panel has a slot with span 3, block all other slots
    if (hasFullSpan) {
      for (let i = 1; i <= maxSlots; i++) {
        if (i === fullSpanSlot) {
          this.setSlotBlocked(regionName, i, false); // Anchor slot is not blocked
        } else {
          this.setSlotBlocked(regionName, i, true); // All other slots blocked
        }
      }
      return;
    }

    // Calculate which positions are covered by spans (normal logic)
    for (let i = 1; i <= maxSlots; i++) {
      const slotId = `${regionLetter}${i}`;
      const slotData = state?.logoSlots?.[slotId];
      const span = Math.max(1, Math.min(3, parseInt(slotData?.span) || 1));
      const isActive = slotData?.active !== false;

      if (isActive && !covered[i]) {
        // Mark this slot and subsequent slots as covered
        for (let j = i; j < i + span && j <= maxSlots; j++) {
          covered[j] = true;
        }
        // Unblock the anchor slot
        this.setSlotBlocked(regionName, i, false);
      } else if (covered[i]) {
        // This slot is covered by a previous span
        this.setSlotBlocked(regionName, i, true);
      } else {
        // Not covered
        this.setSlotBlocked(regionName, i, false);
      }
    }
  }

  /**
   * Set a slot's blocked state (enable/disable controls, gray out)
   */
  setSlotBlocked(regionName, index, blocked) {
    const prefix = `ad${this.capitalize(regionName)}${index}`;
    const uploadBtn = document.getElementById(`triggerAd${this.capitalize(regionName)}${index}`);
    const container = uploadBtn?.closest('.ads-row');

    if (!container) return;

    if (blocked) {
      container.style.opacity = '0.4';
      container.style.pointerEvents = 'none';
      const inputs = container.querySelectorAll('input, select, button');
      inputs.forEach(input => input.disabled = true);
    } else {
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
      const inputs = container.querySelectorAll('input, select, button');
      inputs.forEach(input => input.disabled = false);
    }
  }

  async toggleAdRegion(region, show) {
    // Persist region visibility to StateManager (triggers overlay update via ADS_REFRESH message)
    await stateManager.setAdRegionVisibility(region, show);
    console.log(`✅ Region ${region} visibility saved to state: ${show}`);

    // Also toggle individual slot visibility for consistency
    const ranges = {
      top: { start: 1, end: 6 },
      left: { start: 1, end: 3 },
      right: { start: 1, end: 3 }
    };

    const range = ranges[region];
    if (!range) return;

    for (let i = range.start; i <= range.end; i++) {
      const slotId = `${region.charAt(0).toUpperCase()}${i}`;
      this.setAdShow(slotId, show);
    }
  }

  /**
   * Switch between Ads and Settings tabs
   */
  switchToTab(tab) {
    const adsPanel = document.getElementById('adsPanelAds');
    const settingsPanel = document.getElementById('adsPanelSettings');
    const adsBtn = document.getElementById('adsTabAds');
    const settingsBtn = document.getElementById('adsTabSettings');

    if (tab === 'settings') {
      // Show settings, hide ads
      adsPanel?.classList.add('noShow');
      settingsPanel?.classList.remove('noShow');

      // Update button styles
      adsBtn?.classList.remove('btn--primary');
      settingsBtn?.classList.add('btn--primary');

      console.log('📋 Switched to Settings tab');
    } else {
      // Show ads, hide settings
      adsPanel?.classList.remove('noShow');
      settingsPanel?.classList.add('noShow');

      // Update button styles
      adsBtn?.classList.add('btn--primary');
      settingsBtn?.classList.remove('btn--primary');

      // Refresh ads when switching back to ads tab
      this.refreshAds();

      console.log('📢 Switched to Ads tab');
    }
  }

  refreshAds() {
    console.log('Refreshing ads...');
    messenger.send('ADS_REFRESH', {});
  }

  // ============================================================================
  // MODALS
  // ============================================================================

  async openFrameBgModal() {
    const modal = document.getElementById('adsFrameBgModal');
    if (modal) {
      modal.classList.remove('noShow');
      modal.style.display = ''; // Remove inline display:none
      document.body.classList.add('ads-modal-open');

      // Load saved color from state
      await this.loadSavedColor();
    }
  }

  async loadSavedColor() {
    try {
      const state = await stateManager.getState();
      const savedColor = state?.modules?.advertising?.backgroundColor;

      if (savedColor) {
        // Parse the saved rgba color and convert to HSV for the picker
        const rgbaMatch = savedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
          const r = parseInt(rgbaMatch[1]) / 255;
          const g = parseInt(rgbaMatch[2]) / 255;
          const b = parseInt(rgbaMatch[3]) / 255;
          const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

          // Convert RGB to HSV
          const hsv = this.rgbToHsv(r, g, b);

          // Update color picker state
          this.colorPicker.hue = hsv.h;
          this.colorPicker.saturation = hsv.s;
          this.colorPicker.value = hsv.v;
          this.colorPicker.alpha = a;

          // Update sliders
          const hueSlider = document.getElementById('adsColorHue');
          const alphaSlider = document.getElementById('adsColorAlpha');
          if (hueSlider) hueSlider.value = hsv.h;
          // Invert alpha to transparency (alpha 1.0 = 0% transparency, alpha 0.0 = 100% transparency)
          if (alphaSlider) alphaSlider.value = Math.round((1 - a) * 100);

          // Redraw canvas and update display
          this.drawColorCanvas();
          this.updateBackgroundColor();

          console.log('📖 Loaded saved color:', savedColor);
        }
      }
    } catch (error) {
      console.error('Failed to load saved color:', error);
    }
  }

  async closeFrameBgModal() {
    const modal = document.getElementById('adsFrameBgModal');
    if (modal) {
      modal.classList.add('noShow');
      modal.style.display = 'none';
      document.body.classList.remove('ads-modal-open');

      // Save the selected color to state
      await this.saveBackgroundColor();
    }
  }

  async saveBackgroundColor() {
    // Convert HSV to RGB
    const h = this.colorPicker.hue;
    const s = this.colorPicker.saturation;
    const v = this.colorPicker.value;
    const a = this.colorPicker.alpha;

    const rgb = this.hsvToRgb(h, s, v);
    const color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

    // Save to state
    await stateManager.setValue('modules.advertising.backgroundColor', color);

    // Broadcast change to overlay
    messenger.send('ADS_BACKGROUND_CHANGED', { backgroundColor: color });

    console.log('✅ Background color saved:', color);
  }

  openImagePickerModal() {
    const modal = document.getElementById('adsImagePickerModal');
    if (modal) {
      modal.classList.remove('noShow');
      modal.style.display = ''; // Remove inline display:none
      document.body.classList.add('ads-modal-open');
      this.loadImageLibrary();
    }
  }

  closeImagePickerModal() {
    const modal = document.getElementById('adsImagePickerModal');
    if (modal) {
      modal.classList.add('noShow');
      modal.style.display = 'none';
      document.body.classList.remove('ads-modal-open');
    }
    this.currentSlot = null; // Clear slot context
  }

  openDeleteConfirmModal() {
    const modal = document.getElementById('adsDeleteConfirmModal');
    if (modal) {
      modal.classList.remove('noShow');
      modal.style.display = '';
      document.body.classList.add('ads-modal-open');
    }
  }

  closeDeleteConfirmModal() {
    const modal = document.getElementById('adsDeleteConfirmModal');
    if (modal) {
      modal.classList.add('noShow');
      modal.style.display = 'none';
      document.body.classList.remove('ads-modal-open');
    }
    this.currentDeleteTarget = null;
  }

  // ============================================================================
  // COLOR PICKER
  // ============================================================================

  initColorPicker() {
    this.colorPicker = {
      hue: 270, // Purple default
      saturation: 1.0,
      value: 1.0,
      alpha: 1.0 // Fully opaque by default
    };

    const canvas = document.getElementById('adsColorSv');
    if (!canvas) return;

    // Draw initial gradient
    this.drawColorCanvas();

    // Handle canvas clicks and drags
    let isDragging = false;

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.updateColorFromCanvas(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.updateColorFromCanvas(e);
      }
    });

    canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      const touch = e.touches[0];
      this.updateColorFromCanvas(touch);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (isDragging) {
        const touch = e.touches[0];
        this.updateColorFromCanvas(touch);
      }
    });

    canvas.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  drawColorCanvas() {
    const canvas = document.getElementById('adsColorSv');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Base color from hue
    const hue = this.colorPicker.hue;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, width, height);

    // White gradient (left to right) for saturation
    const whiteGrad = ctx.createLinearGradient(0, 0, width, 0);
    whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, width, height);

    // Black gradient (top to bottom) for value
    const blackGrad = ctx.createLinearGradient(0, 0, 0, height);
    blackGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    blackGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, width, height);
  }

  updateColorFromCanvas(e) {
    const canvas = document.getElementById('adsColorSv');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    // Calculate saturation (0 to 1) from x position
    this.colorPicker.saturation = x / rect.width;

    // Calculate value (1 to 0) from y position
    this.colorPicker.value = 1 - (y / rect.height);

    // Update thumb position
    const thumb = document.getElementById('adsColorSvThumb');
    if (thumb) {
      thumb.style.left = `${x}px`;
      thumb.style.top = `${y}px`;
    }

    this.updateBackgroundColor();
  }

  updateColorFromSliders() {
    // Update hue from slider
    const hueSlider = document.getElementById('adsColorHue');
    if (hueSlider) {
      this.colorPicker.hue = parseInt(hueSlider.value);
    }

    // Update alpha from slider (invert: 0% transparency = 1.0 alpha, 100% transparency = 0.0 alpha)
    const alphaSlider = document.getElementById('adsColorAlpha');
    const alphaLabel = document.getElementById('adsColorAlphaLabel');
    if (alphaSlider) {
      this.colorPicker.alpha = 1 - (parseInt(alphaSlider.value) / 100);
      if (alphaLabel) {
        alphaLabel.textContent = `${alphaSlider.value}%`;
      }
    }

    // Redraw canvas with new hue
    this.drawColorCanvas();

    this.updateBackgroundColor();
  }

  updateBackgroundColor() {
    // Convert HSV to RGB
    const h = this.colorPicker.hue;
    const s = this.colorPicker.saturation;
    const v = this.colorPicker.value;
    const a = this.colorPicker.alpha;

    const rgb = this.hsvToRgb(h, s, v);
    const color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

    // Update summary display
    const summary = document.getElementById('adsFrameBgSummary');
    if (summary) {
      if (a === 0) {
        summary.textContent = 'Transparent';
        summary.style.background = 'transparent';
      } else {
        summary.textContent = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a.toFixed(2)})`;
        summary.style.background = color;
        summary.style.padding = '2px 8px';
        summary.style.borderRadius = '4px';
        summary.style.border = '1px solid rgba(255,255,255,0.2)';
      }
    }

    console.log('Background color:', color);

    // Send real-time preview to overlay (don't save to state until "Save" is clicked)
    messenger.send('ADS_BACKGROUND_CHANGED', { backgroundColor: color });
  }

  hsvToRgb(h, s, v) {
    let r, g, b;

    const i = Math.floor((h / 60) % 6);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  rgbToHsv(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = max === 0 ? 0 : delta / max;
    let v = max;

    if (delta !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
    }

    if (h < 0) h += 360;

    return {
      h: Math.round(h),
      s: s,
      v: v
    };
  }

  // ============================================================================
  // IMAGE LIBRARY
  // ============================================================================

  async loadImageLibrary() {
    const grid = document.getElementById('adsImageGrid');
    if (!grid) return;

    try {
      // Get all advertisement assets
      const assets = await dexieDB.listAssets({ type: 'advertisement' });

      // Update storage meter
      await this.updateStorageMeter();

      // Clear grid
      grid.innerHTML = '';

      // Populate grid with proper image cards
      for (const asset of assets) {
        const objectUrl = await dexieDB.getAssetObjectUrl(asset.id);
        if (objectUrl) {
          const card = this.createImageCard(asset, objectUrl);
          grid.appendChild(card);
        }
      }

      console.log(`✅ Loaded ${assets.length} images into library`);
    } catch (error) {
      console.error('❌ Failed to load image library:', error);
    }
  }

  /**
   * Create an image card for the library grid
   */
  createImageCard(asset, objectUrl) {
    const card = document.createElement('div');
    card.className = 'ads-image-card';
    card.dataset.assetId = asset.id;

    // Format file size
    const sizeKB = (asset.size / 1024).toFixed(1);
    const sizeMB = (asset.size / (1024 * 1024)).toFixed(1);
    const sizeText = asset.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} kB`;

    // Get dimensions from asset (stored directly, not in metadata)
    const width = asset.width || '?';
    const height = asset.height || '?';
    const dimensions = `${width}×${height}`;

    // Create card HTML (use correct CSS class: ads-image-card__thumb not __preview)
    card.innerHTML = `
      <div class="ads-image-card__thumb">
        <img src="${objectUrl}" alt="${asset.filename}">
      </div>
      <div class="ads-image-card__info">
        <div class="ads-image-card__name" title="${asset.filename}">${asset.filename}</div>
        <div class="ads-image-card__meta">${sizeText} • ${dimensions}</div>
      </div>
      <div class="ads-image-card__delete" data-asset-id="${asset.id}" title="Delete this image">✕</div>
    `;

    // Click card to select image
    card.addEventListener('click', (e) => {
      // Don't select if clicking delete button
      if (e.target.classList.contains('ads-image-card__delete')) {
        return;
      }
      this.selectImageFromLibrary(asset.id);
    });

    // Delete button handler
    const deleteBtn = card.querySelector('.ads-image-card__delete');
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirmDeleteAsset(asset.id, asset.filename);
    });

    return card;
  }

  /**
   * Update storage meter display
   */
  async updateStorageMeter() {
    const meterFill = document.getElementById('adsImageMeterFill');
    const meterText = document.getElementById('adsImageMeterText');

    if (!meterFill || !meterText) return;

    try {
      const usage = await dexieDB.getStorageUsage();
      const usedMB = (usage.totalSize / (1024 * 1024)).toFixed(1);
      const limitMB = 50; // Soft limit
      const percentage = Math.min(100, (usage.totalSize / (limitMB * 1024 * 1024)) * 100);

      meterFill.style.width = `${percentage}%`;
      meterText.textContent = `${usedMB} MB used / ${limitMB}.0 MB (soft limit)`;
    } catch (error) {
      console.error('Failed to update storage meter:', error);
      meterText.textContent = 'Storage info unavailable';
    }
  }

  async selectImageFromLibrary(assetId) {
    if (!this.currentSlot) {
      console.error('❌ No slot selected for image');
      return;
    }

    const { slotId, region, index } = this.currentSlot;
    console.log(`✅ Applying image ${assetId} to slot ${slotId}`);

    try {
      // Set the logo slot to use this asset
      await stateManager.setLogoSlot(slotId, assetId);
      await stateManager.setLogoSlotActive(slotId, true);

      // Update the preview in the control panel
      await this.updateAdPreview(region, index, assetId);

      // Broadcast change to overlay
      messenger.send('LOGO_SLOT_CHANGED', { slotId, assetId });

      this.closeImagePickerModal();
      console.log(`✅ Image applied to ${slotId}`);
    } catch (error) {
      console.error('❌ Failed to apply image:', error);
    }
  }

  /**
   * Handle bulk image upload from file picker
   */
  async handleBulkImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log(`📤 Uploading ${files.length} images...`);

    try {
      // Use uploadBatch for better handling
      const result = await AssetUploader.uploadBatch(
        files,
        { type: 'advertisement', tags: ['media-library'] },
        (current, total, uploadResult) => {
          // Progress callback
          if (uploadResult.success) {
            console.log(`✅ Uploaded ${current}/${total}: ${uploadResult.fileName}`);
          } else {
            console.error(`❌ Failed ${current}/${total}: ${uploadResult.fileName} - ${uploadResult.error}`);
          }
        }
      );

      // Clear file input
      e.target.value = '';

      // Refresh the library grid
      await this.loadImageLibrary();

      console.log(`📤 Upload complete: ${result.successCount} succeeded, ${result.failCount} failed`);

      // Show user feedback if there were failures
      if (result.failCount > 0) {
        alert(`Upload complete!\n✓ ${result.successCount} succeeded\n✗ ${result.failCount} failed\n\nCheck console for details.`);
      }
    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      alert('Upload failed. Check console for details.');
    }
  }

  /**
   * Confirm deletion of an asset from the library
   */
  confirmDeleteAsset(assetId, filename) {
    this.currentDeleteTarget = { type: 'asset', assetId, filename };

    const message = document.getElementById('adsDeleteConfirmMessage');
    if (message) {
      message.textContent = `Delete "${filename}" from library? This will also remove it from any ad slots using this image.`;
    }

    this.closeImagePickerModal();
    this.openDeleteConfirmModal();
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

  async updateUIFromState(state) {
    if (!state || !state.logoSlots) return;

    // Update region visibility checkboxes from state
    const advertising = state.modules?.advertising || {};
    const showTop = advertising.showTop !== false;
    const showLeft = advertising.showLeft !== false;
    const showRight = advertising.showRight !== false;

    const topChk = document.getElementById('adsShowTopChk');
    const leftChk = document.getElementById('adsShowLeftChk');
    const rightChk = document.getElementById('adsShowRightChk');

    if (topChk) topChk.checked = showTop;
    if (leftChk) leftChk.checked = showLeft;
    if (rightChk) rightChk.checked = showRight;

    // Update borders and dividers checkboxes from state
    const showBorders = advertising.showBorders || false;
    const showDividers = advertising.showDividers || false;

    const bordersChk = document.getElementById('adsShowBordersChk');
    const dividersChk = document.getElementById('adsShowDividersChk');

    if (bordersChk) bordersChk.checked = showBorders;
    if (dividersChk) dividersChk.checked = showDividers;

    // Update ad rows visibility and minimap
    this.updateAdRowsVisibility();
    this.updateMinimap();

    // Update all ad slot previews and fields
    const regions = [
      { name: 'top', count: 6 },
      { name: 'left', count: 3 },
      { name: 'right', count: 3 }
    ];

    for (const region of regions) {
      for (let i = 1; i <= region.count; i++) {
        const slotId = `${region.name.charAt(0).toUpperCase()}${i}`;
        const slotData = state.logoSlots[slotId];
        const prefix = `ad${this.capitalize(region.name)}${i}`;

        // Update title field
        const titleInput = document.getElementById(`${prefix}Title`);
        if (titleInput && slotData?.title) {
          titleInput.value = slotData.title;
        }

        // Update span dropdown
        const spanSelect = document.getElementById(`${prefix}Span`);
        if (spanSelect && slotData?.span) {
          spanSelect.value = slotData.span;
        }

        // Update frame checkbox
        const frameCheckbox = document.getElementById(`${prefix}Frame`);
        if (frameCheckbox) {
          frameCheckbox.checked = slotData?.frame || false;
        }

        // Update show checkbox
        const showCheckbox = document.getElementById(`${prefix}Show`);
        if (showCheckbox) {
          showCheckbox.checked = slotData?.active !== false;
        }

        // Update preview image
        if (slotData && slotData.assetId && slotData.active) {
          await this.updateAdPreview(region.name, i, slotData.assetId);
        }
      }
    }
  }

  async updateAdPreview(region, index, assetId) {
    const prefix = `ad${this.capitalize(region)}${index}`;
    const preview = document.getElementById(`${prefix}Preview`);
    const img = document.getElementById(`${prefix}Img`);
    const dimsActual = document.getElementById(`${prefix}DimsActual`);

    if (!preview || !img) return;

    try {
      const objectUrl = await dexieDB.getAssetObjectUrl(assetId);
      if (objectUrl) {
        img.src = objectUrl;
        preview.classList.remove('noShow');

        // Get asset to display actual dimensions
        const asset = await dexieDB.getAsset(assetId);
        if (asset && dimsActual) {
          const width = asset.width || '?';
          const height = asset.height || '?';
          dimsActual.textContent = `${width}x${height}`;
        }
      }
    } catch (error) {
      console.error(`Failed to update preview for ${prefix}:`, error);
    }
  }

  // ============================================================================
  // AD ROWS VISIBILITY (Ads Tab)
  // ============================================================================

  /**
   * Update visibility of ad rows in the Ads tab based on region toggles
   */
  updateAdRowsVisibility() {
    const showTop = document.getElementById('adsShowTopChk')?.checked !== false;
    const showLeft = document.getElementById('adsShowLeftChk')?.checked !== false;
    const showRight = document.getElementById('adsShowRightChk')?.checked !== false;

    // If all regions are hidden, show all ad rows
    const allHidden = !showTop && !showLeft && !showRight;

    // Hide/show top ad rows (T1-T6)
    for (let i = 1; i <= 6; i++) {
      const row = document.querySelector(`.ads-row[data-region="top"][data-index="${i}"]`);
      if (row) {
        row.style.display = (allHidden || showTop) ? '' : 'none';
      }
    }

    // Hide/show left ad rows (L1-L3)
    for (let i = 1; i <= 3; i++) {
      const row = document.querySelector(`.ads-row[data-region="left"][data-index="${i}"]`);
      if (row) {
        row.style.display = (allHidden || showLeft) ? '' : 'none';
      }
    }

    // Hide/show right ad rows (R1-R3)
    for (let i = 1; i <= 3; i++) {
      const row = document.querySelector(`.ads-row[data-region="right"][data-index="${i}"]`);
      if (row) {
        row.style.display = (allHidden || showRight) ? '' : 'none';
      }
    }

    console.log(`📋 Ad rows visibility updated: Top=${showTop}, Left=${showLeft}, Right=${showRight}, AllHidden=${allHidden}`);
  }

  // ============================================================================
  // LAYOUT MINI-MAP
  // ============================================================================

  /**
   * Update the layout mini-map preview based on current region visibility
   */
  updateMinimap() {
    const showTop = document.getElementById('adsShowTopChk')?.checked !== false;
    const showLeft = document.getElementById('adsShowLeftChk')?.checked !== false;
    const showRight = document.getElementById('adsShowRightChk')?.checked !== false;

    const minimapTop = document.getElementById('minimapTop');
    const minimapLeft = document.getElementById('minimapLeft');
    const minimapRight = document.getElementById('minimapRight');

    if (minimapTop) {
      if (!showTop) {
        minimapTop.style.height = '0%';
        minimapTop.style.opacity = '0';
      } else {
        minimapTop.style.height = '16%';
        minimapTop.style.opacity = '1';
      }
    }

    if (minimapLeft) {
      if (!showLeft) {
        minimapLeft.style.width = '0%';
        minimapLeft.style.opacity = '0';
      } else {
        minimapLeft.style.width = '13%';
        minimapLeft.style.opacity = '1';
      }

      // When top bar is hidden, left bar extends to top
      if (!showTop) {
        minimapLeft.style.top = '0%';
      } else {
        minimapLeft.style.top = '16%';
      }
    }

    if (minimapRight) {
      if (!showRight) {
        minimapRight.style.width = '0%';
        minimapRight.style.opacity = '0';
      } else {
        minimapRight.style.width = '13%';
        minimapRight.style.opacity = '1';
      }

      // When top bar is hidden, right bar extends to top
      if (!showTop) {
        minimapRight.style.top = '0%';
      } else {
        minimapRight.style.top = '16%';
      }
    }

    console.log(`📐 Mini-map updated: Top=${showTop}, Left=${showLeft}, Right=${showRight}`);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
const controller = new AdvertisingController();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  controller.destroy();
});

// Make available in console for debugging
window.advertising = controller;

console.log('✅ AdvertisingController.js loaded');
