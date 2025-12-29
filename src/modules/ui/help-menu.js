/**
 * Help Menu - 도움말 메뉴 (단축키, 프로그램 정보)
 */

import { eventBus, EVENTS } from '../../core/events.js';
import { $id, $ } from '../../core/dom.js';

class HelpMenu {
  constructor() {
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
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
