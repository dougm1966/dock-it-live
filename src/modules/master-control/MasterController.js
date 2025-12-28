/**
 * MasterController.js
 * Universal Master Shell for all game modules
 *
 * Manages:
 * - Player names, photos, scores (universal)
 * - Match information and reset
 * - Logo management
 * - Module dock injection (Billiards, Darts, etc.)
 * - Settings and module toggles
 */

import { stateManager } from '../../core/state/StateManager.js';
import { AssetUploader } from '../../core/ads/AssetUploader.js';
import { messenger } from '../../core/messaging/BroadcastMessenger.js';
import { dexieDB } from '../../core/database/index.js';
import { ScoreholioBridgeController } from '../scoreholio-bridge/BridgeController.js';

class MasterController {
  constructor() {
    this.stateSubscription = null;
    this.activeModules = {
      billiards: false,
      darts: false,
      advertising: false
    };
    this.scoreholioBridge = null;
    this.quickSearchState = {
      p1: { selectedIndex: -1, results: [] },
      p2: { selectedIndex: -1, results: [] },
    };
    this.init();
  }

  /**
   * Initialize the master control panel
   */
  async init() {
    console.log('🏆 Master Control Panel initializing...');

    try {
      // Initialize StateManager
      await stateManager.init();
      console.log('✅ StateManager ready');

      // Setup all event listeners
      this.setupPlayerControls();
      this.setupScoringControls();
      this.setupLogoControls();
      this.setupSettingsControls();
      this.setupModalControls();
      this.setupMessageListeners();
      this.setupQuickSearch();
      this.setupScoreholioBridgeControls();

      // Setup reactive state subscription
      this.setupStateSubscription();

      // Initial UI render from state
      await this.renderFromState();

      console.log('✅ Master Control Panel ready!');
    } catch (error) {
      console.error('❌ Master Control Panel initialization failed:', error);
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
  // PLAYER CONTROLS (Universal)
  // ============================================================================

  setupPlayerControls() {
    // Player 1 name
    document.getElementById('p1Name')?.addEventListener('change', async (e) => {
      await stateManager.setPlayerName(1, e.target.value);
      console.log('✅ Player 1 name updated:', e.target.value);
    });

    // Player 2 name
    document.getElementById('p2Name')?.addEventListener('change', async (e) => {
      await stateManager.setPlayerName(2, e.target.value);
      console.log('✅ Player 2 name updated:', e.target.value);
    });

    // Player 1 ranking (Fargo, ELO, etc.)
    document.getElementById('p1Ranking')?.addEventListener('change', async (e) => {
      const rating = e.target.value.trim();
      await stateManager.setPlayerFargo(1, rating);
      // Also set fargoInfo for overlay display
      await stateManager.setPlayerFargoInfo(1, rating);
      console.log('✅ Player 1 ranking updated:', rating || '(cleared)');
    });

    // Player 2 ranking (Fargo, ELO, etc.)
    document.getElementById('p2Ranking')?.addEventListener('change', async (e) => {
      const rating = e.target.value.trim();
      await stateManager.setPlayerFargo(2, rating);
      // Also set fargoInfo for overlay display
      await stateManager.setPlayerFargoInfo(2, rating);
      console.log('✅ Player 2 ranking updated:', rating || '(cleared)');
    });

    // Player 1 color (name plate background)
    document.getElementById('p1ColorSelect')?.addEventListener('change', async (e) => {
      await stateManager.setPlayerColor(1, e.target.value);
      console.log('✅ Player 1 color updated:', e.target.value);
    });

    // Player 2 color (name plate background)
    document.getElementById('p2ColorSelect')?.addEventListener('change', async (e) => {
      await stateManager.setPlayerColor(2, e.target.value);
      console.log('✅ Player 2 color updated:', e.target.value);
    });

    // Swap colors button
    document.getElementById('swapColorsBtn')?.addEventListener('click', async () => {
      const p1Select = document.getElementById('p1ColorSelect');
      const p2Select = document.getElementById('p2ColorSelect');
      if (p1Select && p2Select) {
        const temp = p1Select.value;
        p1Select.value = p2Select.value;
        p2Select.value = temp;
        await stateManager.setPlayerColor(1, p1Select.value);
        await stateManager.setPlayerColor(2, p2Select.value);
        console.log('✅ Player colors swapped');
      }
    });

    // Match Info Tab 1 (universal for all sports)
    document.getElementById('matchInfoTab1')?.addEventListener('change', async (e) => {
      const value = e.target.value.trim();
      await stateManager.setMatchInfoTab1(value || '');
      console.log('✅ Match info tab 1 updated:', value || '(empty)');
    });

    // Match Info Tab 2 (universal for all sports)
    document.getElementById('matchInfoTab2')?.addEventListener('change', async (e) => {
      const value = e.target.value.trim();
      await stateManager.setMatchInfoTab2(value || '');
      console.log('✅ Match info tab 2 updated:', value || '(empty)');
    });

    // Player 1 photo upload
    document.getElementById('FileUploadP1Photo')?.addEventListener('change', async (e) => {
      await this.handlePlayerPhotoUpload(1, e.target.files[0]);
    });

    // Player 2 photo upload
    document.getElementById('FileUploadP2Photo')?.addEventListener('change', async (e) => {
      await this.handlePlayerPhotoUpload(2, e.target.files[0]);
    });

    // Player 1 photo delete
    document.getElementById('p1PhotoDelete')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.deletePlayerPhoto(1);
    });

    // Player 2 photo delete
    document.getElementById('p2PhotoDelete')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.deletePlayerPhoto(2);
    });
  }

  async handlePlayerPhotoUpload(playerNum, file) {
    if (!file) return;

    try {
      const result = await AssetUploader.upload(file, {
        type: 'player_photo',
        tags: [`player${playerNum}`]
      });

      if (result.success) {
        // Set player photo asset ID in state
        await stateManager.setPlayerPhoto(playerNum, result.id);

        // Update UI preview
        const img = document.getElementById(`p${playerNum}PhotoDisplay`);
        const deleteBtn = document.getElementById(`p${playerNum}PhotoDelete`);
        const textSpan = document.getElementById(`p${playerNum}PhotoText`);

        if (img && result.asset && result.asset.data) {
          const objectUrl = await dexieDB.getAssetObjectUrl(result.id);
          img.src = objectUrl;
          img.style.display = 'inline-block';
          deleteBtn.style.display = 'inline-block';
          textSpan.style.display = 'none';
        }

        // Broadcast update
        messenger.send('PLAYER_INFO_UPDATED', { playerNum });

        console.log(`✅ Player ${playerNum} photo uploaded:`, result.id);
      } else {
        alert(`Photo upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`Player ${playerNum} photo upload error:`, error);
      alert('Photo upload failed. Check console for details.');
    }
  }

  async deletePlayerPhoto(playerNum) {
    try {
      const state = await stateManager.getState();
      const assetId = state?.matchData?.[`player${playerNum}`]?.photoAssetId;

      if (assetId) {
        await dexieDB.deleteAsset(assetId);
      }

      await stateManager.setPlayerPhoto(playerNum, null);

      // Update UI
      const img = document.getElementById(`p${playerNum}PhotoDisplay`);
      const deleteBtn = document.getElementById(`p${playerNum}PhotoDelete`);
      const textSpan = document.getElementById(`p${playerNum}PhotoText`);

      if (img) {
        img.src = '';
        img.style.display = 'none';
        deleteBtn.style.display = 'none';
        textSpan.style.display = 'inline';
      }

      // Broadcast update
      messenger.send('PLAYER_INFO_UPDATED', { playerNum });

      console.log(`✅ Player ${playerNum} photo deleted`);
    } catch (error) {
      console.error(`Delete player ${playerNum} photo error:`, error);
    }
  }

  // ============================================================================
  // SCORING CONTROLS (Universal)
  // ============================================================================

  setupScoringControls() {
    // P1 +1 Score
    document.getElementById('sendP1Score')?.addEventListener('click', async () => {
      await stateManager.incrementScore(1);
      console.log('✅ P1 score +1');
    });

    // P2 +1 Score
    document.getElementById('sendP2Score')?.addEventListener('click', async () => {
      await stateManager.incrementScore(2);
      console.log('✅ P2 score +1');
    });

    // P1 -1 Score
    document.getElementById('sendP1ScoreSub')?.addEventListener('click', async () => {
      await stateManager.decrementScore(1);
      console.log('✅ P1 score -1');
    });

    // P2 -1 Score
    document.getElementById('sendP2ScoreSub')?.addEventListener('click', async () => {
      await stateManager.decrementScore(2);
      console.log('✅ P2 score -1');
    });

    // Reset match
    document.getElementById('resetBtn')?.addEventListener('click', async () => {
      if (confirm('Reset scores and match data?')) {
        await stateManager.resetMatch();
        console.log('✅ Match reset');
      }
    });
  }

  // ============================================================================
  // LOGO CONTROLS (Universal)
  // ============================================================================

  setupLogoControls() {
    // Left logo (L0)
    document.getElementById('FileUploadL0')?.addEventListener('change', async (e) => {
      await this.handleLogoUpload('tableTopLeft', e.target.files[0], 'l0Img', 'l0Delete', 'l0Text');
    });

    // Right logo (L4)
    document.getElementById('FileUploadL4')?.addEventListener('change', async (e) => {
      await this.handleLogoUpload('tableTopRight', e.target.files[0], 'l4Img', 'l4Delete', 'l4Text');
    });

    // Left logo delete
    document.getElementById('l0Delete')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.deleteLogo('tableTopLeft', 'l0Img', 'l0Delete', 'l0Text');
    });

    // Right logo delete
    document.getElementById('l4Delete')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.deleteLogo('tableTopRight', 'l4Img', 'l4Delete', 'l4Text');
    });
  }

  async handleLogoUpload(slotId, file, imgId, deleteId, textId) {
    if (!file) return;

    try {
      const result = await AssetUploader.upload(file, {
        type: 'logo',
        tags: [slotId]
      });

      if (result.success) {
        await stateManager.setLogoSlot(slotId, result.id);
        await stateManager.setLogoSlotActive(slotId, true);

        // Update UI preview
        const img = document.getElementById(imgId);
        const deleteBtn = document.getElementById(deleteId);
        const textSpan = document.getElementById(textId);

        if (img && result.asset && result.asset.data) {
          const objectUrl = await dexieDB.getAssetObjectUrl(result.id);
          img.src = objectUrl;
          img.style.display = 'inline-block';
          deleteBtn.style.display = 'inline-block';
          textSpan.style.display = 'none';
        }

        // Broadcast refresh message
        messenger.send('LOGO_SLOT_CHANGED', { slotId });

        console.log(`✅ Logo uploaded to ${slotId}:`, result.id);
      } else {
        alert(`Logo upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`Logo upload error for ${slotId}:`, error);
      alert('Logo upload failed. Check console for details.');
    }
  }

  async deleteLogo(slotId, imgId, deleteId, textId) {
    try {
      const state = await stateManager.getState();
      const assetId = state?.logoSlots?.[slotId]?.assetId;

      if (assetId) {
        await dexieDB.deleteAsset(assetId);
      }

      await stateManager.setLogoSlot(slotId, null);
      await stateManager.setLogoSlotActive(slotId, false);

      // Update UI
      const img = document.getElementById(imgId);
      const deleteBtn = document.getElementById(deleteId);
      const textSpan = document.getElementById(textId);

      if (img) {
        img.src = '';
        img.style.display = 'none';
        deleteBtn.style.display = 'none';
        textSpan.style.display = 'inline';
      }

      // Broadcast refresh message
      messenger.send('LOGO_SLOT_CHANGED', { slotId });

      console.log(`✅ Logo deleted from ${slotId}`);
    } catch (error) {
      console.error(`Delete logo error for ${slotId}:`, error);
    }
  }

  // ============================================================================
  // SETTINGS & MODULE CONTROLS
  // ============================================================================

  setupSettingsControls() {
    // Show overlay toggle
    document.getElementById('showOverlayChk')?.addEventListener('change', (e) => {
      console.log('Show overlay:', e.target.checked);
      // TODO: Send message to overlay to show/hide
      messenger.send('OVERLAY_VISIBILITY', { visible: e.target.checked });
    });

    // NEW: Overlay Skin/Theme selector
    document.getElementById('overlaySkinSelect')?.addEventListener('change', async (e) => {
      const skinName = e.target.value;
      await stateManager.setValue('uiSettings.overlaySkin', skinName);
      messenger.send('THEME_CHANGED', { skinName });
      console.log('✅ Overlay skin changed:', skinName);
    });

    // Enable Billiards module
    document.getElementById('enableBilliardsChk')?.addEventListener('change', (e) => {
      this.toggleModuleDock('billiards', e.target.checked);
    });

    // Enable Darts module
    document.getElementById('enableDartsChk')?.addEventListener('change', (e) => {
      this.toggleModuleDock('darts', e.target.checked);
    });

    // Enable Advertising module
    document.getElementById('enableAdvertisingChk')?.addEventListener('change', async (e) => {
      this.activeModules.advertising = e.target.checked;
      console.log('✅ Advertising module:', e.target.checked);

      // Save to state
      await stateManager.setValue('modules.advertising.enabled', e.target.checked);
      console.log('💾 Advertising module state saved');
    });

    // Enable Shot Clock module
    document.getElementById('enableShotClockChk')?.addEventListener('change', async (e) => {
      this.activeModules.shotClock = e.target.checked;
      console.log('✅ Shot Clock module:', e.target.checked);

      // Save to state
      await stateManager.setValue('modules.shotClock.enabled', e.target.checked);
      console.log('💾 Shot Clock module state saved');
    });
  }

  setupModalControls() {
    // Open settings modal
    document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal')?.classList.remove('noShow');
    });

    // Close settings modal
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal')?.classList.add('noShow');
    });

    // Open player manager in new window (Pro Module - fully decoupled)
    document.getElementById('openPlayerManagerBtn')?.addEventListener('click', () => {
      this.openPlayerManager();
    });
  }

  /**
   * Open Player Manager (Pro) in new window
   * Fully decoupled - can be used as OBS Custom Browser Dock
   */
  openPlayerManager() {
    const playerManagerUrl = '../player-management/control-panel/index.html';

    // Window features optimized for OBS dock (300-400px wide side panel)
    const features = [
      'width=400',
      'height=800',
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'scrollbars=yes',
      'resizable=yes',
    ].join(',');

    const playerManagerWindow = window.open(playerManagerUrl, 'PlayerManager_Pro', features);

    if (playerManagerWindow) {
      playerManagerWindow.focus();
      console.log('✅ Player Manager (Pro) opened in new window');
      console.log('📡 Player Manager will broadcast PLAYER_SELECTED messages');
      console.log('📥 Master Shell is listening for broadcasts');
    } else {
      alert(
        'Failed to open Player Manager.\n\n' +
          'Popup blocked? Allow popups for this site.\n\n' +
          'OBS Users: Add Player Manager as a Custom Browser Dock:\n' +
          'Docks → Custom Browser Docks → Add:\n' +
          `URL: ${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}${playerManagerUrl}`
      );
    }
  }

  /**
   * Setup message listeners for cross-module communication
   */
  setupMessageListeners() {
    // Listen for PLAYER_SELECTED messages from Player Manager
    messenger.on('PLAYER_SELECTED', (message) => {
      this.handlePlayerSelected(message.payload);
    });

    console.log('✅ Message listeners setup complete');
    console.log('📡 Listening for PLAYER_SELECTED broadcasts from Player Manager (Pro)');
  }

  // ============================================================================
  // QUICK SEARCH (Lightning Fast Player Selection)
  // ============================================================================

  /**
   * Setup Player Name Autocomplete for live tournament operation
   */
  setupQuickSearch() {
    const p1Name = document.getElementById('p1Name');
    const p2Name = document.getElementById('p2Name');

    if (p1Name) {
      p1Name.addEventListener('input', (e) => this.handleQuickSearch(e.target.value, 1));
      p1Name.addEventListener('keydown', (e) => this.handleQuickSearchKeydown(e, 1));
      p1Name.addEventListener('blur', () => this.hideQuickSearchResults(1));
    }

    if (p2Name) {
      p2Name.addEventListener('input', (e) => this.handleQuickSearch(e.target.value, 2));
      p2Name.addEventListener('keydown', (e) => this.handleQuickSearchKeydown(e, 2));
      p2Name.addEventListener('blur', () => this.hideQuickSearchResults(2));
    }

    console.log('✅ Player Name Autocomplete setup complete');
  }

  /**
   * Handle Player Name Autocomplete input (real-time search)
   */
  async handleQuickSearch(searchTerm, playerSlot) {
    const stateKey = playerSlot === 1 ? 'p1' : 'p2';
    const resultsDiv = document.getElementById(`p${playerSlot}NameResults`);

    if (!resultsDiv) return;

    // Clear if empty
    if (!searchTerm || searchTerm.trim() === '') {
      this.quickSearchState[stateKey].results = [];
      this.quickSearchState[stateKey].selectedIndex = -1;
      resultsDiv.style.display = 'none';
      return;
    }

    // Search players
    const players = await dexieDB.searchPlayers(searchTerm);

    // Limit to top 10 results
    this.quickSearchState[stateKey].results = players.slice(0, 10);
    this.quickSearchState[stateKey].selectedIndex = -1;

    // Render results
    this.renderQuickSearchResults(playerSlot);
  }

  /**
   * Render Player Name Autocomplete results dropdown
   */
  renderQuickSearchResults(playerSlot) {
    const stateKey = playerSlot === 1 ? 'p1' : 'p2';
    const resultsDiv = document.getElementById(`p${playerSlot}NameResults`);
    const results = this.quickSearchState[stateKey].results;
    const selectedIndex = this.quickSearchState[stateKey].selectedIndex;

    if (!resultsDiv) return;

    if (results.length === 0) {
      resultsDiv.innerHTML = '<div class="quick-search-no-results">No players found</div>';
      resultsDiv.style.display = 'block';
      return;
    }

    const html = results
      .map((player, index) => {
        const selected = index === selectedIndex ? 'selected' : '';
        return `
          <div class="quick-search-result-item ${selected}"
               data-player-id="${player.id}"
               data-player-slot="${playerSlot}"
               onmousedown="event.preventDefault();"
               onclick="window.masterController.selectQuickSearchPlayer(${player.id}, ${playerSlot})">
            <div class="quick-search-result-name">${this.escapeHtml(player.name)}</div>
            <div class="quick-search-result-details">
              ${player.rating ? `Rating: ${this.escapeHtml(player.rating)}` : 'No rating'}
              ${player.country ? ` • ${this.escapeHtml(player.country)}` : ''}
              ${player.sport ? ` • ${this.escapeHtml(player.sport)}` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
  }

  /**
   * Handle keyboard navigation (arrow keys, Enter)
   */
  handleQuickSearchKeydown(event, playerSlot) {
    const stateKey = playerSlot === 1 ? 'p1' : 'p2';
    const results = this.quickSearchState[stateKey].results;

    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.quickSearchState[stateKey].selectedIndex =
        (this.quickSearchState[stateKey].selectedIndex + 1) % results.length;
      this.renderQuickSearchResults(playerSlot);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.quickSearchState[stateKey].selectedIndex =
        this.quickSearchState[stateKey].selectedIndex <= 0
          ? results.length - 1
          : this.quickSearchState[stateKey].selectedIndex - 1;
      this.renderQuickSearchResults(playerSlot);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selectedIndex = this.quickSearchState[stateKey].selectedIndex;

      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const player = results[selectedIndex];
        this.selectQuickSearchPlayer(player.id, playerSlot);
      } else if (results.length > 0) {
        // If no selection, select first result
        this.selectQuickSearchPlayer(results[0].id, playerSlot);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.hideQuickSearchResults(playerSlot);
      event.target.blur();
    }
  }

  /**
   * Select player from autocomplete results
   */
  async selectQuickSearchPlayer(playerId, playerSlot) {
    const player = await dexieDB.getPlayer(playerId);

    if (!player) {
      console.error('❌ Player not found:', playerId);
      return;
    }

    console.log(`⚡ AUTOCOMPLETE SELECT: ${player.name} → P${playerSlot}`);

    // Update UI (same logic as PLAYER_SELECTED message)
    const nameInput = document.getElementById(`p${playerSlot}Name`);
    if (nameInput) {
      nameInput.value = player.name;
      stateManager.setPlayerName(playerSlot, player.name);
    }

    const rankingInput = document.getElementById(`p${playerSlot}Ranking`);
    if (rankingInput && player.rating) {
      rankingInput.value = player.rating;
      stateManager.setPlayerFargo(playerSlot, player.rating);
      // Also set fargoInfo for overlay display
      stateManager.setPlayerFargoInfo(playerSlot, player.rating);
    }

    // Hide results (name is already filled)
    this.hideQuickSearchResults(playerSlot);

    console.log(`✅ Player ${playerSlot} loaded via autocomplete: ${player.name}`);
  }

  /**
   * Hide Player Name Autocomplete results dropdown
   */
  hideQuickSearchResults(playerSlot) {
    setTimeout(() => {
      const resultsDiv = document.getElementById(`p${playerSlot}NameResults`);
      if (resultsDiv) {
        resultsDiv.style.display = 'none';
      }
      const stateKey = playerSlot === 1 ? 'p1' : 'p2';
      this.quickSearchState[stateKey].selectedIndex = -1;
      this.quickSearchState[stateKey].results = [];
    }, 200); // Delay to allow click events to fire
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================================
  // SCOREHOLIO BRIDGE CONTROLS
  // ============================================================================

  async setupScoreholioBridgeControls() {
    try {
      // Initialize Scoreholio Bridge
      this.scoreholioBridge = new ScoreholioBridgeController();
      await this.scoreholioBridge.init();

      // Load saved URL and status from state
      const status = this.scoreholioBridge.getStatus();
      const urlInput = document.getElementById('scoreholioUrl');
      if (urlInput && status.url) {
        urlInput.value = status.url;
      }

      // Connect button
      document.getElementById('scoreholioConnectBtn')?.addEventListener('click', async () => {
        await this.handleScoreholioConnect();
      });

      // Disconnect button
      document.getElementById('scoreholioDisconnectBtn')?.addEventListener('click', async () => {
        await this.handleScoreholioDisconnect();
      });

      // Polling frequency input
      document.getElementById('scoreholioPollingFreq')?.addEventListener('change', (e) => {
        const seconds = parseInt(e.target.value, 10);
        this.scoreholioBridge.setPollingFrequency(seconds * 1000);
        console.log(`✅ Scoreholio polling frequency set to ${seconds} seconds`);
      });

      // Update UI with current status
      this.updateScoreholioStatusUI(status);

      console.log('✅ Scoreholio Bridge controls setup complete');
    } catch (error) {
      console.error('❌ Scoreholio Bridge setup failed:', error);
    }
  }

  async handleScoreholioConnect() {
    const urlInput = document.getElementById('scoreholioUrl');
    const url = urlInput?.value?.trim();

    if (!url) {
      alert('Please enter a Scoreholio court URL');
      return;
    }

    try {
      // Disable connect button while connecting
      const connectBtn = document.getElementById('scoreholioConnectBtn');
      if (connectBtn) {
        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';
      }

      const result = await this.scoreholioBridge.connect(url);

      // Update UI
      this.updateScoreholioStatusUI(this.scoreholioBridge.getStatus());

      console.log('✅ Scoreholio connected:', result.message);
    } catch (error) {
      alert(`Scoreholio connection failed: ${error.message}`);
      console.error('❌ Scoreholio connection error:', error);

      // Re-enable connect button
      const connectBtn = document.getElementById('scoreholioConnectBtn');
      if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect';
      }
    }
  }

  async handleScoreholioDisconnect() {
    try {
      const result = await this.scoreholioBridge.disconnect();

      // Update UI
      this.updateScoreholioStatusUI(this.scoreholioBridge.getStatus());

      console.log('✅ Scoreholio disconnected:', result.message);
    } catch (error) {
      alert(`Scoreholio disconnect failed: ${error.message}`);
      console.error('❌ Scoreholio disconnect error:', error);
    }
  }

  updateScoreholioStatusUI(status) {
    const connectBtn = document.getElementById('scoreholioConnectBtn');
    const disconnectBtn = document.getElementById('scoreholioDisconnectBtn');
    const statusText = document.getElementById('scoreholioStatusText');
    const statusContainer = document.getElementById('scoreholioStatus');

    if (connectBtn) {
      connectBtn.disabled = status.connected;
      connectBtn.textContent = 'Connect';
    }

    if (disconnectBtn) {
      disconnectBtn.disabled = !status.connected;
    }

    if (statusText) {
      if (status.connected) {
        statusText.textContent = `Connected (polling every ${status.pollingFrequency / 1000}s)`;
      } else {
        statusText.textContent = 'Not connected';
      }
    }

    if (statusContainer) {
      if (status.connected) {
        statusContainer.style.background = 'var(--color-success-bg, #d1fae5)';
        statusContainer.style.color = 'var(--color-success, #065f46)';
      } else {
        statusContainer.style.background = 'var(--bg-secondary)';
        statusContainer.style.color = 'inherit';
      }
    }
  }

  /**
   * Handle PLAYER_SELECTED message from Player Manager (Pro Module)
   * This is the "Receiver" logic - Master Shell listens for broadcasts
   * @param {Object} payload - { playerSlot, playerData: { name, rating, country, sport, photoUrl } }
   */
  async handlePlayerSelected(payload) {
    const { playerSlot, playerData } = payload;

    if (!playerSlot || !playerData) {
      console.error('❌ Invalid PLAYER_SELECTED payload:', payload);
      return;
    }

    console.log(`📥 RECEIVED BROADCAST FROM PLAYER MANAGER (Pro):`);
    console.log(`   Player: ${playerData.name}`);
    console.log(`   Slot: P${playerSlot}`);
    console.log(`   Rating: ${playerData.rating || 'N/A'}`);
    console.log(`   Sport: ${playerData.sport || 'billiards'}`);
    console.log(`   Country: ${playerData.country || 'N/A'}`);

    try {
      // Update player name in UI
      const nameInput = document.getElementById(`p${playerSlot}Name`);
      if (nameInput) {
        nameInput.value = playerData.name;
        // Update StateManager (which triggers overlay update)
        stateManager.setPlayerName(playerSlot, playerData.name);
        console.log(`   ✓ Name updated: ${playerData.name}`);
      }

      // Update player rating/Fargo in UI
      const rankingInput = document.getElementById(`p${playerSlot}Ranking`);
      if (rankingInput && playerData.rating) {
        rankingInput.value = playerData.rating;
        // Update StateManager (which triggers overlay update)
        stateManager.setPlayerFargo(playerSlot, playerData.rating);
        // Also set fargoInfo for overlay display
        stateManager.setPlayerFargoInfo(playerSlot, playerData.rating);
        console.log(`   ✓ Rating updated: ${playerData.rating}`);
      }

      // TODO: Handle player photo if photoUrl is provided
      // This would involve loading the photo from the database and displaying it

      console.log(`✅ PLAYER ${playerSlot} FULLY LOADED: ${playerData.name}`);
      console.log('📺 Overlay should now display updated player information');
    } catch (error) {
      console.error('❌ Failed to handle player selection:', error);
    }
  }

  /**
   * Toggle module dock visibility
   */
  toggleModuleDock(moduleName, enabled) {
    this.activeModules[moduleName] = enabled;
    const dock = document.getElementById(`${moduleName}Dock`);

    if (dock) {
      if (enabled) {
        dock.classList.remove('noShow');
        console.log(`✅ ${moduleName} module enabled`);

        // TODO: Load and inject module-specific UI
        this.loadModuleUI(moduleName, dock);
      } else {
        dock.classList.add('noShow');
        console.log(`❌ ${moduleName} module disabled`);
      }
    }
  }

  /**
   * Load module-specific UI into dock via iFrame
   * Using iFrames prevents CSS conflicts and keeps modules isolated
   */
  async loadModuleUI(moduleName, dockElement) {
    // Clear any existing content
    dockElement.innerHTML = '';

    if (moduleName === 'billiards') {
      // Create iFrame for billiards module
      const iframe = document.createElement('iframe');
      // Relative path for OBS file:// protocol compatibility
      // In dev: ./src/modules/billiards/control-panel/index.html
      // In production: ./billiards-module.html
      iframe.src = './src/modules/billiards/control-panel/index.html';
      iframe.style.width = '100%';
      iframe.style.height = '600px'; // Adjust based on content
      iframe.style.border = 'none';
      iframe.style.display = 'block';
      iframe.title = 'Billiards Module';

      dockElement.appendChild(iframe);
      console.log('✅ Billiards module loaded via iFrame');

    } else if (moduleName === 'darts') {
      // Create iFrame for darts module (when implemented)
      const iframe = document.createElement('iframe');
      // Relative path for OBS file:// protocol compatibility
      iframe.src = './src/modules/darts/control-panel/index.html';
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.display = 'block';
      iframe.title = 'Darts Module';

      dockElement.appendChild(iframe);
      console.log('✅ Darts module loaded via iFrame');
    }
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
    if (!state || !state.matchData) return;

    const { player1, player2 } = state.matchData;

    // Update P1/P2 labels with actual player names
    this.updatePlayerLabels(player1, player2);

    // Update player names
    const p1Name = document.getElementById('p1Name');
    const p2Name = document.getElementById('p2Name');
    if (p1Name) p1Name.value = player1.name || '';
    if (p2Name) p2Name.value = player2.name || '';

    // Update player rankings
    const p1Ranking = document.getElementById('p1Ranking');
    const p2Ranking = document.getElementById('p2Ranking');
    if (p1Ranking) p1Ranking.value = player1.fargo || '';
    if (p2Ranking) p2Ranking.value = player2.fargo || '';

    // Update player colors
    const p1Color = document.getElementById('p1ColorSelect');
    const p2Color = document.getElementById('p2ColorSelect');
    if (p1Color && player1.color) p1Color.value = player1.color;
    if (p2Color && player2.color) p2Color.value = player2.color;

    // Update scores
    const p1ScoreDisplay = document.getElementById('p1ScoreDisplay');
    const p2ScoreDisplay = document.getElementById('p2ScoreDisplay');
    if (p1ScoreDisplay) p1ScoreDisplay.textContent = player1.score || 0;
    if (p2ScoreDisplay) p2ScoreDisplay.textContent = player2.score || 0;

    // Update ranking displays (universal: Fargo, ELO, etc.)
    this.updateRankingDisplays(player1.fargo, player2.fargo);

    // Update match info tabs
    const matchInfoTab1 = document.getElementById('matchInfoTab1');
    const matchInfoTab2 = document.getElementById('matchInfoTab2');
    if (matchInfoTab1) matchInfoTab1.value = state.matchData.infoTab1 || '';
    if (matchInfoTab2) matchInfoTab2.value = state.matchData.infoTab2 || '';

    // Update module enabled states
    const enableAdvertisingChk = document.getElementById('enableAdvertisingChk');
    const enableShotClockChk = document.getElementById('enableShotClockChk');
    if (enableAdvertisingChk) {
      enableAdvertisingChk.checked = state.modules?.advertising?.enabled || false;
    }
    if (enableShotClockChk) {
      enableShotClockChk.checked = state.modules?.shotClock?.enabled || false;
    }

    // NEW: Update overlay skin selector
    const skinSelect = document.getElementById('overlaySkinSelect');
    if (skinSelect && state.uiSettings?.overlaySkin) {
      skinSelect.value = state.uiSettings.overlaySkin;
    }

    // Update player photos if they exist
    this.updatePlayerPhotoUI(1, player1.photoAssetId);
    this.updatePlayerPhotoUI(2, player2.photoAssetId);

    // Update rating source badges
    this.updateRatingSourceBadge(1, player1.ratings);
    this.updateRatingSourceBadge(2, player2.ratings);
  }

  updateRankingDisplays(p1Ranking, p2Ranking) {
    const p1Display = document.getElementById('p1RankingDisplay');
    const p2Display = document.getElementById('p2RankingDisplay');

    // Show P1 ranking if available
    if (p1Display) {
      if (p1Ranking) {
        p1Display.textContent = `(${p1Ranking})`;
        p1Display.classList.remove('noShow');
      } else {
        p1Display.classList.add('noShow');
      }
    }

    // Show P2 ranking if available
    if (p2Display) {
      if (p2Ranking) {
        p2Display.textContent = `(${p2Ranking})`;
        p2Display.classList.remove('noShow');
      } else {
        p2Display.classList.add('noShow');
      }
    }
  }

  async updatePlayerPhotoUI(playerNum, assetId) {
    const img = document.getElementById(`p${playerNum}PhotoDisplay`);
    const deleteBtn = document.getElementById(`p${playerNum}PhotoDelete`);
    const textSpan = document.getElementById(`p${playerNum}PhotoText`);

    if (!img) return;

    if (assetId) {
      try {
        const objectUrl = await dexieDB.getAssetObjectUrl(assetId);
        if (objectUrl) {
          img.src = objectUrl;
          img.style.display = 'inline-block';
          deleteBtn.style.display = 'inline-block';
          textSpan.style.display = 'none';
        }
      } catch (error) {
        console.error(`Failed to load player ${playerNum} photo:`, error);
      }
    } else {
      img.src = '';
      img.style.display = 'none';
      deleteBtn.style.display = 'none';
      textSpan.style.display = 'inline';
    }
  }

  /**
   * Update rating source badge to show where the rating came from
   * @param {number} playerNum - 1 or 2
   * @param {Object} ratings - { fargo, ppd, mpr, display, source }
   */
  updateRatingSourceBadge(playerNum, ratings) {
    const badge = document.getElementById(`p${playerNum}RatingSource`);
    if (!badge) return;

    // If no ratings object, hide the badge
    if (!ratings || !ratings.source) {
      badge.style.display = 'none';
      return;
    }

    // Map sources to display labels and colors
    const sourceMap = {
      'manual': { label: 'M', color: '#3b82f6', tooltip: 'Manual Entry' },
      'scoreholio': { label: 'S', color: '#10b981', tooltip: 'Scoreholio' },
      'database': { label: 'DB', color: '#8b5cf6', tooltip: 'Local Database' },
      'player-manager': { label: 'PM', color: '#f59e0b', tooltip: 'Player Manager' }
    };

    const sourceConfig = sourceMap[ratings.source] || sourceMap['manual'];

    badge.textContent = sourceConfig.label;
    badge.title = `${sourceConfig.tooltip} - ${ratings.display?.toUpperCase() || 'Rating'}`;
    badge.style.background = sourceConfig.color;
    badge.style.display = 'inline-block';

    console.log(`✅ Player ${playerNum} rating source badge updated: ${sourceConfig.label}`);
  }

  /**
   * Update P1/P2 labels with actual player names
   */
  updatePlayerLabels(player1, player2) {
    const p1DisplayName = player1?.name || 'P1';
    const p2DisplayName = player2?.name || 'P2';

    // Update score labels
    const labels = document.querySelectorAll('#playerControls label');
    labels.forEach(label => {
      if (label.textContent === 'P1 Score:') {
        label.textContent = `${p1DisplayName} Score:`;
      } else if (label.textContent === 'P2 Score:') {
        label.textContent = `${p2DisplayName} Score:`;
      } else if (label.textContent.includes('P1 Score:')) {
        label.textContent = `${p1DisplayName} Score:`;
      } else if (label.textContent.includes('P2 Score:')) {
        label.textContent = `${p2DisplayName} Score:`;
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
const controller = new MasterController();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  controller.destroy();
});

// Make available in console for debugging and Quick Search onclick handlers
window.master = controller;
window.masterController = controller;

// Debugging helpers
window.debugState = async () => {
  const state = await stateManager.getState();
  console.log('📊 Current State:', state);
  return state;
};

window.resetState = async () => {
  if (confirm('⚠️ This will reset all match data. Continue?')) {
    await stateManager.resetMatch();
    console.log('✅ State reset complete');
    window.location.reload();
  }
};

console.log('✅ MasterController.js loaded');
console.log('💡 Debug commands: debugState(), resetState()');
