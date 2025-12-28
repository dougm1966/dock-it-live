'use strict';

(function () {
	const DB_NAME = 'pcplscoreboard';
	const DB_VERSION = 1;
	const STORE_NAME = 'images';

	/**
	 * Minimal IndexedDB image storage.
	 * Stores blobs keyed by logical ID (e.g. leftSponsorLogo, player1_photo, sponsorAd_001).
	 */
	class PCPLImageDB {
		constructor() {
			this._dbPromise = null;
			this._urlCache = new Map();
		}

		async _getImageDimensionsFromBlob(blob) {
			if (!blob) return { width: 0, height: 0 };
			try {
				if ('createImageBitmap' in window) {
					const bmp = await createImageBitmap(blob);
					const dims = { width: bmp.width || 0, height: bmp.height || 0 };
					try { bmp.close(); } catch { /* ignore */ }
					return dims;
				}
			} catch {
				// ignore
			}
			return await new Promise((resolve) => {
				try {
					const url = URL.createObjectURL(blob);
					const img = new Image();
					img.onload = () => {
						URL.revokeObjectURL(url);
						resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
					};
					img.onerror = () => {
						URL.revokeObjectURL(url);
						resolve({ width: 0, height: 0 });
					};
					img.src = url;
				} catch {
					resolve({ width: 0, height: 0 });
				}
			});
		}

		_open() {
			if (this._dbPromise) return this._dbPromise;

			this._dbPromise = new Promise((resolve, reject) => {
				if (!('indexedDB' in window)) {
					reject(new Error('IndexedDB is not available in this browser context.'));
					return;
				}

				const req = indexedDB.open(DB_NAME, DB_VERSION);
				req.onerror = () => reject(req.error);
				req.onupgradeneeded = () => {
					const db = req.result;
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						db.createObjectStore(STORE_NAME, { keyPath: 'key' });
					}
				};
				req.onsuccess = () => resolve(req.result);
			});

			return this._dbPromise;
		}

		async setFromFile(key, file) {
			if (!key) throw new Error('setFromFile: key is required');
			if (!file) throw new Error('setFromFile: file is required');

			const dims = await this._getImageDimensionsFromBlob(file);

			const db = await this._open();
			const record = {
				key,
				blob: file,
				mime: file.type || 'application/octet-stream',
				name: file.name || '',
				size: file.size || 0,
				width: dims.width || 0,
				height: dims.height || 0,
				updatedAt: Date.now()
			};

			await new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				tx.onabort = () => reject(tx.error);
				tx.onerror = () => reject(tx.error);
				tx.oncomplete = () => resolve();
				tx.objectStore(STORE_NAME).put(record);
			});

			this._revokeUrl(key);
		}

		async setFromDataUrl(key, dataUrl) {
			if (!key) throw new Error('setFromDataUrl: key is required');
			if (!dataUrl) throw new Error('setFromDataUrl: dataUrl is required');

			const res = await fetch(dataUrl);
			const blob = await res.blob();
			const dims = await this._getImageDimensionsFromBlob(blob);
			const db = await this._open();

			const record = {
				key,
				blob,
				mime: blob.type || 'application/octet-stream',
				name: '',
				size: blob.size || 0,
				width: dims.width || 0,
				height: dims.height || 0,
				updatedAt: Date.now()
			};

			await new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				tx.onabort = () => reject(tx.error);
				tx.onerror = () => reject(tx.error);
				tx.oncomplete = () => resolve();
				tx.objectStore(STORE_NAME).put(record);
			});

			this._revokeUrl(key);
		}

		async has(key) {
			const rec = await this.getRecord(key);
			return !!(rec && rec.blob);
		}

		async delete(key) {
			if (!key) throw new Error('delete: key is required');
			const db = await this._open();

			await new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				tx.onabort = () => reject(tx.error);
				tx.onerror = () => reject(tx.error);
				tx.oncomplete = () => resolve();
				tx.objectStore(STORE_NAME).delete(key);
			});

			this._revokeUrl(key);
		}

		async getRecord(key) {
			if (!key) return null;
			const db = await this._open();

			return await new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readonly');
				tx.onabort = () => reject(tx.error);
				tx.onerror = () => reject(tx.error);

				const req = tx.objectStore(STORE_NAME).get(key);
				req.onerror = () => reject(req.error);
				req.onsuccess = () => resolve(req.result || null);
			});
		}

		async getObjectUrl(key) {
			if (!key) return '';
			const cached = this._urlCache.get(key);
			if (cached) return cached;

			const record = await this.getRecord(key);
			if (!record || !record.blob) return '';

			const url = URL.createObjectURL(record.blob);
			this._urlCache.set(key, url);
			return url;
		}

		async listRecords(opts = {}) {
			const keyPrefix = typeof opts.keyPrefix === 'string' ? opts.keyPrefix : '';
			const limit = Number.isFinite(Number(opts.limit)) ? Math.max(0, Math.floor(Number(opts.limit))) : 0;

			const db = await this._open();
			const rows = await new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readonly');
				tx.onabort = () => reject(tx.error);
				tx.onerror = () => reject(tx.error);

				const req = tx.objectStore(STORE_NAME).getAll();
				req.onerror = () => reject(req.error);
				req.onsuccess = () => resolve(req.result || []);
			});

			let out = Array.isArray(rows) ? rows : [];
			if (keyPrefix) out = out.filter(r => r && typeof r.key === 'string' && r.key.startsWith(keyPrefix));
			out.sort((a, b) => (Number(b && b.updatedAt) || 0) - (Number(a && a.updatedAt) || 0));
			if (limit > 0) out = out.slice(0, limit);
			return out;
		}

		async getStorageStats(opts = {}) {
			const softLimitBytes = Number.isFinite(Number(opts.softLimitBytes))
				? Math.max(0, Math.floor(Number(opts.softLimitBytes)))
				: 0;

			const records = await this.listRecords();
			let bytesUsed = 0;
			for (const r of records) {
				bytesUsed += Number(r && r.size) || 0;
			}

			return {
				count: records.length,
				bytesUsed,
				softLimitBytes,
				bytesRemaining: softLimitBytes > 0 ? Math.max(0, softLimitBytes - bytesUsed) : 0
			};
		}

		async estimateQuota() {
			try {
				if (navigator && navigator.storage && navigator.storage.estimate) {
					return await navigator.storage.estimate();
				}
			} catch {
				// ignore
			}
			return null;
		}

		revokeObjectUrl(key) {
			if (!key) return;
			this._revokeUrl(key);
		}

		_revokeUrl(key) {
			const url = this._urlCache.get(key);
			if (url) {
				URL.revokeObjectURL(url);
				this._urlCache.delete(key);
			}
		}
	}

	if (!window.PCPLImageDB) {
		window.PCPLImageDB = new PCPLImageDB();
	}
})();
