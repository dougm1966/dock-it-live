/**
 * ModalManager - OBS-Compatible Dialog System
 *
 * Replaces native browser alert() and confirm() dialogs with custom DOM-based modals
 * that work reliably in OBS Browser Sources and Browser Docks.
 *
 * Native browser dialogs (alert, confirm, prompt) are BLOCKED in OBS Studio.
 * This manager provides a drop-in replacement using Promise-based async methods.
 *
 * Usage:
 *   import { ModalManager } from '../../core/ui/ModalManager.js';
 *
 *   await ModalManager.alert('Operation completed successfully!');
 *   const confirmed = await ModalManager.confirm('Are you sure?');
 *   if (confirmed) { ... }
 *
 * @created 2025-12-28
 * @version 1.0.0
 */

export class ModalManager {
  /**
   * Display an informational alert modal (replaces window.alert)
   *
   * @param {string} message - Message to display
   * @returns {Promise<void>} Resolves when user clicks OK
   */
  static alert(message) {
    return new Promise(resolve => {
      // Create modal backdrop
      const modal = document.createElement('div');
      modal.className = 'obs-modal obs-alert';
      modal.setAttribute('role', 'alertdialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'obs-modal-message');

      // Create modal content
      modal.innerHTML = `
        <div class="obs-modal-backdrop"></div>
        <div class="obs-modal-content">
          <div class="obs-modal-header">
            <h3>Notice</h3>
          </div>
          <div class="obs-modal-body">
            <p id="obs-modal-message">${this._escapeHtml(message)}</p>
          </div>
          <div class="obs-modal-footer">
            <button id="obs-modal-ok" class="obs-btn obs-btn-primary" autofocus>OK</button>
          </div>
        </div>
      `;

      // Append to body
      document.body.appendChild(modal);

      // Focus the OK button
      const okButton = document.getElementById('obs-modal-ok');
      setTimeout(() => okButton.focus(), 10);

      // Handle OK button click
      okButton.onclick = () => {
        this._closeModal(modal);
        resolve();
      };

      // Handle Enter key
      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          this._closeModal(modal);
          document.removeEventListener('keydown', handleKeyDown);
          resolve();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      // Handle backdrop click (close on click outside)
      modal.querySelector('.obs-modal-backdrop').onclick = () => {
        this._closeModal(modal);
        document.removeEventListener('keydown', handleKeyDown);
        resolve();
      };
    });
  }

  /**
   * Display a confirmation modal with Yes/No options (replaces window.confirm)
   *
   * @param {string} message - Message to display
   * @returns {Promise<boolean>} Resolves to true if user clicks Yes, false if No
   */
  static confirm(message) {
    return new Promise(resolve => {
      // Create modal backdrop
      const modal = document.createElement('div');
      modal.className = 'obs-modal obs-confirm';
      modal.setAttribute('role', 'alertdialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'obs-modal-message');

      // Create modal content
      modal.innerHTML = `
        <div class="obs-modal-backdrop"></div>
        <div class="obs-modal-content">
          <div class="obs-modal-header">
            <h3>Confirm Action</h3>
          </div>
          <div class="obs-modal-body">
            <p id="obs-modal-message">${this._escapeHtml(message)}</p>
          </div>
          <div class="obs-modal-footer">
            <button id="obs-modal-no" class="obs-btn obs-btn-secondary">No</button>
            <button id="obs-modal-yes" class="obs-btn obs-btn-primary" autofocus>Yes</button>
          </div>
        </div>
      `;

      // Append to body
      document.body.appendChild(modal);

      // Focus the Yes button
      const yesButton = document.getElementById('obs-modal-yes');
      const noButton = document.getElementById('obs-modal-no');
      setTimeout(() => yesButton.focus(), 10);

      // Handle Yes button click
      yesButton.onclick = () => {
        this._closeModal(modal);
        document.removeEventListener('keydown', handleKeyDown);
        resolve(true);
      };

      // Handle No button click
      noButton.onclick = () => {
        this._closeModal(modal);
        document.removeEventListener('keydown', handleKeyDown);
        resolve(false);
      };

      // Handle keyboard navigation
      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          // Enter confirms (Yes)
          this._closeModal(modal);
          document.removeEventListener('keydown', handleKeyDown);
          resolve(true);
        } else if (e.key === 'Escape') {
          // Escape cancels (No)
          this._closeModal(modal);
          document.removeEventListener('keydown', handleKeyDown);
          resolve(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      // Handle backdrop click (cancel on click outside)
      modal.querySelector('.obs-modal-backdrop').onclick = () => {
        this._closeModal(modal);
        document.removeEventListener('keydown', handleKeyDown);
        resolve(false);
      };
    });
  }

  /**
   * Display an informational modal with custom title and message
   *
   * @param {string} title - Modal title
   * @param {string} message - Message to display (supports HTML)
   * @param {string} buttonText - Text for the OK button (default: "OK")
   * @returns {Promise<void>} Resolves when user clicks the button
   */
  static info(title, message, buttonText = 'OK') {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.className = 'obs-modal obs-info';
      modal.setAttribute('role', 'alertdialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'obs-modal-title');

      modal.innerHTML = `
        <div class="obs-modal-backdrop"></div>
        <div class="obs-modal-content">
          <div class="obs-modal-header">
            <h3 id="obs-modal-title">${this._escapeHtml(title)}</h3>
          </div>
          <div class="obs-modal-body">
            <div>${message}</div>
          </div>
          <div class="obs-modal-footer">
            <button id="obs-modal-ok" class="obs-btn obs-btn-primary" autofocus>${this._escapeHtml(buttonText)}</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const okButton = document.getElementById('obs-modal-ok');
      setTimeout(() => okButton.focus(), 10);

      okButton.onclick = () => {
        this._closeModal(modal);
        resolve();
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          this._closeModal(modal);
          document.removeEventListener('keydown', handleKeyDown);
          resolve();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      modal.querySelector('.obs-modal-backdrop').onclick = () => {
        this._closeModal(modal);
        document.removeEventListener('keydown', handleKeyDown);
        resolve();
      };
    });
  }

  /**
   * Close and remove a modal from the DOM
   * @private
   */
  static _closeModal(modal) {
    modal.classList.add('obs-modal-closing');
    setTimeout(() => {
      modal.remove();
    }, 200); // Match CSS transition duration
  }

  /**
   * Escape HTML to prevent XSS attacks
   * @private
   */
  static _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Display a full-screen iframe modal (for internal windows like Player Manager)
   *
   * @param {string} url - URL to load in the iframe
   * @param {string} title - Modal title
   * @returns {Promise<void>} Resolves when user closes the modal
   */
  static openInternalWindow(url, title = 'Window') {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.className = 'obs-modal obs-fullscreen-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'obs-modal-title');

      modal.innerHTML = `
        <div class="obs-modal-fullscreen-content">
          <div class="obs-modal-fullscreen-header">
            <h3 id="obs-modal-title">${this._escapeHtml(title)}</h3>
            <button id="close-fullscreen-modal" class="obs-btn obs-btn-close" aria-label="Close">×</button>
          </div>
          <iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>
        </div>
      `;

      document.body.appendChild(modal);

      const closeButton = document.getElementById('close-fullscreen-modal');
      closeButton.onclick = () => {
        this._closeModal(modal);
        resolve();
      };

      // Handle Escape key
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          this._closeModal(modal);
          document.removeEventListener('keydown', handleKeyDown);
          resolve();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
    });
  }
}

// Export as default for convenience
export default ModalManager;
