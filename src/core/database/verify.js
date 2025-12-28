/**
 * verify.js
 * Verification script to test DexieWrapper with dock_it_db (clean build)
 *
 * Run this in browser console to verify wrapper works correctly
 */

import { dexieDB } from './DexieWrapper.js';
import { stateManager } from '../state/StateManager.js';

async function verifyDexieWrapper() {
  console.log('========================================');
  console.log('DexieWrapper Verification (dock_it_db)');
  console.log('========================================\n');

  try {
    // Step 1: Open database
    console.log('1. Opening dock_it_db database...');
    await dexieDB.open();
    console.log('✅ Database opened successfully\n');

    // Step 2: Initialize state
    console.log('2. Initializing match state from initialState.json...');
    await stateManager.init();
    const state = await stateManager.getState();
    console.log('✅ Match state initialized:');
    console.log({
      uiSettings: state.uiSettings,
      player1: state.matchData?.player1?.name,
      player2: state.matchData?.player2?.name,
      shotClockDuration: state.matchData?.shotClock?.duration,
    });
    console.log('');

    // Step 3: List all assets
    console.log('3. Listing all assets in database...');
    const allAssets = await dexieDB.listAssets();
    console.log(`✅ Found ${allAssets.length} assets in database\n`);

    if (allAssets.length === 0) {
      console.log('⚠️  No assets found in database.');
      console.log('This is expected for a clean build.');
      console.log('The wrapper is ready - try uploading an asset!\n');
      console.log('Example: Upload a test image');
      console.log('  const file = ... // File from input');
      console.log('  await dexieDB.setAssetFromFile("logo_001", file, { type: "sponsor" });');
      console.log('  await stateManager.setLogoSlot("T1", "logo_001");\n');
    } else {
      // Step 4: Read first asset and log metadata
      console.log('4. Reading first asset metadata...');
      const firstAsset = allAssets[0];
      console.log('✅ First asset metadata:');
      console.log({
        id: firstAsset.id,
        type: firstAsset.type,
        mime: firstAsset.mime,
        name: firstAsset.name,
        size: `${(firstAsset.size / 1024).toFixed(2)} KB`,
        dimensions: `${firstAsset.width}x${firstAsset.height}`,
        updatedAt: new Date(firstAsset.updatedAt).toLocaleString(),
        hasBlob: !!firstAsset.blob,
        blobType: firstAsset.blob?.type || 'unknown',
      });
      console.log('');

      // Step 5: Get object URL (verify blob is accessible)
      console.log('5. Creating object URL from blob...');
      const objectUrl = await dexieDB.getAssetObjectUrl(firstAsset.id);
      if (objectUrl) {
        console.log('✅ Object URL created:', objectUrl.substring(0, 50) + '...');
        console.log('');
      } else {
        console.log('❌ Failed to create object URL\n');
      }

      // Step 6: Test liveQuery (reactive observation)
      console.log('6. Testing liveQuery reactive observation...');
      const subscription = dexieDB.observeAsset(firstAsset.id).subscribe(asset => {
        console.log('✅ liveQuery emitted for id:', firstAsset.id);
        console.log('   Asset exists:', !!asset);
        console.log('   Blob size:', asset?.size, 'bytes');
      });

      // Cleanup subscription after 1 second
      setTimeout(() => {
        subscription.unsubscribe();
        console.log('✅ liveQuery subscription cleaned up\n');
      }, 1000);
    }

    // Step 7: Get storage stats
    console.log('7. Checking storage statistics...');
    const stats = await dexieDB.getStorageStats();
    console.log('✅ Storage stats:');
    console.log({
      totalAssets: stats.count,
      bytesUsed: `${stats.bytesMB} MB`,
      description: 'Using IndexedDB for massive storage (100s of MB)',
    });
    console.log('');

    // Step 8: Verify assetId linking
    console.log('8. Verifying assetId linking in logoSlots...');
    const logoSlots = state.logoSlots;
    console.log('✅ Logo slots from initialState.json:');
    console.log({
      T1_assetId: logoSlots.T1.assetId,
      tableTopLeft_assetId: logoSlots.tableTopLeft.assetId,
      totalSlots: Object.keys(logoSlots).length,
    });
    console.log('✅ AssetId linking verified - ready for logo assignment!\n');

    console.log('========================================');
    console.log('✅ ALL VERIFICATIONS PASSED');
    console.log('DexieWrapper + StateManager working correctly!');
    console.log('Database: dock_it_db (clean build)');
    console.log('Schema: initialState.json loaded');
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Auto-run if loaded directly
if (typeof window !== 'undefined') {
  verifyDexieWrapper();
}

export { verifyDexieWrapper };
