/**
 * AssetUploader.js
 * Modern ES6 class for uploading and validating image assets
 *
 * Features:
 * - Image validation (MIME type and file signature)
 * - File size limits
 * - Auto-generated IDs
 * - Database persistence via DexieWrapper
 * - Support for multiple asset types (sponsor, player, ad)
 */

import { dexieDB } from '../database/index.js';

export class AssetUploader {
  /**
   * Supported image MIME types
   */
  static SUPPORTED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  /**
   * Maximum file size (10MB default)
   */
  static MAX_FILE_SIZE = 10 * 1024 * 1024;

  /**
   * Upload and validate an image asset
   * @param {File} file - File object from input
   * @param {Object} options - Upload options
   * @param {string} options.id - Custom ID (auto-generated if not provided)
   * @param {string} options.type - Asset type: 'sponsor', 'player', 'ad' (default: 'sponsor')
   * @param {string[]} options.tags - Optional tags for categorization
   * @returns {Promise<Object>} - { success, id, asset, error }
   */
  static async upload(file, options = {}) {
    try {
      // Validate file exists
      if (!file) {
        return {
          success: false,
          error: 'No file provided',
        };
      }

      // Validate file is an image
      const validation = await this.validateImage(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate ID if not provided
      const id = options.id || this.generateId(options.type || 'sponsor');

      // Prepare metadata
      const metadata = {
        type: options.type || 'sponsor',
        tags: options.tags || [],
      };

      // Store in database
      await dexieDB.setAssetFromFile(id, file, metadata);

      // Retrieve the stored asset
      const asset = await dexieDB.getAsset(id);

      return {
        success: true,
        id,
        asset,
        fileName: file.name,
      };
    } catch (error) {
      console.error('AssetUploader: Upload failed', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
        fileName: file.name,
      };
    }
  }

  /**
   * Upload multiple files at once (batch upload)
   * @param {File[]} files - Array of File objects
   * @param {Object} options - Upload options (applied to all files)
   * @param {Function} onProgress - Progress callback (current, total, result)
   * @returns {Promise<Object>} - { success, results, successCount, failCount }
   */
  static async uploadBatch(files, options = {}, onProgress = null) {
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.upload(file, options);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      results.push(result);

      // Call progress callback if provided
      if (onProgress) {
        onProgress(i + 1, files.length, result);
      }
    }

    return {
      success: failCount === 0,
      results,
      successCount,
      failCount,
      total: files.length,
    };
  }

  /**
   * Validate that a file is an image
   * @param {File} file - File object to validate
   * @returns {Promise<Object>} - { valid, error }
   */
  static async validateImage(file) {
    // Check MIME type
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}. Please upload JPG, PNG, GIF, WEBP, or SVG.`,
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxMB = (this.MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
      return {
        valid: false,
        error: `File too large: ${sizeMB}MB. Maximum size is ${maxMB}MB.`,
      };
    }

    // Check file size is not zero
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty',
      };
    }

    // Validate file signature (magic bytes) for common image formats
    const signatureValid = await this.validateFileSignature(file);
    if (!signatureValid) {
      return {
        valid: false,
        error: 'File does not appear to be a valid image',
      };
    }

    return { valid: true };
  }

  /**
   * Validate file signature (magic bytes)
   * @param {File} file - File to validate
   * @returns {Promise<boolean>}
   */
  static async validateFileSignature(file) {
    try {
      // Read first 512 bytes for signature detection (handles SVG with XML declarations)
      const bytesToRead = Math.min(512, file.size);
      const slice = file.slice(0, bytesToRead);
      const arrayBuffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Check for common image signatures
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      ) {
        return true;
      }

      // JPEG: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return true;
      }

      // GIF: 47 49 46 38 (GIF8)
      if (
        bytes[0] === 0x47 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x38
      ) {
        return true;
      }

      // WEBP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
      if (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      ) {
        return true;
      }

      // SVG: Check for '<svg', '<?xml', or common SVG patterns
      // SVG files are XML-based, so we need to check more content
      if (file.type === 'image/svg+xml') {
        const text = new TextDecoder('utf-8').decode(bytes).toLowerCase();
        // Check for common SVG patterns (handle BOM, whitespace, XML declarations)
        if (
          text.includes('<svg') ||
          text.includes('<?xml') ||
          text.includes('<!doctype svg') ||
          text.includes('<svg:svg')
        ) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('AssetUploader: Signature validation failed', error);
      return true; // Allow on error to avoid false negatives
    }
  }

  /**
   * Generate unique asset ID
   * @param {string} type - Asset type prefix
   * @returns {string}
   */
  static generateId(type = 'sponsor') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}_${timestamp}_${random}`;
  }

  /**
   * Delete an asset
   * @param {string} id - Asset ID
   * @returns {Promise<Object>} - { success, error }
   */
  static async delete(id) {
    try {
      await dexieDB.deleteAsset(id);
      return { success: true };
    } catch (error) {
      console.error('AssetUploader: Delete failed', error);
      return {
        success: false,
        error: error.message || 'Delete failed',
      };
    }
  }

  /**
   * Get asset by ID
   * @param {string} id - Asset ID
   * @returns {Promise<Object|null>}
   */
  static async getAsset(id) {
    return await dexieDB.getAsset(id);
  }

  /**
   * List all assets
   * @param {Object} options - Filter options
   * @returns {Promise<Array>}
   */
  static async listAssets(options = {}) {
    return await dexieDB.listAssets(options);
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>}
   */
  static async getStats() {
    return await dexieDB.getStorageStats();
  }
}

export default AssetUploader;
