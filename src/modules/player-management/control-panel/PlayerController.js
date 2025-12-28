/**
 * PlayerController.js
 * Player Roster Management Module
 *
 * Manages:
 * - Player database (name, rating, country, photo)
 * - Add/Edit/Delete players
 * - Player list with search/filter
 * - Load player to Master Control Panel
 *
 * Uses Dexie.js for persistent player roster storage
 */

import { dexieDB } from '../../../core/database/DexieWrapper.js';
import { messenger } from '../../../core/messaging/BroadcastMessenger.js';

class PlayerController {
  constructor() {
    this.playersSubscription = null;
    this.currentPlayers = [];
    this.currentSportFilter = ''; // Empty string means "All Sports"
    this.init();
  }

  /**
   * Initialize the player management module
   */
  async init() {
    console.log('👥 Player Management Module (Pro) initializing...');

    try {
      // Initialize Dexie database
      await dexieDB.open();
      console.log('✅ Database ready');

      // Setup dock mode
      this.setupDockMode();

      // Setup form controls
      this.setupFormControls();

      // Setup reactive player list subscription
      this.setupPlayerSubscription();

      // Initial render
      await this.renderPlayerList();

      console.log('✅ Player Management Module (Pro) ready!');
      console.log('📡 Broadcasting enabled - Master Shell will receive player selections');
    } catch (error) {
      console.error('❌ Player Management Module initialization failed:', error);
    }
  }

  // ============================================================================
  // DOCK MODE CONTROLS (OBS Panel Optimization)
  // ============================================================================

  /**
   * Setup Dock Mode for OBS panel optimization
   */
  setupDockMode() {
    // Check localStorage for saved dock mode preference
    const savedDockMode = localStorage.getItem('playerManager_dockMode');
    if (savedDockMode === 'true') {
      document.body.classList.add('dock-mode');
    }

    // Setup dock mode toggle button (in header)
    const dockModeToggle = document.getElementById('dockModeToggle');
    if (dockModeToggle) {
      dockModeToggle.addEventListener('click', () => {
        this.toggleDockMode();
      });
    }

    // Setup floating dock mode toggle (visible in dock mode)
    const dockModeFloatToggle = document.getElementById('dockModeFloatToggle');
    if (dockModeFloatToggle) {
      dockModeFloatToggle.addEventListener('click', () => {
        this.toggleDockMode();
      });
    }

    console.log('✅ Dock Mode setup complete');
  }

  /**
   * Toggle Dock Mode on/off
   */
  toggleDockMode() {
    const isDockMode = document.body.classList.toggle('dock-mode');

    // Save preference to localStorage
    localStorage.setItem('playerManager_dockMode', isDockMode.toString());

    // Update toggle button state
    const dockModeToggle = document.getElementById('dockModeToggle');
    if (dockModeToggle) {
      if (isDockMode) {
        dockModeToggle.classList.add('active');
      } else {
        dockModeToggle.classList.remove('active');
      }
    }

    console.log(`📐 Dock Mode: ${isDockMode ? 'ON' : 'OFF'}`);
  }

  // ============================================================================
  // PLAYER SUBSCRIPTION
  // ============================================================================

  /**
   * Setup reactive subscription for player list
   */
  setupPlayerSubscription() {
    // Observe players with reactive updates
    const opts = { sortBy: 'name' };
    if (this.currentSportFilter) {
      opts.sport = this.currentSportFilter;
    }

    this.playersSubscription = dexieDB.observePlayers(opts).subscribe({
      next: (players) => {
        this.currentPlayers = players || [];
        this.renderPlayerList();
      },
      error: (err) => console.error('❌ Player subscription error:', err),
    });
  }

  /**
   * Refresh player subscription with current filters
   */
  refreshPlayerSubscription() {
    // Unsubscribe from old subscription
    if (this.playersSubscription) {
      this.playersSubscription.unsubscribe();
    }

    // Create new subscription with updated filters
    this.setupPlayerSubscription();
  }

  // ============================================================================
  // FORM CONTROLS
  // ============================================================================

