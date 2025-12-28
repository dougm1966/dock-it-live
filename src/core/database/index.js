/**
 * Database Module Public API
 *
 * Exports the Dexie.js wrapper for the existing pcplscoreboard IndexedDB database.
 *
 * Usage:
 *   import { dexieDB } from '@core/database';
 *
 *   // Legacy-compatible API
 *   await dexieDB.setFromFile('logo', file);
 *   const record = await dexieDB.getRecord('logo');
 *
 *   // Reactive API (NEW - instant updates)
 *   dexieDB.observeRecord('logo').subscribe(record => {
 *     // UI updates automatically when logo changes
 *   });
 */

export { dexieDB, default } from './DexieWrapper.js';
