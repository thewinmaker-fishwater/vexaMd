/**
 * Zoom Manager - 줌 관리
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id } from '../../core/dom.js';
import { findClosest, clamp } from '../../utils/helpers.js';

const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

class ZoomManager {
  constructor() {
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.applyInitialZoom();
  }

  cacheElements() {
    this.elements = {
      content: $id('content'),
      zoomDisplay: $id('zoom-level'),
      btnZoomIn: $id('btn-zoom-in'),
      btnZoomOut: $id('btn-zoom-out'),
      btnZoomReset: $id('btn-zoom-reset')
    };
  }

  setupEventListeners() {
    this.elements.btnZoomIn?.addEventListener('click', () => this.zoomIn());
    this.elements.btnZoomOut?.addEventListener('click', () => this.zoomOut());
    this.elements.btnZoomReset?.addEventListener('click', () => this.reset());
  }

  applyInitialZoom() {
    const zoom = store.get('zoom') || 100;
    this.setZoom(zoom);
  }

  setZoom(level) {
    level = clamp(level, ZOOM_LEVELS[0], ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
    const nearest = findClosest(ZOOM_LEVELS, level);

    store.set('zoom', nearest);

    if (this.elements.content) {
      this.elements.content.setAttribute('data-zoom', nearest.toString());
    }

    if (this.elements.zoomDisplay) {
      this.elements.zoomDisplay.textContent = `${nearest}%`;
    }

    eventBus.emit(EVENTS.ZOOM_CHANGED, nearest);
  }

  zoomIn() {
    const current = store.get('zoom') || 100;
    const currentIndex = ZOOM_LEVELS.indexOf(current);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      this.setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  }

  zoomOut() {
    const current = store.get('zoom') || 100;
    const currentIndex = ZOOM_LEVELS.indexOf(current);
    if (currentIndex > 0) {
      this.setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  }

  reset() {
    this.setZoom(100);
  }

  getZoom() {
    return store.get('zoom') || 100;
  }
}

export const zoomManager = new ZoomManager();
