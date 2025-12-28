/**
 * DexieWrapper.js
 * Dexie.js wrapper for Dock-It.live database
 *
 * CLEAN BUILD: New database (dock_it_db) with modern schema
 * - assets: Sponsor logos, player photos, ads (Blob storage)
 * - match_state: Current game scores, timer, player info (reactive)
 */

import Dexie from 'dexie';
import { liveQuery } from 'dexie';

class DexieWrapper {
  constructor() {
    // NEW database for Dock-It.live (clean build)
    this.db = new Dexie('dock_it_db');

    // Version 1: Initial schema
    this.db.version(1).stores({
      // Assets table: Sponsor logos, ads, player photos (Blob storage)
      assets: 'id, type, tags, updatedAt',

      // Match state table: Current game data (scores, timer, players)
      match_state: 'id, sport, timestamp',
    });

    // Version 2: Add players table for player roster management
    this.db.version(2).stores({
      // Assets table: Sponsor logos, ads, player photos (Blob storage)
      assets: 'id, type, tags, updatedAt',

      // Match state table: Current game data (scores, timer, players)
      match_state: 'id, sport, timestamp',

      // Players table: Player roster with ratings, photos, and sport filter
      players: '++id, name, rating, country, photoUrl, sport',
    });

    // Version 3: Schema consolidation (no changes, just version bump to clear Dexie warning)
    this.db.version(3).stores({
      // All tables remain the same
      assets: 'id, type, tags, updatedAt',
      match_state: 'id, sport, timestamp',
      players: '++id, name, rating, country, photoUrl, sport',
    });

    // URL cache for blob object URLs (performance optimization)
    this._urlCache = new Map();
  }

  /**
   * Open database connection
   * @returns {Promise<Dexie>}
   */
  async open() {
    await this.db.open();
    return this.db;
  }

  // ============================================================================
  // ASSETS TABLE API (Sponsor Logos, Ads, Player Photos)
  // ============================================================================

