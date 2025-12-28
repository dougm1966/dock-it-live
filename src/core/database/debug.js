/**
 * debug.js
 * Debug script to inspect existing IndexedDB databases and stores
 */

async function debugIndexedDB() {
  console.log('========================================');
  console.log('IndexedDB Database Inspector');
  console.log('========================================\n');

  try {
    // Step 1: List all databases
    console.log('1. Listing all IndexedDB databases...');
    const databases = await indexedDB.databases();
    console.log('✅ Found', databases.length, 'databases:');
    databases.forEach(db => {
      console.log(`  - "${db.name}" (version ${db.version})`);
    });
    console.log('');

    // Step 2: Check if pcplscoreboard exists
    const pcplDB = databases.find(db => db.name === 'pcplscoreboard');
    if (!pcplDB) {
      console.log('❌ "pcplscoreboard" database does NOT exist!');
      console.log('This means the legacy PCPLImageDB has never been used.');
      console.log('Expected: Database should exist if you\'ve uploaded sponsor logos.\n');
      return;
    }

    console.log('✅ "pcplscoreboard" database exists (version', pcplDB.version, ')\n');

    // Step 3: Open database and inspect stores
    console.log('2. Opening "pcplscoreboard" database...');
    const openRequest = indexedDB.open('pcplscoreboard');

    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      console.log('✅ Database opened successfully');
      console.log('   Database version:', db.version);
      console.log('   Object stores:', Array.from(db.objectStoreNames).join(', ') || '(none)');
      console.log('');

      // Step 4: Check for 'images' store
      if (!db.objectStoreNames.contains('images')) {
        console.log('❌ "images" store does NOT exist in database!');
        console.log('   Available stores:', Array.from(db.objectStoreNames).join(', ') || '(none)');
        console.log('');
        db.close();
        return;
      }

      console.log('✅ "images" store exists\n');

      // Step 5: Read all records from 'images' store
      console.log('3. Reading all records from "images" store...');
      const tx = db.transaction('images', 'readonly');
      const store = tx.objectStore('images');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const records = getAllRequest.result;
        console.log('✅ Found', records.length, 'records in "images" store');
        console.log('');

        if (records.length > 0) {
          console.log('📋 Record details:');
          records.forEach((record, index) => {
            console.log(`\n  Record ${index + 1}:`);
            console.log('    key:', record.key);
            console.log('    name:', record.name);
            console.log('    mime:', record.mime);
            console.log('    size:', (record.size / 1024).toFixed(2), 'KB');
            console.log('    dimensions:', `${record.width}x${record.height}`);
            console.log('    hasBlob:', !!record.blob);
            console.log('    updatedAt:', new Date(record.updatedAt).toLocaleString());
          });
          console.log('');
        } else {
          console.log('⚠️  Store exists but contains 0 records.');
          console.log('This means images were never uploaded or were deleted.\n');
        }

        db.close();
        console.log('========================================');
        console.log('Inspection Complete');
        console.log('========================================\n');
      };

      getAllRequest.onerror = () => {
        console.error('❌ Failed to read from "images" store:', getAllRequest.error);
        db.close();
      };
    };

    openRequest.onerror = () => {
      console.error('❌ Failed to open database:', openRequest.error);
    };

    openRequest.onblocked = () => {
      console.warn('⚠️  Database opening blocked. Close other tabs/windows using this database.');
    };

  } catch (error) {
    console.error('❌ Inspection failed:', error);
    console.error('Error details:', error.message);
  }
}

// Auto-run if loaded directly
if (typeof window !== 'undefined') {
  debugIndexedDB();
}

export { debugIndexedDB };
