'use strict';

(function () {
  const STORAGE_ENABLED_KEY = 'ballTrackingEnabled';
  const STORAGE_STATE_KEY = 'ballTrackerState';

  const SOLIDS = ['1','2','3','4','5','6','7'];
  const STRIPES = ['9','10','11','12','13','14','15'];
  const NINE_BALL = ['1','2','3','4','5','6','7','8','9'];
  const TEN_BALL = ['1','2','3','4','5','6','7','8','9','10'];

  const DEFAULTS = {
    enabled: true,
    gameType: 'eight',
    ballSize: 35,
    assignments: { p1Set: 'unassigned', p2Set: 'unassigned' },
    defaults: { p1Default: 'solids' },
    pocketed: (() => {
      const m = {};
      for (let i = 1; i <= 15; i++) m[String(i)] = false;
      return m;
    })()
  };

  function safeParse(value, fallback) {
    try {
      if (!value) return fallback;
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function loadEnabled() {
    const v = localStorage.getItem(STORAGE_ENABLED_KEY);
    return v === 'yes';
  }

  function saveEnabled(enabled) {
    localStorage.setItem(STORAGE_ENABLED_KEY, enabled ? 'yes' : 'no');
  }

  function loadState() {
    const stored = safeParse(localStorage.getItem(STORAGE_STATE_KEY), null);
    const merged = Object.assign({}, DEFAULTS, stored || {});
    merged.assignments = Object.assign({}, DEFAULTS.assignments, (stored && stored.assignments) || {});
    merged.defaults = Object.assign({}, DEFAULTS.defaults, (stored && stored.defaults) || {});
    merged.pocketed = Object.assign({}, DEFAULTS.pocketed, (stored && stored.pocketed) || {});
    return merged;
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
  }

  function getBc() {
    // bc is defined in common/js/control_panel_post.js
    return (typeof bc !== 'undefined') ? bc : null;
  }

  function broadcastState(state) {
    const channel = getBc();
    if (!channel) return;
    channel.postMessage({ ballTracker: state });
  }

  function broadcastDisabled() {
    const channel = getBc();
    if (!channel) return;
    channel.postMessage({ ballTracker: { enabled: false } });
  }

  function setVisible(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) el.classList.remove('noShow');
    else el.classList.add('noShow');
  }

  function applyUiEnabled(enabled) {
    setVisible('updateInfoRowFull', !enabled);
    setVisible('updateInfoRowBallTracking', enabled);
  }

  function setActiveGameButtons(gameType) {
    const ids = ['btGameEight', 'btGameNine', 'btGameTen'];
    ids.forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.classList.remove('btn--active');
    });

    const map = {
      eight: 'btGameEight',
      nine: 'btGameNine',
      ten: 'btGameTen'
    };

    const activeId = map[gameType] || 'btGameEight';
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('btn--active');
  }

  function updatePocketedButtons(state) {
    const container = document.getElementById('btBallToggleRow');
    if (!container) return;
    const buttons = container.querySelectorAll('[data-ball]');
    buttons.forEach((btn) => {
      const ball = btn.getAttribute('data-ball');
      const isPocketed = !!(state.pocketed && state.pocketed[String(ball)]);
      if (isPocketed) btn.classList.add('btn--active');
      else btn.classList.remove('btn--active');
    });
  }

  function resetPocketed(state) {
    for (let i = 1; i <= 15; i++) state.pocketed[String(i)] = false;
  }

  function getEffectiveSetForPlayer(state, player) {
    const assignments = state.assignments || { p1Set: 'unassigned', p2Set: 'unassigned' };
    const defaults = state.defaults || { p1Default: 'solids' };

    if (player === 1) {
      if (assignments.p1Set && assignments.p1Set !== 'unassigned') return assignments.p1Set;
      return defaults.p1Default === 'stripes' ? 'stripes' : 'solids';
    }

    if (assignments.p2Set && assignments.p2Set !== 'unassigned') return assignments.p2Set;
    const p1Default = defaults.p1Default === 'stripes' ? 'stripes' : 'solids';
    return p1Default === 'solids' ? 'stripes' : 'solids';
  }

  function setCpVisible(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) el.classList.remove('noShow');
    else el.classList.add('noShow');
  }

  function clearCpRack(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
  }

  function togglePocketed(ball) {
    const st = loadState();
    st.pocketed = st.pocketed || {};
    const key = String(ball);
    st.pocketed[key] = !st.pocketed[key];
    saveState(st);
    broadcastState(st);
    renderControlPanelRacks(st);
  }

  function renderCpRack(id, ballNumbers, state, options) {
    const el = document.getElementById(id);
    if (!el) return;
    const pocketed = state.pocketed || {};

    clearCpRack(id);

    for (const n of ballNumbers) {
      const img = document.createElement('img');
      img.className = 'btcp-ball';
      img.alt = n;
      img.src = `./PCLS-Balls/images/render0/${n}.png`;

      const isPocketed = !!pocketed[String(n)];
      if (options && options.placeholder) img.classList.add('btcp-ball--placeholder');
      if (isPocketed) img.classList.add('btcp-ball--pocketed');

      img.addEventListener('click', () => togglePocketed(n));
      el.appendChild(img);
    }
  }

  function renderControlPanelRacks(state) {
    const enabled = !!state.enabled;
    const gameType = state.gameType || 'eight';

    setCpVisible('btCpRowP1', enabled);
    setCpVisible('btCpRowP2', enabled);

    if (!enabled) {
      clearCpRack('btCpP1Rack');
      clearCpRack('btCpP1MidRack');
      clearCpRack('btCpP1FullRack');
      clearCpRack('btCpP2Rack');
      clearCpRack('btCpP2MidRack');
      clearCpRack('btCpP2FullRack');
      return;
    }

    const isNine = gameType === 'nine';
    const isTen = gameType === 'ten';
    const isEight = !isNine && !isTen;

    // Set selectors are relevant only for 8-ball
    const p1SetEl = document.getElementById('btP1Set');
    const p2SetEl = document.getElementById('btP2Set');
    if (p1SetEl) p1SetEl.classList.toggle('noShow', !isEight);
    if (p2SetEl) p2SetEl.classList.toggle('noShow', !isEight);

    setCpVisible('btCpP1Rack', isEight);
    setCpVisible('btCpP2Rack', isEight);
    setCpVisible('btCpP1MidRack', isEight);
    setCpVisible('btCpP2MidRack', isEight);
    setCpVisible('btCpP1FullRack', !isEight);
    setCpVisible('btCpP2FullRack', !isEight);

    if (isNine || isTen) {
      const balls = isNine ? NINE_BALL : TEN_BALL;
      renderCpRack('btCpP1FullRack', balls, state, { placeholder: false });
      renderCpRack('btCpP2FullRack', balls, state, { placeholder: false });
      return;
    }

    const p1Set = getEffectiveSetForPlayer(state, 1);
    const p2Set = getEffectiveSetForPlayer(state, 2);

    const p1Balls = p1Set === 'stripes' ? STRIPES : SOLIDS;
    const p2Balls = p2Set === 'stripes' ? STRIPES : SOLIDS;

    const placeholderP1 = !state.assignments || state.assignments.p1Set === 'unassigned';
    const placeholderP2 = !state.assignments || state.assignments.p2Set === 'unassigned';

    renderCpRack('btCpP1Rack', p1Balls, state, { placeholder: placeholderP1 });
    renderCpRack('btCpP2Rack', p2Balls, state, { placeholder: placeholderP2 });
    renderCpRack('btCpP1MidRack', ['8'], state, { placeholder: false });
    renderCpRack('btCpP2MidRack', ['8'], state, { placeholder: false });
  }

  function flipDefaults(state) {
    state.defaults = state.defaults || { p1Default: 'solids' };
    state.defaults.p1Default = (state.defaults.p1Default === 'stripes') ? 'solids' : 'stripes';
  }

  function swapAssignments(state) {
    state.assignments = state.assignments || { p1Set: 'unassigned', p2Set: 'unassigned' };
    const tmp = state.assignments.p1Set;
    state.assignments.p1Set = state.assignments.p2Set;
    state.assignments.p2Set = tmp;
  }

  function init() {
    const enabledCheckbox = document.getElementById('ballTrackingEnabledSetting');
    const enabled = loadEnabled();
    if (enabledCheckbox) enabledCheckbox.checked = enabled;

    applyUiEnabled(enabled);

    // If enabled, broadcast full state; if disabled, broadcast disabled so overlay hides.
    const state = loadState();
    state.enabled = enabled;

    if (enabled) {
      saveState(state);
      broadcastState(state);
    } else {
      broadcastDisabled();
    }

    renderControlPanelRacks(state);

    // Bind enable toggle
    if (enabledCheckbox) {
      enabledCheckbox.addEventListener('change', () => {
        const isOn = !!enabledCheckbox.checked;
        saveEnabled(isOn);
        applyUiEnabled(isOn);

        const st = loadState();
        st.enabled = isOn;

        if (isOn) {
          // Ensure defaults exist
          st.defaults = st.defaults || { p1Default: 'solids' };
          if (st.defaults.p1Default !== 'solids' && st.defaults.p1Default !== 'stripes') {
            st.defaults.p1Default = 'solids';
          }
          saveState(st);
          broadcastState(st);
          renderControlPanelRacks(st);
        } else {
          broadcastDisabled();
          renderControlPanelRacks(st);
        }
      });
    }

    // Early exit if disabled
    if (!enabled) return;

    // Wire game buttons
    const st0 = loadState();
    setActiveGameButtons(st0.gameType);

    const btnEight = document.getElementById('btGameEight');
    const btnNine = document.getElementById('btGameNine');
    const btnTen = document.getElementById('btGameTen');

    function onGameSelect(gameType) {
      const st = loadState();
      st.gameType = gameType;
      resetPocketed(st);
      saveState(st);
      setActiveGameButtons(gameType);
      broadcastState(st);
      renderControlPanelRacks(st);
    }

    if (btnEight) btnEight.addEventListener('click', () => onGameSelect('eight'));
    if (btnNine) btnNine.addEventListener('click', () => onGameSelect('nine'));
    if (btnTen) btnTen.addEventListener('click', () => onGameSelect('ten'));

    // Wire assignments
    const p1Sel = document.getElementById('btP1Set');
    const p2Sel = document.getElementById('btP2Set');

    function applyGuardrails(changedPlayer) {
      const st = loadState();
      const p1 = st.assignments.p1Set;
      const p2 = st.assignments.p2Set;

      if (changedPlayer === 1) {
        if (p1 === 'unassigned') {
          st.assignments.p2Set = 'unassigned';
        } else if (p1 === 'solids') {
          st.assignments.p2Set = 'stripes';
        } else if (p1 === 'stripes') {
          st.assignments.p2Set = 'solids';
        }
      }

      if (changedPlayer === 2) {
        if (p2 === 'unassigned') {
          st.assignments.p1Set = 'unassigned';
        } else if (p2 === 'solids') {
          st.assignments.p1Set = 'stripes';
        } else if (p2 === 'stripes') {
          st.assignments.p1Set = 'solids';
        }
      }

      // Paired "Balls" behavior: if either is unassigned after adjustments, force both unassigned.
      if (st.assignments.p1Set === 'unassigned' || st.assignments.p2Set === 'unassigned') {
        st.assignments.p1Set = 'unassigned';
        st.assignments.p2Set = 'unassigned';
      }

      // Prevent invalid state
      if (st.assignments.p1Set !== 'unassigned' && st.assignments.p1Set === st.assignments.p2Set) {
        // Force p2 to opposite if conflict
        st.assignments.p2Set = (st.assignments.p1Set === 'solids') ? 'stripes' : 'solids';
      }

      saveState(st);
      if (p1Sel) p1Sel.value = st.assignments.p1Set;
      if (p2Sel) p2Sel.value = st.assignments.p2Set;
      broadcastState(st);
      renderControlPanelRacks(st);
    }

    if (p1Sel) {
      const st = loadState();
      p1Sel.value = st.assignments.p1Set;
      p1Sel.addEventListener('change', () => {
        const s = loadState();
        s.assignments.p1Set = p1Sel.value;
        saveState(s);
        applyGuardrails(1);
      });
    }

    if (p2Sel) {
      const st = loadState();
      p2Sel.value = st.assignments.p2Set;
      p2Sel.addEventListener('change', () => {
        const s = loadState();
        s.assignments.p2Set = p2Sel.value;
        saveState(s);
        applyGuardrails(2);
      });
    }

    // Reset
    const resetBtn = document.getElementById('btResetBalls');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const s = loadState();
        resetPocketed(s);
        saveState(s);
        broadcastState(s);
        renderControlPanelRacks(s);
      });
    }
  }

  window.addEventListener('load', init);
})();