  /**
   * Store asset from File object
   * @param {string} id - Unique ID (e.g., 'logo_sponsor_001', 'player_photo_1')
   * @param {File} file - File object
   * @param {Object} metadata - { type: 'sponsor|player|ad', tags: string[] }
   */
  async setAssetFromFile(id, file, metadata = {}) {
    if (!id) throw new Error('setAssetFromFile: id is required');
    if (!file) throw new Error('setAssetFromFile: file is required');

    console.log(`📤 Uploading asset: ${id} (${(file.size / 1024).toFixed(2)} KB)`);

    console.log('  → Getting image dimensions...');
    const dims = await this._getImageDimensionsFromBlob(file);
    console.log(`  → Dimensions: ${dims.width}x${dims.height}`);

    const record = {
      id,
      blob: file, // Store as Blob
      mime: file.type || 'application/octet-stream',
      name: file.name || '',
      size: file.size || 0,
      width: dims.width || 0,
      height: dims.height || 0,
      type: metadata.type || 'sponsor', // 'sponsor', 'player', 'ad'
      tags: metadata.tags || [], // For filtering/searching
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    console.log('  → Writing to database...');
    await this.db.assets.put(record);
    this._revokeUrl(id);
    console.log(`✅ Asset uploaded: ${id}`);
  }

  /**
   * Store asset from data URL
   * @param {string} id - Unique ID
   * @param {string} dataUrl - Data URL
   * @param {Object} metadata - { type, tags }
   */
  async setAssetFromDataUrl(id, dataUrl, metadata = {}) {
    if (!id) throw new Error('setAssetFromDataUrl: id is required');
    if (!dataUrl) throw new Error('setAssetFromDataUrl: dataUrl is required');

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const dims = await this._getImageDimensionsFromBlob(blob);

    const record = {
      id,
      blob,
      mime: blob.type || 'application/octet-stream',
      name: '',
      size: blob.size || 0,
      width: dims.width || 0,
      height: dims.height || 0,
      type: metadata.type || 'sponsor',
      tags: metadata.tags || [],
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    await this.db.assets.put(record);
    this._revokeUrl(id);
  }

  /**
   * Get asset by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getAsset(id) {
    if (!id) return null;
    return await this.db.assets.get(id);
  }

  /**
   * Check if asset exists
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async hasAsset(id) {
    const asset = await this.getAsset(id);
    return !!(asset && asset.blob);
  }

  /**
   * Delete asset
   * @param {string} id
   */
  async deleteAsset(id) {
    if (!id) throw new Error('deleteAsset: id is required');
    await this.db.assets.delete(id);
    this._revokeUrl(id);
  }

  /**
   * Get object URL for rendering
   * @param {string} id
   * @returns {Promise<string>}
   */
  async getAssetObjectUrl(id) {
    if (!id) return '';

    const cached = this._urlCache.get(id);
    if (cached) return cached;

    const asset = await this.getAsset(id);
    if (!asset || !asset.blob) return '';

    const url = URL.createObjectURL(asset.blob);
    this._urlCache.set(id, url);
    return url;
  }

  /**
   * List assets with filtering
   * @param {Object} opts - { type: 'sponsor|player|ad', tags: string[], limit: number }
   * @returns {Promise<Array>}
   */
  async listAssets(opts = {}) {
    let query = this.db.assets.toCollection();

    // Filter by type
    if (opts.type) {
      query = query.filter(a => a.type === opts.type);
    }

    // Filter by tags (asset must have at least one matching tag)
    if (opts.tags && opts.tags.length > 0) {
      query = query.filter(a => {
        return opts.tags.some(tag => a.tags && a.tags.includes(tag));
      });
    }

    // Sort by updatedAt descending
    const assets = await query.reverse().sortBy('updatedAt');

    // Apply limit
    if (opts.limit > 0) {
      return assets.slice(0, opts.limit);
    }

    return assets;
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>}
   */
  async getStorageStats() {
    const assets = await this.db.assets.toArray();
    let bytesUsed = 0;
    for (const a of assets) {
      bytesUsed += Number(a && a.size) || 0;
    }

    return {
      count: assets.length,
      bytesUsed,
      bytesMB: (bytesUsed / 1024 / 1024).toFixed(2),
    };
  }

  // ============================================================================
  // MATCH STATE TABLE API (Scores, Timer, Game Data)
  // ============================================================================

  /**
   * Get match state by ID
   * @param {string} id - State ID (e.g., 'current', 'billiards_match_1')
   * @returns {Promise<Object|null>}
   */
  async getMatchState(id = 'current') {
    return await this.db.match_state.get(id);
  }

  /**
   * Update match state (creates if doesn't exist)
   * @param {string} id - State ID
   * @param {Object} state - State data
   * @returns {Promise<void>}
   */
  async updateMatchState(id = 'current', state) {
    const record = {
      id,
      ...state,
      timestamp: Date.now(),
    };

    await this.db.match_state.put(record);
  }

  /**
   * Delete match state
   * @param {string} id
   */
  async deleteMatchState(id) {
    if (!id) throw new Error('deleteMatchState: id is required');
    await this.db.match_state.delete(id);
  }

  // ============================================================================
  // PLAYERS TABLE API (Player Roster Management)
  // ============================================================================

  /**
   * Add a new player to the roster
   * @param {Object} playerData - { name, rating, country, photoUrl, sport }
   * @returns {Promise<number>} The auto-generated player ID
   */
  async addPlayer(playerData) {
    if (!playerData || !playerData.name) {
      throw new Error('addPlayer: name is required');
    }

    const player = {
      name: playerData.name,
      rating: playerData.rating || '',
      country: playerData.country || '',
      photoUrl: playerData.photoUrl || '',
      sport: playerData.sport || 'billiards', // Default to billiards
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return await this.db.players.add(player);
  }

  /**
   * Get player by ID
   * @param {number} id - Player ID
   * @returns {Promise<Object|null>}
   */
  async getPlayer(id) {
    if (!id) return null;
    return await this.db.players.get(id);
  }

  /**
   * Update player information
   * @param {number} id - Player ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updatePlayer(id, updates) {
    if (!id) throw new Error('updatePlayer: id is required');

    const player = {
      ...updates,
      updatedAt: Date.now(),
    };

    await this.db.players.update(id, player);
  }

  /**
   * Delete player from roster
   * @param {number} id - Player ID
   */
  async deletePlayer(id) {
    if (!id) throw new Error('deletePlayer: id is required');
    await this.db.players.delete(id);
  }

  /**
   * List all players
   * @param {Object} opts - { sortBy: 'name'|'rating', limit: number, sport: 'billiards'|'darts'|etc }
   * @returns {Promise<Array>}
   */
  async listPlayers(opts = {}) {
    let query = this.db.players.toCollection();

    // Filter by sport if specified
    if (opts.sport) {
      query = query.filter(p => p.sport === opts.sport);
    }

    // Sort
    if (opts.sortBy === 'name') {
      query = query.sortBy('name');
    } else if (opts.sortBy === 'rating') {
      query = query.reverse().sortBy('rating');
    } else {
      // Default: sort by most recently added
      query = query.reverse().sortBy('createdAt');
    }

    const players = await query;

    // Apply limit
    if (opts.limit > 0) {
      return players.slice(0, opts.limit);
    }

    return players;
  }

  /**
   * Search players by name
   * @param {string} searchTerm
   * @returns {Promise<Array>}
   */
  async searchPlayers(searchTerm) {
    if (!searchTerm) return await this.listPlayers();

    const term = searchTerm.toLowerCase();
    return await this.db.players
      .filter(p => p.name.toLowerCase().includes(term))
      .toArray();
  }

  // ============================================================================
  // REACTIVE LIVEQUERY API (Enables instant UI updates)
  // ============================================================================

  /**
   * Observe an asset by ID (reactive)
   * Returns Observable that emits when asset changes
   *
   * Usage:
   *   dexieDB.observeAsset('logo_001').subscribe(asset => {
   *     // UI updates automatically when logo changes
   *   });
   *
   * @param {string} id - Asset ID to watch
   * @returns {Observable}
   */
  observeAsset(id) {
    if (!id) throw new Error('observeAsset: id is required');
    return liveQuery(() => this.getAsset(id));
  }

  /**
   * Observe list of assets (reactive)
   * Returns Observable that emits when assets change
   *
   * @param {Object} opts - { type, tags, limit }
   * @returns {Observable}
   */
  observeAssets(opts = {}) {
    return liveQuery(() => this.listAssets(opts));
  }

  /**
   * Observe match state (reactive) - KEY FOR SCOREBOARD UPDATES
   * Returns Observable that emits when match state changes
   *
   * Usage:
   *   dexieDB.observeMatchState('current').subscribe(state => {
   *     // Scoreboard updates automatically when score changes!
   *     updateScoreDisplay(state.player1.score, state.player2.score);
   *   });
   *
   * @param {string} id - State ID to watch
   * @returns {Observable}
   */
  observeMatchState(id = 'current') {
    return liveQuery(() => this.getMatchState(id));
  }

  /**
   * Observe storage stats (reactive)
   * @returns {Observable}
   */
  observeStorageStats() {
    return liveQuery(() => this.getStorageStats());
  }

  /**
   * Observe players list (reactive)
   * Returns Observable that emits when players change
   *
   * Usage:
   *   dexieDB.observePlayers({ sortBy: 'name' }).subscribe(players => {
   *     // Player list updates automatically when roster changes
   *     updatePlayerDropdown(players);
   *   });
   *
   * @param {Object} opts - { sortBy, limit }
   * @returns {Observable}
   */
  observePlayers(opts = {}) {
    return liveQuery(() => this.listPlayers(opts));
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Revoke object URL
   * @param {string} id
   */
  revokeObjectUrl(id) {
    if (!id) return;
    this._revokeUrl(id);
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAllData() {
    await this.db.assets.clear();
    await this.db.match_state.clear();
    await this.db.players.clear();
    this._urlCache.clear();
  }

  // ============================================================================
  // INTERNAL HELPERS (Private methods)
  // ============================================================================

  /**
   * Internal: Revoke cached URL
   * @private
   */
  _revokeUrl(id) {
    const url = this._urlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this._urlCache.delete(id);
    }
  }

  /**
   * Internal: Get image dimensions from Blob
   * @private
   */
  async _getImageDimensionsFromBlob(blob) {
    if (!blob) return { width: 0, height: 0 };

    try {
      if ('createImageBitmap' in window) {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('createImageBitmap timeout')), 5000)
        );

        const bmp = await Promise.race([
          createImageBitmap(blob),
          timeoutPromise
        ]);

        const dims = { width: bmp.width || 0, height: bmp.height || 0 };
        try {
          bmp.close();
        } catch {
          /* ignore */
        }
        return dims;
      }
    } catch (error) {
      console.warn('createImageBitmap failed, using fallback:', error.message);
      // fallback to Image loading
    }

    // Fallback with timeout
    return await new Promise(resolve => {
      const timeout = setTimeout(() => {
        console.warn('Image loading timeout - using 0x0 dimensions');
        resolve({ width: 0, height: 0 });
      }, 5000);

      try {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(url);
          resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
        };
        img.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(url);
          console.warn('Image loading error - using 0x0 dimensions');
          resolve({ width: 0, height: 0 });
        };
        img.src = url;
      } catch (error) {
        clearTimeout(timeout);
        console.warn('Image loading exception:', error.message);
        resolve({ width: 0, height: 0 });
      }
    });
  }
}

// Export singleton instance
export const dexieDB = new DexieWrapper();
export default dexieDB;
