/**
 * Help Menu - 도움말 메뉴 (단축키, 프로그램 정보)
 * Generates modal HTML dynamically with i18n support
 */

import { eventBus, EVENTS } from '../../core/events.js';
import { store } from '../../core/store.js';
import { $id } from '../../core/dom.js';
import { i18n } from '../../i18n.js';
import { ICONS } from '../../components/icons.js';

class HelpMenu {
  constructor() {
    this.elements = {};
  }

  get lang() {
    return i18n[store.get('language') || 'ko'];
  }

  init() {
    this.createModals();
    this.cacheElements();
    this.setupEventListeners();

    // Update on language change
    store.subscribe('language', () => this.updateTexts());
  }

  /**
   * Create modal HTML and append to body
   */
  createModals() {
    // About Modal
    const aboutModal = document.createElement('div');
    aboutModal.id = 'about-modal';
    aboutModal.className = 'modal hidden';
    aboutModal.innerHTML = this.getAboutModalHTML();
    document.body.appendChild(aboutModal);

    // Shortcuts Modal
    const shortcutsModal = document.createElement('div');
    shortcutsModal.id = 'shortcuts-modal';
    shortcutsModal.className = 'modal hidden';
    shortcutsModal.innerHTML = this.getShortcutsModalHTML();
    document.body.appendChild(shortcutsModal);
  }

  /**
   * About Modal HTML
   */
  getAboutModalHTML() {
    return `
      <div class="modal-backdrop"></div>
      <div class="modal-content about-modal">
        <div class="modal-header">
          <h2 data-i18n="aboutTitle">${this.lang.aboutTitle}</h2>
          <button class="modal-close" id="about-close">${ICONS.close}</button>
        </div>
        <div class="about-content">
          <div class="about-logo">
            <img src="/logo.jpg" alt="Seven Peaks Logo" width="120">
          </div>
          <h3>SP MD Viewer</h3>
          <p class="about-version" data-i18n="version">${this.lang.version} 1.0.0</p>
          <p class="about-description" data-i18n="welcomeSubtitle">${this.lang.welcomeSubtitle}</p>
          <div class="about-info">
            <p><strong data-i18n="developer">${this.lang.developer}</strong>: Seven Peaks Software</p>
            <p><strong data-i18n="license">${this.lang.license}</strong>: Apache 2.0</p>
          </div>
        </div>
        <div class="modal-footer about-footer">
          <button id="about-ok" class="btn-primary" data-i18n="confirm">${this.lang.confirm}</button>
        </div>
      </div>
    `;
  }

  /**
   * Shortcuts Modal HTML
   */
  getShortcutsModalHTML() {
    return `
      <div class="modal-backdrop"></div>
      <div class="modal-content shortcuts-modal">
        <div class="modal-header">
          <h2 data-i18n="shortcutsTitle">${this.lang.shortcutsTitle}</h2>
          <button class="modal-close" id="shortcuts-close">${ICONS.close}</button>
        </div>
        <div class="shortcuts-content">
          <div class="shortcuts-section">
            <h4 data-i18n="shortcutFile">${this.lang.shortcutFile}</h4>
            <div class="shortcut-grid">
              <div class="shortcut-item"><kbd>Ctrl+O</kbd><span data-i18n="scOpenFile">${this.lang.scOpenFile}</span></div>
              <div class="shortcut-item"><kbd>Ctrl+W</kbd><span data-i18n="scCloseTab">${this.lang.scCloseTab}</span></div>
              <div class="shortcut-item"><kbd>Ctrl+P</kbd><span data-i18n="scPrint">${this.lang.scPrint}</span></div>
              <div class="shortcut-item"><kbd>Esc</kbd><span data-i18n="scHome">${this.lang.scHome}</span></div>
            </div>
          </div>
          <div class="shortcuts-section">
            <h4 data-i18n="shortcutView">${this.lang.shortcutView}</h4>
            <div class="shortcut-grid">
              <div class="shortcut-item"><kbd>Ctrl+D</kbd><span data-i18n="scToggleTheme">${this.lang.scToggleTheme}</span></div>
              <div class="shortcut-item"><kbd>Ctrl++</kbd><span data-i18n="scZoomIn">${this.lang.scZoomIn}</span></div>
              <div class="shortcut-item"><kbd>Ctrl+-</kbd><span data-i18n="scZoomOut">${this.lang.scZoomOut}</span></div>
              <div class="shortcut-item"><kbd>Ctrl+0</kbd><span data-i18n="scZoomReset">${this.lang.scZoomReset}</span></div>
            </div>
          </div>
          <div class="shortcuts-section">
            <h4 data-i18n="shortcutNav">${this.lang.shortcutNav}</h4>
            <div class="shortcut-grid">
              <div class="shortcut-item"><kbd>Ctrl+F</kbd><span data-i18n="scSearch">${this.lang.scSearch}</span></div>
              <div class="shortcut-item"><kbd>←/→</kbd><span data-i18n="scPageNav">${this.lang.scPageNav}</span></div>
              <div class="shortcut-item"><kbd>Ctrl+Tab</kbd><span data-i18n="scNextTab">${this.lang.scNextTab}</span></div>
              <div class="shortcut-item"><kbd>F5</kbd><span data-i18n="scPresentation">${this.lang.scPresentation}</span></div>
            </div>
          </div>
        </div>
        <div class="modal-footer about-footer">
          <button id="shortcuts-ok" class="btn-primary" data-i18n="confirm">${this.lang.confirm}</button>
        </div>
      </div>
    `;
  }

