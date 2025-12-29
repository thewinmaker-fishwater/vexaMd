/**
 * View Mode Manager - 보기 모드 관리
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id } from '../../core/dom.js';

class ViewModeManager {
  constructor() {
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.applyInitialMode();
  }

  cacheElements() {
    this.elements = {
      btnSingle: $id('btn-view-single'),
      btnDouble: $id('btn-view-double'),
      btnPaging: $id('btn-view-paging')
    };
  }

  setupEventListeners() {
    this.elements.btnSingle?.addEventListener('click', () => this.setMode('single'));
    this.elements.btnDouble?.addEventListener('click', () => this.setMode('double'));
    this.elements.btnPaging?.addEventListener('click', () => this.setMode('paging'));
  }

  applyInitialMode() {
    const mode = store.get('viewMode') || 'single';
    this.updateButtonStates(mode);
  }

  setMode(mode) {
    store.set('viewMode', mode);
    this.updateButtonStates(mode);
    eventBus.emit(EVENTS.VIEW_MODE_CHANGED, mode);
  }

  updateButtonStates(mode) {
    const { btnSingle, btnDouble, btnPaging } = this.elements;

    btnSingle?.classList.remove('active');
    btnDouble?.classList.remove('active');
    btnPaging?.classList.remove('active');

    if (mode === 'single' && btnSingle) {
      btnSingle.classList.add('active');
    } else if (mode === 'double' && btnDouble) {
      btnDouble.classList.add('active');
    } else if (mode === 'paging' && btnPaging) {
      btnPaging.classList.add('active');
    }
  }

  getMode() {
    return store.get('viewMode') || 'single';
  }
}

export const viewModeManager = new ViewModeManager();
