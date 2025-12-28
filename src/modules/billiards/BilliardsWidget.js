/**
 * BilliardsWidget.js
 * Billiards-specific overlay widget (Ball Tracker)
 *
 * This module handles billiards-specific UI:
 * - Ball tracker display (8-ball, 9-ball, 10-ball)
 * - Innings counter
 * - Safety counter
 * - Rack score
 *
 * Separated from universal overlay to follow MODULAR SKELETON law
 */

export class BilliardsWidget {
  constructor() {
    // Ball tracker constants
    this.SOLIDS = ['1','2','3','4','5','6','7'];
    this.STRIPES = ['9','10','11','12','13','14','15'];
    this.NINE_BALL = ['1','2','3','4','5','6','7','8','9'];
    this.TEN_BALL = ['1','2','3','4','5','6','7','8','9','10'];
  }

  /**
   * Initialize the billiards widget
   * Injects ball tracker HTML into the module widget container
   */
  init() {
    console.log('🎱 Initializing Billiards Widget...');

    const container = document.getElementById('moduleWidgetContainer');
    if (!container) {
      console.error('❌ Module widget container not found');
      return;
    }

    // Inject ball tracker HTML
    container.innerHTML = `
      <table id="ballTrackerTable" class="bs-score-table">
        <tbody>
          <tr class="bt-row">
            <td class="bt-cell"><div id="p1BallRack" class="bt-rack noShow"></div></td>
            <td class="bt-cell bt-cell--mid"><div id="midBallRack" class="bt-rack bt-rack--mid noShow"></div></td>
            <td class="bt-cell"><div id="p2BallRack" class="bt-rack noShow"></div></td>
          </tr>
          <tr class="bt-full-row">
            <td class="bt-cell bt-cell--full" colspan="3"><div id="fullBallRack" class="bt-rack bt-rack--full noShow"></div></td>
          </tr>
        </tbody>
      </table>
    `;

    console.log('✅ Billiards Widget initialized');
  }

  /**
   * Update ball tracker display based on state
   * @param {Object} state - Ball tracker state
   */
  updateBallTracker(state) {
    console.log('🎱 BilliardsWidget.updateBallTracker called with state:', state);

    if (!state) {
      console.warn('⚠️ Ball tracker state is null/undefined');
      return;
    }

    const racks = {
      p1: document.getElementById('p1BallRack'),
      p2: document.getElementById('p2BallRack'),
      mid: document.getElementById('midBallRack'),
      full: document.getElementById('fullBallRack')
    };

    if (!racks.p1 || !racks.p2 || !racks.mid || !racks.full) {
      console.error('❌ Ball rack elements not found in DOM:', {
        p1: !!racks.p1,
        p2: !!racks.p2,
        mid: !!racks.mid,
        full: !!racks.full
      });
      return;
    }

    // Show module widget container when ball tracker is active
    const container = document.getElementById('moduleWidgetContainer');
    if (container) {
      if (state.enabled) {
        container.classList.add('active');
        console.log('✅ Ball tracker enabled - module container shown');
      } else {
        container.classList.remove('active');
        console.log('❌ Ball tracker disabled - module container hidden');
      }
    }

    // If disabled, hide all racks
    if (!state.enabled) {
      this.hideAllRacks(racks);
      return;
    }

    console.log(`🎱 Rendering ball tracker - Game type: ${state.gameType}`);

    // Set ball size from state
    this.setBallSize(state.gameType);

    // Clear all racks
    this.clearRack(racks.p1);
    this.clearRack(racks.p2);
    this.clearRack(racks.mid);
    this.clearRack(racks.full);

    // Render based on game type
    if (state.gameType === 'nine') {
      this.showFullOnly(racks);
      this.renderRack(racks.full, this.NINE_BALL, state, { placeholder: false });
    } else if (state.gameType === 'ten') {
      this.showFullOnly(racks);
      this.renderRack(racks.full, this.TEN_BALL, state, { placeholder: false });
    } else {
      // 8-ball mode (default)
      const p1Set = state.assignments?.p1Set || 'unassigned';
      const p2Set = state.assignments?.p2Set || 'unassigned';

      // If both are unassigned, hide all racks completely
      if (p1Set === 'unassigned' && p2Set === 'unassigned') {
        this.hideAllRacks(racks);
        console.log('🎱 Both players unassigned - hiding all ball racks');
        return;
      }

      // Show split racks since at least one player is assigned
      this.showSplitRacks(racks);

      // Only render balls if assigned (not 'unassigned')
      if (p1Set !== 'unassigned') {
        const p1Balls = p1Set === 'stripes' ? this.STRIPES : this.SOLIDS;
        this.renderRack(racks.p1, p1Balls, state, { placeholder: false });
      }

      if (p2Set !== 'unassigned') {
        const p2Balls = p2Set === 'stripes' ? this.STRIPES : this.SOLIDS;
        this.renderRack(racks.p2, p2Balls, state, { placeholder: false });
      }

      // Always show 8-ball in middle (when at least one player is assigned)
      this.renderRack(racks.mid, ['8'], state, { placeholder: false });
    }
  }

