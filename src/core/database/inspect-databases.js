/**
 * inspect-databases.js
 * Diagnostic script to inspect BOTH old and new databases
 */

import Dexie from 'dexie';

async function inspectDatabases() {
  console.log('========================================');
  console.log('DATABASE INSPECTION');
  console.log('========================================\n');

  // Check OLD database (pcplscoreboard)
  console.log('📦 OLD DATABASE: pcplscoreboard');
  console.log('----------------------------------------');
  try {
    const oldDB = new Dexie('pcplscoreboard');

    // Declare all versions 1-10 (legacy compatibility)
    for (let v = 1; v <= 10; v++) {
      oldDB.version(v).stores({
        images: 'key, updatedAt'
      });
    }

    await oldDB.open();
    const oldImages = await oldDB.table('images').toArray();

    console.log(`✅ Found ${oldImages.length} images in OLD database`);
    if (oldImages.length > 0) {
      console.log('First 3 images:');
      oldImages.slice(0, 3).forEach(img => {
        console.log({
          key: img.key,
          name: img.name,
          size: `${(img.size / 1024).toFixed(2)} KB`,
          dimensions: `${img.width}x${img.height}`
        });
      });
    }
    console.log('');

    oldDB.close();
  } catch (error) {
    console.log('❌ Error reading old database:', error.message);
    console.log('');
  }

  // Check NEW database (dock_it_db)
  console.log('📦 NEW DATABASE: dock_it_db (clean build)');
  console.log('----------------------------------------');
  try {
    const newDB = new Dexie('dock_it_db');

    newDB.version(1).stores({
      assets: 'id, type, tags, updatedAt',
      match_state: 'id, sport, timestamp',
    });

    await newDB.open();
    const newAssets = await newDB.table('assets').toArray();
    const matchStates = await newDB.table('match_state').toArray();

    console.log(`✅ Found ${newAssets.length} assets in NEW database`);
    console.log(`✅ Found ${matchStates.length} match states in NEW database`);

    if (newAssets.length > 0) {
      console.log('First 3 assets:');
      newAssets.slice(0, 3).forEach(asset => {
        console.log({
          id: asset.id,
          type: asset.type,
          name: asset.name,
          size: `${(asset.size / 1024).toFixed(2)} KB`,
          dimensions: `${asset.width}x${asset.height}`
        });
      });
    }

    if (matchStates.length > 0) {
      console.log('\nMatch state preview:');
      const state = matchStates[0];
      console.log({
        id: state.id,
        player1: state.matchData?.player1?.name,
        player2: state.matchData?.player2?.name,
        hasLogoSlots: !!state.logoSlots,
        hasUISettings: !!state.uiSettings,
      });
    }
    console.log('');

    newDB.close();
  } catch (error) {
    console.log('❌ Error reading new database:', error.message);
    console.log('');
  }

  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log('The OLD database (pcplscoreboard) contains your legacy assets.');
  console.log('The NEW database (dock_it_db) is the clean build for Dock-It.live.');
  console.log('');
  console.log('Options:');
  console.log('1. Migrate assets from old to new database');
  console.log('2. Continue with clean build (upload new assets)');
  console.log('3. Switch back to wrapping old database');
  console.log('========================================\n');
}

// Auto-run
if (typeof window !== 'undefined') {
  inspectDatabases();
}

export { inspectDatabases };
