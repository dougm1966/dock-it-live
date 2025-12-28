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
    document.getElementById(`${prefix}Span`)?.addEventListener('change', (e) => {
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

    // Frame art (dividers) checkbox
    document.getElementById('adsFrameArtChk')?.addEventListener('change', (e) => {
      console.log('Frame art (dividers):', e.target.checked);
      // TODO: Store in state and broadcast to advertising display
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

    // HSL sliders for color picker
    document.getElementById('adsHueSlider')?.addEventListener('input', (e) => {
      this.updateFrameBackground();
    });

    document.getElementById('adsSatSlider')?.addEventListener('input', (e) => {
      this.updateFrameBackground();
    });

    document.getElementById('adsLumSlider')?.addEventListener('input', (e) => {
      this.updateFrameBackground();
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

  setAdSpan(slotId, span) {
    console.log(`Ad ${slotId} span set to:`, span);
    // TODO: Store span in logo slot metadata
    // await stateManager.setLogoSlotMetadata(slotId, { span });
  }

  setAdFrame(slotId, hasFrame) {
    console.log(`Ad ${slotId} frame:`, hasFrame);
    // TODO: Store frame setting in logo slot metadata
    // await stateManager.setLogoSlotMetadata(slotId, { frame: hasFrame });
  }

  setAdShow(slotId, show) {
    stateManager.setLogoSlotActive(slotId, show);
    messenger.send('LOGO_SLOT_CHANGED', { slotId, active: show });
    console.log(`Ad ${slotId} visibility:`, show);
  }

  setAdTitle(slotId, title) {
    console.log(`Ad ${slotId} title:`, title);
    // TODO: Store title in logo slot metadata
    // await stateManager.setLogoSlotMetadata(slotId, { title });
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

  openFrameBgModal() {
    const modal = document.getElementById('adsFrameBgModal');
    modal?.classList.remove('noShow');
    document.body.classList.add('ads-modal-open');
  }

  closeFrameBgModal() {
    const modal = document.getElementById('adsFrameBgModal');
    modal?.classList.add('noShow');
    document.body.classList.remove('ads-modal-open');
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

  updateFrameBackground() {
    const hue = document.getElementById('adsHueSlider')?.value || 0;
    const sat = document.getElementById('adsSatSlider')?.value || 100;
    const lum = document.getElementById('adsLumSlider')?.value || 50;

    const color = `hsl(${hue}, ${sat}%, ${lum}%)`;

    // Update preview
    const preview = document.getElementById('adsFrameBgPreview');
    if (preview) {
      preview.style.backgroundColor = color;
    }

    // Update value displays
    const hueVal = document.getElementById('adsHueVal');
    const satVal = document.getElementById('adsSatVal');
    const lumVal = document.getElementById('adsLumVal');

    if (hueVal) hueVal.textContent = hue;
    if (satVal) satVal.textContent = `${sat}%`;
    if (lumVal) lumVal.textContent = `${lum}%`;

    console.log('Frame background color:', color);
    // TODO: Store in state and apply to advertising display
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

    // Update ad rows visibility and minimap
    this.updateAdRowsVisibility();
    this.updateMinimap();

    // Update all ad slot previews
    const regions = [
      { name: 'top', count: 6 },
      { name: 'left', count: 3 },
      { name: 'right', count: 3 }
    ];

    for (const region of regions) {
      for (let i = 1; i <= region.count; i++) {
        const slotId = `${region.name.charAt(0).toUpperCase()}${i}`;
        const slotData = state.logoSlots[slotId];

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

    // Hide/show top ad rows (T1-T6)
    for (let i = 1; i <= 6; i++) {
      const row = document.querySelector(`.ads-row[data-region="top"][data-index="${i}"]`);
      if (row) {
        row.style.display = showTop ? '' : 'none';
      }
    }

    // Hide/show left ad rows (L1-L3)
    for (let i = 1; i <= 3; i++) {
      const row = document.querySelector(`.ads-row[data-region="left"][data-index="${i}"]`);
      if (row) {
        row.style.display = showLeft ? '' : 'none';
      }
    }

    // Hide/show right ad rows (R1-R3)
    for (let i = 1; i <= 3; i++) {
      const row = document.querySelector(`.ads-row[data-region="right"][data-index="${i}"]`);
      if (row) {
        row.style.display = showRight ? '' : 'none';
      }
    }

    console.log(`📋 Ad rows visibility updated: Top=${showTop}, Left=${showLeft}, Right=${showRight}`);
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