  cacheElements() {
    this.elements = {
      btnHelp: $id('btn-help'),
      helpDropdown: $id('help-dropdown'),
      helpShortcuts: $id('help-shortcuts'),
      helpAbout: $id('help-about'),
      aboutModal: $id('about-modal'),
      aboutClose: $id('about-close'),
      aboutOk: $id('about-ok'),
      shortcutsModal: $id('shortcuts-modal'),
      shortcutsClose: $id('shortcuts-close'),
      shortcutsOk: $id('shortcuts-ok')
    };
  }

  setupEventListeners() {
    this.elements.btnHelp?.addEventListener('click', () => this.toggleDropdown());
    this.elements.helpShortcuts?.addEventListener('click', () => this.showShortcutsModal());
    this.elements.helpAbout?.addEventListener('click', () => this.showAboutModal());

    this.elements.aboutClose?.addEventListener('click', () => this.closeAboutModal());
    this.elements.aboutOk?.addEventListener('click', () => this.closeAboutModal());
    this.elements.aboutModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeAboutModal());

    this.elements.shortcutsClose?.addEventListener('click', () => this.closeShortcutsModal());
    this.elements.shortcutsOk?.addEventListener('click', () => this.closeShortcutsModal());
    this.elements.shortcutsModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeShortcutsModal());
  }

  /**
   * Update texts when language changes
   */
  updateTexts() {
    // Update About Modal
    if (this.elements.aboutModal) {
      this.elements.aboutModal.innerHTML = this.getAboutModalHTML();
    }

    // Update Shortcuts Modal
    if (this.elements.shortcutsModal) {
      this.elements.shortcutsModal.innerHTML = this.getShortcutsModalHTML();
    }

    // Re-cache elements and setup listeners
    this.cacheElements();
    this.setupEventListeners();
  }

  toggleDropdown() {
    if (this.elements.helpDropdown?.classList.contains('hidden')) {
      this.showDropdown();
    } else {
      this.hideDropdown();
    }
  }

  showDropdown() {
    this.elements.helpDropdown?.classList.remove('hidden');
    eventBus.emit(EVENTS.DROPDOWN_OPENED, 'help');
  }

  hideDropdown() {
    this.elements.helpDropdown?.classList.add('hidden');
    eventBus.emit(EVENTS.DROPDOWN_CLOSED, 'help');
  }

  showAboutModal() {
    this.hideDropdown();
    this.elements.aboutModal?.classList.remove('hidden');
    eventBus.emit(EVENTS.MODAL_OPENED, 'about');
  }

  closeAboutModal() {
    this.elements.aboutModal?.classList.add('hidden');
    eventBus.emit(EVENTS.MODAL_CLOSED, 'about');
  }

  showShortcutsModal() {
    this.hideDropdown();
    this.elements.shortcutsModal?.classList.remove('hidden');
    eventBus.emit(EVENTS.MODAL_OPENED, 'shortcuts');
  }

  closeShortcutsModal() {
    this.elements.shortcutsModal?.classList.add('hidden');
    eventBus.emit(EVENTS.MODAL_CLOSED, 'shortcuts');
  }
}

export const helpMenu = new HelpMenu();
