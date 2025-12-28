'use strict';

(function () {
	const CHANNEL_MAIN = 'g4-main';
	const CONFIG_KEY = 'adLayoutConfig_v1';
	let bc = null;
	let renderRunning = false;
	let renderPending = false;
	const TOP_COLS = 6;
	const SIDE_ROWS = 3;
	let colorUpdateInProgress = false;

	function safeParseJson(value, fallback) {
		try {
			if (!value) return fallback;
			return JSON.parse(value);
		} catch {
			return fallback;
		}
	}

	function getDefaultConfig() {
		return {
			showFrameArt: false,
			showTop: true,
			showLeft: true,
			showRight: true,
			frameBgColor: '#ffffff',
			frameBgAlpha: 50,
			frameBgAlphaMode: 'transparency_v2',
			top: [
				{ key: 'ad_top_1', startCol: 1, colSpan: 1 },
				{ key: 'ad_top_2', startCol: 2, colSpan: 1 },
				{ key: 'ad_top_3', startCol: 3, colSpan: 1 },
				{ key: 'ad_top_4', startCol: 4, colSpan: 1 },
				{ key: 'ad_top_5', startCol: 5, colSpan: 1 },
				{ key: 'ad_top_6', startCol: 6, colSpan: 1 }
			],
			left: [
				{ key: 'ad_left_1', startRow: 1, rowSpan: 1 },
				{ key: 'ad_left_2', startRow: 2, rowSpan: 1 },
				{ key: 'ad_left_3', startRow: 3, rowSpan: 1 }
			],
			right: [
				{ key: 'ad_right_1', startRow: 1, rowSpan: 1 },
				{ key: 'ad_right_2', startRow: 2, rowSpan: 1 },
				{ key: 'ad_right_3', startRow: 3, rowSpan: 1 }
			]
		};
	}

	function normalizeHexColor(value, fallback) {
		if (typeof value !== 'string') return fallback;
		const v = value.trim();
		if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
		if (/^#[0-9a-fA-F]{3}$/.test(v)) {
			const r = v[1];
			const g = v[2];
			const b = v[3];
			return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
		}
		return fallback;
	}

	function clampInt(value, min, max, fallback) {
		const n = Number(value);
		if (!Number.isFinite(n)) return fallback;
		return Math.max(min, Math.min(max, Math.round(n)));
	}

	function hexToRgb(hex) {
		const h = normalizeHexColor(hex, '#ffffff');
		const r = parseInt(h.slice(1, 3), 16);
		const g = parseInt(h.slice(3, 5), 16);
		const b = parseInt(h.slice(5, 7), 16);
		return { r, g, b };
	}

	function applyFrameBg(frameBgColor, frameBgAlpha) {
		const { r, g, b } = hexToRgb(frameBgColor);
		const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
		const divR = lum > 0.5 ? 0 : 255;
		const divG = lum > 0.5 ? 0 : 255;
		const divB = lum > 0.5 ? 0 : 255;
		const transparencyPct = clampInt(frameBgAlpha, 0, 100, 50);
		const a = (100 - transparencyPct) / 100;
		const bg = a > 0 ? `rgba(${r}, ${g}, ${b}, ${a})` : 'transparent';
		const dividerAlpha = 0.35;

		const root = document.getElementById('frameRoot');
		if (root) root.style.background = 'transparent';
		const top = document.getElementById('adsTop');
		if (top) top.style.background = bg;
		const left = document.getElementById('adsLeft');
		if (left) left.style.background = bg;
		const right = document.getElementById('adsRight');
		if (right) right.style.background = bg;

		document.body.style.setProperty('--ads-divider-alpha', String(dividerAlpha));
		document.body.style.setProperty('--ads-divider-rgb', `${divR}, ${divG}, ${divB}`);
	}

	function applyRegionVisibility(cfg) {
		const root = document.getElementById('frameRoot');
		if (!root) return;

		const showTop = cfg && cfg.showTop !== false;
		const showLeft = cfg && cfg.showLeft !== false;
		const showRight = cfg && cfg.showRight !== false;

		root.style.setProperty('--ads-top-h', showTop ? '125px' : '0px');
		root.style.setProperty('--ads-left-w', showLeft ? '125px' : '0px');
		root.style.setProperty('--ads-right-w', showRight ? '125px' : '0px');

		const top = document.getElementById('adsTop');
		if (top) top.style.display = showTop ? '' : 'none';
		const left = document.getElementById('adsLeft');
		if (left) left.style.display = showLeft ? '' : 'none';
		const right = document.getElementById('adsRight');
		if (right) right.style.display = showRight ? '' : 'none';
	}

	function isGuidesOn(cfg) {
		return !!(cfg && cfg.showFrameArt);
	}

	function loadConfig() {
		const def = getDefaultConfig();
		const raw = safeParseJson(localStorage.getItem(CONFIG_KEY), null);
		if (!raw || typeof raw !== 'object') return def;
		const cfg = { ...def, ...raw };
		if (!Array.isArray(raw.top)) cfg.top = def.top;
		if (!Array.isArray(raw.left)) cfg.left = def.left;
		if (!Array.isArray(raw.right)) cfg.right = def.right;
		// One-time migration from old semantics (alpha=opacity) to new semantics (alpha=transparency)
		if (raw.frameBgAlphaMode !== 'transparency_v2') {
			const oldAlpha = clampInt(cfg.frameBgAlpha, 0, 100, def.frameBgAlpha);
			cfg.frameBgAlpha = 100 - oldAlpha;
			cfg.frameBgAlphaMode = 'transparency_v2';
			if (!raw.frameBgColor || String(raw.frameBgColor).toLowerCase() === '#000000') {
				cfg.frameBgColor = def.frameBgColor;
			}
			localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
		}
		return cfg;
	}

	function clearContainer(el) {
		while (el.firstChild) el.removeChild(el.firstChild);
	}

	function applyViewportScale() {
		const root = document.getElementById('frameRoot');
		if (!root) return;

		const vw = Math.max(1, document.documentElement.clientWidth || window.innerWidth || 1);
		const vh = Math.max(1, document.documentElement.clientHeight || window.innerHeight || 1);
		const scale = Math.min(vw / 1920, vh / 1080);
		root.style.transform = `scale(${scale})`;

		const left = Math.max(0, Math.floor((vw - 1920 * scale) / 2));
		const top = Math.max(0, Math.floor((vh - 1080 * scale) / 2));
		root.style.left = `${left}px`;
		root.style.top = `${top}px`;
	}

	async function getImageUrlForKey(key) {
		let url = '';
		try {
			if (window.PCPLImageDB && window.PCPLImageDB.getObjectUrl) {
				if (window.PCPLImageDB.revokeObjectUrl) {
					window.PCPLImageDB.revokeObjectUrl(key);
				}
				url = await window.PCPLImageDB.getObjectUrl(key);
			}
		} catch {
			url = '';
		}
		if (!url) {
			url = localStorage.getItem(key) || '';
		}
		return url;
	}

	function getPlacementTitle(placement) {
		if (!placement) return '';
		return typeof placement.title === 'string' ? placement.title.trim() : '';
	}

	function createTileBase(placement) {
		const tile = document.createElement('div');
		tile.className = 'ad-tile';
		return tile;
	}

	function appendTileContent(tile, url, title, alt, placeholder) {
		if (url) {
			const img = document.createElement('img');
			img.src = url;
			img.alt = alt;
			tile.appendChild(img);
			return;
		}
		if (title) {
			const titleEl = document.createElement('div');
			titleEl.className = 'ad-title';
			if (placeholder) titleEl.classList.add('ad-title--placeholder');
			titleEl.textContent = title;
			tile.appendChild(titleEl);
		}
	}

	function placementCoversTopBoundary(placement, boundaryIndex) {
		if (!placement) return false;
		if (Number(placement.startCol) === 99) return false;
		if (placement.show === false || placement.enabled === false || placement.hidden === true) return false;
		const startCol = Number(placement.startCol) || 1;
		const colSpan = Math.max(1, Number(placement.colSpan || placement.span) || 1);
		const endCol = startCol + colSpan - 1;
		return startCol <= boundaryIndex && boundaryIndex < endCol;
	}

	function placementCoversSideBoundary(placement, boundaryIndex) {
		if (!placement) return false;
		if (Number(placement.startRow) === 99) return false;
		if (placement.show === false || placement.enabled === false || placement.hidden === true) return false;
		const startRow = Number(placement.startRow) || 1;
		const rowSpan = Math.max(1, Number(placement.rowSpan || placement.span) || 1);
		const endRow = startRow + rowSpan - 1;
		return startRow <= boundaryIndex && boundaryIndex < endRow;
	}

	function appendTopDividers(container, placements) {
		const blocked = new Set();
		for (let i = 1; i <= TOP_COLS - 1; i++) {
			for (const p of placements) {
				if (placementCoversTopBoundary(p, i)) {
					blocked.add(i);
					break;
				}
			}
		}
		for (let i = 1; i <= TOP_COLS - 1; i++) {
			if (blocked.has(i)) continue;
			const div = document.createElement('div');
			div.className = 'ads-divider ads-divider--v';
			div.style.left = `${(i / TOP_COLS) * 100}%`;
			container.appendChild(div);
		}
	}

	function appendSideDividers(container, placements) {
		const blocked = new Set();
		for (let i = 1; i <= SIDE_ROWS - 1; i++) {
			for (const p of placements) {
				if (placementCoversSideBoundary(p, i)) {
					blocked.add(i);
					break;
				}
			}
		}
		for (let i = 1; i <= SIDE_ROWS - 1; i++) {
			if (blocked.has(i)) continue;
			const div = document.createElement('div');
			div.className = 'ads-divider ads-divider--h';
			div.style.top = `${(i / SIDE_ROWS) * 100}%`;
			container.appendChild(div);
		}
	}

	async function renderTop(topConfig, guidesOn) {
		const container = document.getElementById('adsTop');
		if (!container) return;
		clearContainer(container);
		container.classList.toggle('ads-guides', !!guidesOn);

		for (const placement of Array.isArray(topConfig) ? topConfig : []) {
			if (!placement || !placement.key) continue;
			// Skip off-grid ads (startCol = 99)
			if (Number(placement.startCol) === 99) continue;
			if (placement.show === false || placement.enabled === false || placement.hidden === true) continue;
			const imageKey = typeof placement.imageKey === 'string' && placement.imageKey ? placement.imageKey : placement.key;
			const url = await getImageUrlForKey(imageKey);
			const title = getPlacementTitle(placement);
			const placeholder = !!(guidesOn && !url && !title);
			if (!url && !title && !guidesOn) continue;
			const displayTitle = placeholder ? placement.key : title;

			const tile = createTileBase(placement);
			const startCol = Number(placement.startCol) || 1;
			// Use rendered span for display (may be reduced due to overflow)
			const colSpan = Math.max(1, Number(placement.colSpan || placement.span) || 1);
			tile.style.gridColumn = `${startCol} / span ${colSpan}`;
			appendTileContent(tile, url, displayTitle, placement.key, placeholder);

			container.appendChild(tile);
		}

		if (guidesOn) {
			appendTopDividers(container, Array.isArray(topConfig) ? topConfig : []);
		}
	}

	async function renderSide(containerId, sideConfig, guidesOn) {
		const container = document.getElementById(containerId);
		if (!container) return;
		clearContainer(container);
		container.classList.toggle('ads-guides', !!guidesOn);

		for (const placement of Array.isArray(sideConfig) ? sideConfig : []) {
			if (!placement || !placement.key) continue;
			// Skip off-grid ads (startRow = 99)
			if (Number(placement.startRow) === 99) continue;
			if (placement.show === false || placement.enabled === false || placement.hidden === true) continue;
			const imageKey = typeof placement.imageKey === 'string' && placement.imageKey ? placement.imageKey : placement.key;
			const url = await getImageUrlForKey(imageKey);
			const title = getPlacementTitle(placement);
			const placeholder = !!(guidesOn && !url && !title);
			if (!url && !title && !guidesOn) continue;
			const displayTitle = placeholder ? placement.key : title;

			const tile = createTileBase(placement);
			const startRow = Number(placement.startRow) || 1;
			// Use rendered span for display (may be reduced due to overflow)
			const rowSpan = Math.max(1, Number(placement.rowSpan || placement.span) || 1);
			tile.style.gridRow = `${startRow} / span ${rowSpan}`;
			appendTileContent(tile, url, displayTitle, placement.key, placeholder);

			container.appendChild(tile);
		}

		if (guidesOn) {
			appendSideDividers(container, Array.isArray(sideConfig) ? sideConfig : []);
		}
	}

	async function renderAll() {
		const cfg = loadConfig();
		const guidesOn = isGuidesOn(cfg);
		document.body.classList.toggle('ads-guides-on', guidesOn);
		applyRegionVisibility(cfg);

		applyFrameBg(cfg.frameBgColor, cfg.frameBgAlpha);

		await renderTop(cfg.top, guidesOn);
		await renderSide('adsLeft', cfg.left, guidesOn);
		await renderSide('adsRight', cfg.right, guidesOn);
	}

	function requestRenderAll() {
		renderPending = true;
		if (renderRunning) return;
		renderRunning = true;
		(async () => {
			while (renderPending) {
				renderPending = false;
				try {
					await renderAll();
				} catch {
					// ignore
				}
			}
			renderRunning = false;
		})();
	}

	function setupChannel() {
		try {
			if (bc) return;
			bc = new BroadcastChannel(CHANNEL_MAIN);
			bc.onmessage = (event) => {
				const data = event.data;
				if (!data) return;
				if (data.ads === 'refresh') {
					requestRenderAll();
					return;
				}
				if (data.ads === 'frameBg') {
					colorUpdateInProgress = data.colorOnly || false;
					applyFrameBg(data.frameBgColor, data.frameBgAlpha);
					// Reset flag after a short delay to allow storage events to settle
					if (colorUpdateInProgress) {
						setTimeout(() => { colorUpdateInProgress = false; }, 100);
					}
					return;
				}
			};
		} catch {
			// ignore
		}
	}

	window.addEventListener('storage', function (e) {
		if (!e) return;
		if (e.key === CONFIG_KEY && !colorUpdateInProgress) {
			requestRenderAll();
		}
	});

	window.addEventListener('load', function () {
		applyViewportScale();
		requestRenderAll();
		setupChannel();
	});

	window.addEventListener('resize', function () {
		applyViewportScale();
	});
})();
