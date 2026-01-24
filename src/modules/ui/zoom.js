/**
 * Zoom Manager - 탭별 줌 관리
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id } from '../../core/dom.js';
import { findClosest, clamp } from '../../utils/helpers.js';
import { tabsManager, HOME_TAB_ID } from '../tabs/tabs.js';

const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

class ZoomManager {
  constructor() {
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.applyCurrentTabZoom();
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

    // 탭 전환 시 해당 탭의 zoom 적용
    eventBus.on(EVENTS.TAB_SWITCHED, ({ tabId, isHome }) => {
      this.applyCurrentTabZoom();
    });
  }

  applyCurrentTabZoom() {
    const zoom = tabsManager.getActiveZoom();
    this.applyZoom(zoom);
  }

  applyZoom(level) {
    level = clamp(level, ZOOM_LEVELS[0], ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
    const nearest = findClosest(ZOOM_LEVELS, level);

    if (this.elements.content) {
      this.elements.content.setAttribute('data-zoom', nearest.toString());
    }

    if (this.elements.zoomDisplay) {
      this.elements.zoomDisplay.textContent = `${nearest}%`;
    }

    eventBus.emit(EVENTS.ZOOM_CHANGED, nearest);
  }

  setZoom(level) {
    // 홈 탭에서는 zoom 변경 불가
    if (tabsManager.isHome()) {
      return;
    }

    level = clamp(level, ZOOM_LEVELS[0], ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
    const nearest = findClosest(ZOOM_LEVELS, level);

    // 현재 탭에 zoom 저장
    const activeTabId = tabsManager.getActiveTabId();
    tabsManager.setZoom(activeTabId, nearest);

    this.applyZoom(nearest);
  }

  zoomIn() {
    if (tabsManager.isHome()) return;

    const current = tabsManager.getActiveZoom();
    const currentIndex = ZOOM_LEVELS.indexOf(current);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      this.setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  }

  zoomOut() {
    if (tabsManager.isHome()) return;

    const current = tabsManager.getActiveZoom();
    const currentIndex = ZOOM_LEVELS.indexOf(current);
    if (currentIndex > 0) {
      this.setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  }

  reset() {
    if (tabsManager.isHome()) return;
    this.setZoom(100);
  }

  getZoom() {
    return tabsManager.getActiveZoom();
  }
}

export const zoomManager = new ZoomManager();
