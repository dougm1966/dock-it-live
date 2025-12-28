/**
 * debug-assets.js
 * Quick debugging script for asset upload and database verification
 */

import { dexieDB } from './index.js';
import { AssetUploader } from '../ads/AssetUploader.js';

/**
 * Test database connection and asset storage
 */
export async function testAssetStorage() {
  console.log('🔍 Testing Asset Storage System');
  console.log('━'.repeat(50));

  try {
    // 1. Open database
    console.log('1️⃣ Opening database...');
    await dexieDB.open();
    console.log('✅ Database opened:', dexieDB.db.name);

    // 2. Get storage stats
    console.log('\n2️⃣ Checking storage...');
    const stats = await dexieDB.getStorageStats();
    console.log('📊 Storage Stats:', stats);

    // 3. List existing assets
    console.log('\n3️⃣ Listing assets...');
    const assets = await dexieDB.listAssets();
    console.log(`📦 Found ${assets.length} assets:`);
    assets.forEach((asset, i) => {
      console.log(`   ${i + 1}. ${asset.name || asset.id} (${asset.type})`);
      console.log(`      Size: ${(asset.size / 1024).toFixed(2)} KB`);
      console.log(`      Dimensions: ${asset.width}×${asset.height}`);
    });

    // 4. Test creating a simple test asset
    console.log('\n4️⃣ Creating test asset...');
    const testBlob = new Blob(['test data'], { type: 'image/png' });
    const testFile = new File([testBlob], 'test.png', { type: 'image/png' });

    // Note: This will fail validation due to invalid image signature
    const result = await AssetUploader.upload(testFile, {
      type: 'sponsor',
      tags: ['test'],
    });

    if (result.success) {
      console.log('✅ Test asset created:', result.id);
    } else {
      console.log('❌ Test asset failed (expected):', result.error);
    }

    console.log('\n━'.repeat(50));
    console.log('✅ Asset storage system is working!');
    console.log('\nTo upload a real image:');
    console.log('1. Open control-panel.html');
    console.log('2. Click "Upload Logo" button');
    console.log('3. Select an image file');
    console.log('\nDatabase: dock_it_db');
    console.log('Store: assets');

    return { success: true, stats, assets };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all test data
 */
export async function clearTestData() {
  console.log('🗑️ Clearing test data...');
  try {
    await dexieDB.clearAllData();
    console.log('✅ All data cleared');
  } catch (error) {
    console.error('❌ Clear failed:', error);
  }
}

// Make available globally for console testing
window.testAssetStorage = testAssetStorage;
window.clearTestData = clearTestData;
window.dexieDB = dexieDB;
window.AssetUploader = AssetUploader;

console.log('🛠️ Debug tools loaded:');
console.log('  testAssetStorage() - Test the asset storage system');
console.log('  clearTestData() - Clear all test data');
console.log('  dexieDB - Direct database access');
console.log('  AssetUploader - Asset uploader class');