  /**
   * Determine effective ball set for a player
   */
  getEffectiveSetForPlayer(state, player) {
    const assignments = state.assignments || { p1Set: 'unassigned', p2Set: 'unassigned' };
    const defaults = state.defaults || { p1Default: 'solids' };

    if (player === 1) {
      if (assignments.p1Set && assignments.p1Set !== 'unassigned') return assignments.p1Set;
      return defaults.p1Default === 'stripes' ? 'stripes' : 'solids';
    }

    // Player 2
    if (assignments.p2Set && assignments.p2Set !== 'unassigned') return assignments.p2Set;
    const p1Default = defaults.p1Default === 'stripes' ? 'stripes' : 'solids';
    return p1Default === 'solids' ? 'stripes' : 'solids';
  }

  /**
   * Set ball size CSS variable based on game type
   */
  setBallSize(gameType) {
    const nameEl = document.getElementById('player1Name');
    const namePxRaw = nameEl ? Number.parseFloat(window.getComputedStyle(nameEl).fontSize) : NaN;
    const namePx = Number.isFinite(namePxRaw) ? namePxRaw : 15;
    const multiplier = 1.52;
    const px = Math.max(12, Math.min(26, Math.round(namePx * multiplier)));
    document.documentElement.style.setProperty('--bt-ball-size', `${px}px`);
  }

  /**
   * Hide all ball racks and their parent rows
   */
  hideAllRacks(racks) {
    // Hide the rack divs
    if (racks.p1) racks.p1.classList.add('noShow');
    if (racks.p2) racks.p2.classList.add('noShow');
    if (racks.mid) racks.mid.classList.add('noShow');
    if (racks.full) racks.full.classList.add('noShow');

    // Hide the table rows themselves
    const splitRow = document.querySelector('.bt-row');
    const fullRow = document.querySelector('.bt-full-row');
    if (splitRow) splitRow.classList.add('noShow');
    if (fullRow) fullRow.classList.add('noShow');
  }

  /**
   * Show full-width rack only (9-ball/10-ball mode)
   */
  showFullOnly(racks) {
    // Show full rack div, hide split rack divs
    if (racks.p1) racks.p1.classList.add('noShow');
    if (racks.p2) racks.p2.classList.add('noShow');
    if (racks.mid) racks.mid.classList.add('noShow');
    if (racks.full) racks.full.classList.remove('noShow');

    // Show full row, hide split row
    const splitRow = document.querySelector('.bt-row');
    const fullRow = document.querySelector('.bt-full-row');
    if (splitRow) splitRow.classList.add('noShow');
    if (fullRow) fullRow.classList.remove('noShow');
  }

  /**
   * Show split racks (8-ball mode)
   */
  showSplitRacks(racks) {
    // Show split rack divs
    if (racks.p1) racks.p1.classList.remove('noShow');
    if (racks.p2) racks.p2.classList.remove('noShow');
    if (racks.mid) racks.mid.classList.remove('noShow');
    if (racks.full) racks.full.classList.add('noShow');

    // Show split row, hide full row
    const splitRow = document.querySelector('.bt-row');
    const fullRow = document.querySelector('.bt-full-row');
    if (splitRow) splitRow.classList.remove('noShow');
    if (fullRow) fullRow.classList.add('noShow');
  }

  /**
   * Clear rack contents
   */
  clearRack(el) {
    if (!el) return;
    el.innerHTML = '';
  }

  /**
   * Render balls into a rack
   * @param {HTMLElement} el - Rack container
   * @param {Array<string>} ballNumbers - Ball numbers to render
   * @param {Object} state - Ball tracker state
   * @param {Object} options - Rendering options
   */
  renderRack(el, ballNumbers, state, options) {
    if (!el) return;

    const pocketed = state.pocketed || {};

    console.log(`🎱 Rendering rack with balls:`, ballNumbers);

    for (const n of ballNumbers) {
      const img = document.createElement('img');
      img.className = 'bt-ball';
      img.alt = n;

      // OBS COMPATIBILITY: Use absolute path for Vite dev server
      img.src = `/PCLS-Balls/images/render0/${n}.png`;

      console.log(`  Ball ${n}: ${img.src}`);

      const isPocketed = !!pocketed[String(n)];
      if (options && options.placeholder) {
        img.classList.add('bt-ball--placeholder');
      }
      if (isPocketed) {
        img.classList.add('bt-ball--pocketed');
      }

      el.appendChild(img);
    }
  }
}
