'use strict';

(function () {
  const STORAGE_ENABLED_KEY = 'ballTrackingEnabled';
  const STORAGE_STATE_KEY = 'ballTrackerState';

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
    setVisible('ballTrackerSection', enabled);
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
        } else {
          broadcastDisabled();
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
      updatePocketedButtons(st);
      broadcastState(st);
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

      // Auto-assign opposite when one is chosen
      if (changedPlayer === 1 && (p1 === 'solids' || p1 === 'stripes')) {
        st.assignments.p2Set = (p1 === 'solids') ? 'stripes' : 'solids';
      }
      if (changedPlayer === 2 && (p2 === 'solids' || p2 === 'stripes')) {
        st.assignments.p1Set = (p2 === 'solids') ? 'stripes' : 'solids';
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

    // Swap
    const swapBtn = document.getElementById('btSwapSets');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        const st = loadState();
        if ((st.assignments.p1Set === 'unassigned') && (st.assignments.p2Set === 'unassigned')) {
          flipDefaults(st);
        } else {
          swapAssignments(st);
        }
        saveState(st);
        if (p1Sel) p1Sel.value = st.assignments.p1Set;
        if (p2Sel) p2Sel.value = st.assignments.p2Set;
        broadcastState(st);
      });
    }

    // Size
    const sizeSel = document.getElementById('btBallSize');
    if (sizeSel) {
      const st = loadState();
      sizeSel.value = String(st.ballSize);
      sizeSel.addEventListener('change', () => {
        const s = loadState();
        s.ballSize = Number(sizeSel.value);
        saveState(s);
        broadcastState(s);
      });
    }

    // Show/Hide (enabled in state)
    const showHideBtn = document.getElementById('btShowHide');
    function syncShowHideButton(st) {
      if (!showHideBtn) return;
      showHideBtn.textContent = st.enabled ? 'Hide' : 'Show';
    }

    if (showHideBtn) {
      const st = loadState();
      syncShowHideButton(st);
      showHideBtn.addEventListener('click', () => {
        const s = loadState();
        s.enabled = !s.enabled;
        saveState(s);
        syncShowHideButton(s);
        if (!s.enabled) broadcastDisabled();
        else broadcastState(s);
      });
    }

    // Reset
    const resetBtn = document.getElementById('btResetBalls');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const s = loadState();
        resetPocketed(s);
        saveState(s);
        updatePocketedButtons(s);
        broadcastState(s);
      });
    }

    // Ball toggles row
    const row = document.getElementById('btBallToggleRow');
    if (row) {
      const st = loadState();
      updatePocketedButtons(st);
      row.addEventListener('click', (e) => {
        const target = e.target.closest('[data-ball]');
        if (!target) return;
        const ball = target.getAttribute('data-ball');
        const s = loadState();
        s.pocketed[String(ball)] = !s.pocketed[String(ball)];
        saveState(s);
        updatePocketedButtons(s);
        broadcastState(s);
      });
    }
  }

  window.addEventListener('load', init);
})();
