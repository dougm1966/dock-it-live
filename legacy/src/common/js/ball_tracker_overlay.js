'use strict';

(function () {
  const CHANNEL_MAIN = 'g4-main';
  const STATE_KEY = 'ballTrackerState';

  const SOLIDS = ['1','2','3','4','5','6','7'];
  const STRIPES = ['9','10','11','12','13','14','15'];
  const NINE_BALL = ['1','2','3','4','5','6','7','8','9'];
  const TEN_BALL = ['1','2','3','4','5','6','7','8','9','10'];

  function safeParseJson(value, fallback) {
    try {
      if (!value) return fallback;
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function getDefaultState() {
    const pocketed = {};
    for (let i = 1; i <= 15; i++) pocketed[String(i)] = false;
    return {
      enabled: false,
      gameType: 'eight',
      ballSize: 35,
      assignments: { p1Set: 'unassigned', p2Set: 'unassigned' },
      defaults: { p1Default: 'solids' },
      pocketed
    };
  }

  function getEffectiveSetForPlayer(state, player) {
    const assignments = state.assignments || { p1Set: 'unassigned', p2Set: 'unassigned' };
    const defaults = state.defaults || { p1Default: 'solids' };

    if (player === 1) {
      if (assignments.p1Set && assignments.p1Set !== 'unassigned') return assignments.p1Set;
      return defaults.p1Default === 'stripes' ? 'stripes' : 'solids';
    }

    // player 2
    if (assignments.p2Set && assignments.p2Set !== 'unassigned') return assignments.p2Set;
    const p1Default = defaults.p1Default === 'stripes' ? 'stripes' : 'solids';
    return p1Default === 'solids' ? 'stripes' : 'solids';
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setBallSizeCssFromName(gameType) {
    const nameEl = document.getElementById('player1Name');
    const namePxRaw = nameEl ? Number.parseFloat(window.getComputedStyle(nameEl).fontSize) : NaN;
    const namePx = Number.isFinite(namePxRaw) ? namePxRaw : 15;
    const multiplier = 1.52;
    const px = clamp(Math.round(namePx * multiplier), 12, 26);
    document.documentElement.style.setProperty('--bt-ball-size', `${px}px`);
  }

  function ensureRacksExist() {
    return {
      p1: document.getElementById('p1BallRack'),
      p2: document.getElementById('p2BallRack'),
      mid: document.getElementById('midBallRack'),
      full: document.getElementById('fullBallRack')
    };
  }

  function hideAllRacks(racks) {
    if (racks.p1) racks.p1.classList.add('noShow');
    if (racks.p2) racks.p2.classList.add('noShow');
    if (racks.mid) racks.mid.classList.add('noShow');
    if (racks.full) racks.full.classList.add('noShow');
  }

  function showMidOnly(racks) {
    if (racks.p1) racks.p1.classList.add('noShow');
    if (racks.p2) racks.p2.classList.add('noShow');
    if (racks.mid) racks.mid.classList.remove('noShow');
    if (racks.full) racks.full.classList.add('noShow');
  }

  function showFullOnly(racks) {
    if (racks.p1) racks.p1.classList.add('noShow');
    if (racks.p2) racks.p2.classList.add('noShow');
    if (racks.mid) racks.mid.classList.add('noShow');
    if (racks.full) racks.full.classList.remove('noShow');
  }

  function showAllRacks(racks) {
    if (racks.p1) racks.p1.classList.remove('noShow');
    if (racks.p2) racks.p2.classList.remove('noShow');
    if (racks.mid) racks.mid.classList.remove('noShow');
    if (racks.full) racks.full.classList.add('noShow');
  }

  function clearRack(el) {
    if (!el) return;
    el.innerHTML = '';
  }

  function renderRack(el, ballNumbers, state, options) {
    if (!el) return;
    const pocketed = state.pocketed || {};

    for (const n of ballNumbers) {
      const img = document.createElement('img');
      img.className = 'bt-ball';
      img.alt = n;

      // Using PCLS-Balls assets as the source of truth during integration
      img.src = `./PCLS-Balls/images/render0/${n}.png`;

      const isPocketed = !!pocketed[String(n)];
      if (options && options.placeholder) img.classList.add('bt-ball--placeholder');
      if (isPocketed) img.classList.add('bt-ball--pocketed');

      el.appendChild(img);
    }
  }

  function applyState(state) {
    const racks = ensureRacksExist();
    if (!racks.p1 || !racks.p2 || !racks.mid) return;

    if (!state.enabled) {
      hideAllRacks(racks);
      return;
    }

    setBallSizeCssFromName(state.gameType);

    clearRack(racks.p1);
    clearRack(racks.p2);
    clearRack(racks.mid);
    clearRack(racks.full);

    // Switch overlay mode based on game type
    if (state.gameType === 'nine') {
      showFullOnly(racks);
      renderRack(racks.full, NINE_BALL, state, { placeholder: false });
      return;
    }

    if (state.gameType === 'ten') {
      showFullOnly(racks);
      renderRack(racks.full, TEN_BALL, state, { placeholder: false });
      return;
    }

    // Default to 8-ball under-name racks
    showAllRacks(racks);

    const p1Set = getEffectiveSetForPlayer(state, 1);
    const p2Set = getEffectiveSetForPlayer(state, 2);

    const p1Balls = p1Set === 'stripes' ? STRIPES : SOLIDS;
    const p2Balls = p2Set === 'stripes' ? STRIPES : SOLIDS;

    // Placeholder mode applies only when explicitly unassigned
    const placeholderP1 = !state.assignments || state.assignments.p1Set === 'unassigned';
    const placeholderP2 = !state.assignments || state.assignments.p2Set === 'unassigned';

    renderRack(racks.p1, p1Balls, state, { placeholder: placeholderP1 });
    renderRack(racks.p2, p2Balls, state, { placeholder: placeholderP2 });
    renderRack(racks.mid, ['8'], state, { placeholder: false });
  }

  function loadInitialState() {
    const stored = safeParseJson(localStorage.getItem(STATE_KEY), null);
    const base = getDefaultState();
    const merged = stored ? Object.assign(base, stored) : base;
    applyState(merged);
  }

  const bc = new BroadcastChannel(CHANNEL_MAIN);
  bc.onmessage = (event) => {
    const data = event.data;
    if (!data || !data.ballTracker) return;

    if (data.ballTracker.enabled === false) {
      applyState({ enabled: false, gameType: 'eight' });
      return;
    }

    const base = getDefaultState();
    const merged = Object.assign(base, data.ballTracker);
    applyState(merged);
  };

  window.addEventListener('load', loadInitialState);
})();