  setupFormControls() {
    // Add Player button
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener('click', () => this.handleAddPlayer());
    }

    // CSV Import button
    const csvImportBtn = document.getElementById('csvImportBtn');
    const csvImportInput = document.getElementById('csvImportInput');
    if (csvImportBtn && csvImportInput) {
      csvImportBtn.addEventListener('click', () => csvImportInput.click());
      csvImportInput.addEventListener('change', (e) => this.handleCSVImport(e));
    }

    // Search input
    const searchInput = document.getElementById('playerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Sport filter select
    const sportFilterSelect = document.getElementById('sportFilterSelect');
    if (sportFilterSelect) {
      sportFilterSelect.addEventListener('change', (e) => this.handleSportFilter(e.target.value));
    }

    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => this.clearSearch());
    }
  }

  /**
   * Handle Add Player form submission
   */
  async handleAddPlayer() {
    const nameInput = document.getElementById('playerNameInput');
    const ratingInput = document.getElementById('playerRatingInput');
    const countryInput = document.getElementById('playerCountryInput');
    const sportSelect = document.getElementById('playerSportSelect');

    if (!nameInput) {
      console.error('❌ Player name input not found');
      return;
    }

    const name = nameInput.value.trim();
    const rating = ratingInput?.value.trim() || '';
    const country = countryInput?.value.trim() || '';
    const sport = sportSelect?.value || 'billiards';

    if (!name) {
      alert('Player name is required!');
      return;
    }

    try {
      const playerId = await dexieDB.addPlayer({
        name,
        rating,
        country,
        sport,
        photoUrl: '', // Placeholder for future photo upload
      });

      console.log(`✅ Player added: ${name} (${sport}) (ID: ${playerId})`);

      // Clear form
      nameInput.value = '';
      if (ratingInput) ratingInput.value = '';
      if (countryInput) countryInput.value = '';
      if (sportSelect) sportSelect.value = 'billiards'; // Reset to default

      // Focus back on name input
      nameInput.focus();

      // Show success message
      this.showSuccessMessage(`Added ${name} to roster!`);
    } catch (error) {
      console.error('❌ Failed to add player:', error);
      alert(`Error adding player: ${error.message}`);
    }
  }

  /**
   * Handle CSV/Excel import
   */
  async handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📥 CSV Import started:', file.name);
    this.showImportStatus('Reading file...', 'info');

    try {
      const text = await file.text();
      const players = this.parseCSV(text);

      if (players.length === 0) {
        throw new Error('No valid players found in CSV file');
      }

      console.log(`📋 Parsed ${players.length} players from CSV`);
      this.showImportStatus(`Importing ${players.length} players...`, 'info');

      // Import players in batch
      let successCount = 0;
      let skipCount = 0;

      for (const playerData of players) {
        try {
          await dexieDB.addPlayer(playerData);
          successCount++;
        } catch (error) {
          console.warn(`⚠️ Skipped player "${playerData.name}":`, error.message);
          skipCount++;
        }
      }

      // Show success message
      const message = `✅ Imported ${successCount} players successfully!${skipCount > 0 ? ` (${skipCount} skipped)` : ''}`;
      this.showImportStatus(message, 'success');
      console.log(message);

      // Clear file input
      event.target.value = '';

      // Refresh player list
      this.refreshPlayerSubscription();
    } catch (error) {
      console.error('❌ CSV import failed:', error);
      this.showImportStatus(`Import failed: ${error.message}`, 'error');
      alert(`CSV import failed: ${error.message}`);
    }
  }

  /**
   * Parse CSV text into player objects
   * Expected format: Name,Rating,Country[,Sport]
   * @param {string} csvText
   * @returns {Array<Object>}
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const players = [];

    // Skip header row if it exists
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('name') && (firstLine.includes('rating') || firstLine.includes('fargo'))) {
      startIndex = 1;
      console.log('📋 CSV header detected, skipping first row');
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      // Split by comma, handling quoted fields
      const fields = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const cleanFields = fields.map(f => f.replace(/^"|"$/g, '').trim());

      if (cleanFields.length < 1) continue; // Need at least a name

      const [name, rating = '', country = '', sport = 'billiards'] = cleanFields;

      if (!name) continue; // Skip if no name

      players.push({
        name,
        rating,
        country,
        sport,
      });
    }

    return players;
  }

  /**
   * Show import status message
   */
  showImportStatus(message, type = 'info') {
    const statusDiv = document.getElementById('importStatus');
    const statusText = document.getElementById('importStatusText');

    if (!statusDiv || !statusText) return;

    statusText.textContent = message;
    statusDiv.style.display = 'block';

    // Color coding
    if (type === 'success') {
      statusDiv.style.background = '#d1fae5';
      statusDiv.style.color = '#065f46';
    } else if (type === 'error') {
      statusDiv.style.background = '#fee2e2';
      statusDiv.style.color = '#991b1b';
    } else {
      statusDiv.style.background = 'var(--bg-secondary)';
      statusDiv.style.color = 'inherit';
    }

    // Auto-hide after 5 seconds if success
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Handle player search
   */
  async handleSearch(searchTerm) {
    const opts = { sortBy: 'name' };

    // Apply sport filter if set
    if (this.currentSportFilter) {
      opts.sport = this.currentSportFilter;
    }

    if (!searchTerm || searchTerm.trim() === '') {
      // Show all players (with sport filter if set)
      this.currentPlayers = await dexieDB.listPlayers(opts);
    } else {
      // Search players (then filter by sport if needed)
      const allMatches = await dexieDB.searchPlayers(searchTerm);

      if (this.currentSportFilter) {
        this.currentPlayers = allMatches.filter(p => p.sport === this.currentSportFilter);
      } else {
        this.currentPlayers = allMatches;
      }
    }

    this.renderPlayerList();
  }

  /**
   * Handle sport filter change
   */
  handleSportFilter(sport) {
    this.currentSportFilter = sport;
    console.log('🎯 Sport filter changed:', sport || 'All Sports');

    // Refresh the subscription with new filter
    this.refreshPlayerSubscription();

    // Also refresh current search if there is one
    const searchInput = document.getElementById('playerSearchInput');
    if (searchInput && searchInput.value) {
      this.handleSearch(searchInput.value);
    }
  }

  /**
   * Clear search input and show all players
   */
  clearSearch() {
    const searchInput = document.getElementById('playerSearchInput');
    if (searchInput) {
      searchInput.value = '';
    }

    const sportFilterSelect = document.getElementById('sportFilterSelect');
    if (sportFilterSelect) {
      sportFilterSelect.value = '';
      this.currentSportFilter = '';
    }

    this.refreshPlayerSubscription();
  }

  /**
   * Delete player from roster
   */
  async handleDeletePlayer(playerId, playerName) {
    if (!confirm(`Delete ${playerName} from roster?`)) {
      return;
    }

    try {
      await dexieDB.deletePlayer(playerId);
      console.log(`✅ Player deleted: ${playerName} (ID: ${playerId})`);
      this.showSuccessMessage(`Removed ${playerName} from roster`);
    } catch (error) {
      console.error('❌ Failed to delete player:', error);
      alert(`Error deleting player: ${error.message}`);
    }
  }

  /**
   * Load player into Master Control Panel (Remote Control Broadcasting)
   * @param {number} playerId - Player ID
   * @param {number} playerSlot - Player slot (1 or 2)
   */
  async handleLoadPlayer(playerId, playerSlot) {
    try {
      // Get player data from database
      const player = await dexieDB.getPlayer(playerId);

      if (!player) {
        alert('Player not found!');
        return;
      }

      console.log(`📤 BROADCASTING PLAYER SELECTION:`);
      console.log(`   Player: ${player.name}`);
      console.log(`   Slot: P${playerSlot}`);
      console.log(`   Rating: ${player.rating || 'N/A'}`);
      console.log(`   Sport: ${player.sport || 'billiards'}`);

      // BROADCAST MESSAGE TO MASTER SHELL
      // This is the "Remote Control" logic - Player Manager operates independently
      // and broadcasts player selections to the Master Control Panel
      messenger.send('PLAYER_SELECTED', {
        playerSlot,
        playerData: {
          name: player.name,
          rating: player.rating || '',
          country: player.country || '',
          sport: player.sport || 'billiards',
          photoUrl: player.photoUrl || '',
        },
      });

      // Show success message
      this.showSuccessMessage(`Loaded ${player.name} as Player ${playerSlot}!`);

      console.log(`✅ BROADCAST COMPLETE: ${player.name} → P${playerSlot}`);
      console.log('📡 Master Shell should receive this message and update the UI');
    } catch (error) {
      console.error('❌ Failed to load player:', error);
      alert(`Error loading player: ${error.message}`);
    }
  }

  // ============================================================================
  // UI RENDERING
  // ============================================================================

  /**
   * Render player list table
   */
  renderPlayerList() {
    const playerListContainer = document.getElementById('playerListContainer');
    if (!playerListContainer) return;

    // Update player count
    const countDisplay = document.getElementById('playerCountDisplay');
    if (countDisplay) {
      countDisplay.textContent = this.currentPlayers.length;
    }

    // Empty state
    if (this.currentPlayers.length === 0) {
      playerListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <p>No players in roster</p>
          <p style="font-size: 0.9em; margin-top: 10px;">Add your first player above!</p>
        </div>
      `;
      return;
    }

    // Build player table
    const rows = this.currentPlayers
      .map(
        (player) => `
      <tr>
        <td style="font-weight: 500;">${this.escapeHtml(player.name)}</td>
        <td>${this.escapeHtml(player.rating || '-')}</td>
        <td>${this.escapeHtml(player.country || '-')}</td>
        <td style="text-transform: capitalize;">${this.escapeHtml(player.sport || 'billiards')}</td>
        <td>
          <div class="action-buttons">
            <button
              class="btn hover greenBtn load-player-btn"
              data-player-id="${player.id}"
              data-player-slot="1"
              title="Load as Player 1">
              Load P1
            </button>
            <button
              class="btn hover greenBtn load-player-btn"
              data-player-id="${player.id}"
              data-player-slot="2"
              title="Load as Player 2">
              Load P2
            </button>
            <button
              class="btn hover redBtn delete-player-btn"
              data-player-id="${player.id}"
              data-player-name="${this.escapeHtml(player.name)}"
              title="Delete player">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    playerListContainer.innerHTML = `
      <table class="player-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rating (Fargo)</th>
            <th>Country</th>
            <th>Sport</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    // Attach load player button listeners
    playerListContainer.querySelectorAll('.load-player-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const playerId = parseInt(e.target.dataset.playerId, 10);
        const playerSlot = parseInt(e.target.dataset.playerSlot, 10);
        this.handleLoadPlayer(playerId, playerSlot);
      });
    });

    // Attach delete button listeners
    playerListContainer.querySelectorAll('.delete-player-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const playerId = parseInt(e.target.dataset.playerId, 10);
        const playerName = e.target.dataset.playerName;
        this.handleDeletePlayer(playerId, playerName);
      });
    });
  }

  /**
   * Show success message (toast notification)
   */
  showSuccessMessage(message) {
    const statusDisplay = document.getElementById('playerStatusDisplay');
    if (!statusDisplay) return;

    statusDisplay.textContent = message;
    statusDisplay.style.color = '#10b981'; // Green
    statusDisplay.style.opacity = '1';

    // Fade out after 3 seconds
    setTimeout(() => {
      statusDisplay.style.opacity = '0';
    }, 3000);
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
  // CLEANUP
  // ============================================================================

  /**
   * Cleanup on unload
   */
  destroy() {
    if (this.playersSubscription) {
      this.playersSubscription.unsubscribe();
    }
  }
}

// Initialize controller
const controller = new PlayerController();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  controller.destroy();
});

// Make available in console for debugging
window.playerController = controller;

console.log('✅ PlayerController.js loaded');
