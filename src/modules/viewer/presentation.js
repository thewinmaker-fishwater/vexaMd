/**
 * Presentation Mode - 프레젠테이션 모드
 * Generates overlay HTML dynamically with i18n support
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id, $ } from '../../core/dom.js';
import { i18n } from '../../i18n.js';
import { markdownViewer } from './markdown.js';
import { tabsManager } from '../tabs/tabs.js';
import { ICONS } from '../../components/icons.js';

class PresentationMode {
  constructor() {
    this.isActive = false;
    this.currentSlide = 0;
    this.elements = {};
  }

  get lang() {
    return i18n[store.get('language') || 'ko'];
  }

  init() {
    this.createOverlay();
    this.cacheElements();
    this.setupEventListeners();

    // Update on language change
    store.subscribe('language', () => this.updateTexts());
  }

  /**
   * Create presentation overlay HTML
   */
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'presentation-overlay';
    overlay.className = 'presentation-overlay hidden';
    overlay.innerHTML = this.getOverlayHTML();
    document.body.appendChild(overlay);
  }

  /**
   * Get overlay HTML
   */
  getOverlayHTML() {
    return `
      <div class="presentation-slide markdown-body">
        <div class="presentation-content"></div>
      </div>
      <div class="presentation-controls">
        <button id="pres-prev" class="pres-nav-btn" title="${this.lang.prevSlide}">
          ${ICONS.chevronLeft}
        </button>
        <span id="pres-indicator" class="pres-indicator">1 / 1</span>
        <button id="pres-next" class="pres-nav-btn" title="${this.lang.nextSlide}">
          ${ICONS.chevronRight}
        </button>
        <button id="pres-exit" class="pres-exit-btn" title="${this.lang.exitPresentation}">
          ${ICONS.close}
        </button>
      </div>
    `;
  }

  /**
   * Update texts when language changes
   */
  updateTexts() {
    const overlay = $id('presentation-overlay');
    if (overlay && !this.isActive) {
      overlay.innerHTML = this.getOverlayHTML();
      this.cacheElements();
      this.setupEventListeners();
    }
  }

  cacheElements() {
    this.elements = {
      overlay: $id('presentation-overlay'),
      content: $('.presentation-content'),
      indicator: $id('pres-indicator'),
      prevBtn: $id('pres-prev'),
      nextBtn: $id('pres-next'),
      exitBtn: $id('pres-exit')
    };
  }

  setupEventListeners() {
    this.elements.prevBtn?.addEventListener('click', () => this.prev());
    this.elements.nextBtn?.addEventListener('click', () => this.next());
    this.elements.exitBtn?.addEventListener('click', () => this.exit());

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.isActive) {
        this.exit();
      }
    });
  }

  start() {
    const pages = markdownViewer.getPages();

    if (pages.length === 0 || tabsManager.isHome()) {
      this.showNotification(this.lang.noDocForPresentation);
      return;
    }

    this.isActive = true;
    this.currentSlide = 0;
    this.elements.overlay?.classList.remove('hidden');
    this.renderSlide();

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    eventBus.emit(EVENTS.PRESENTATION_STARTED);
  }

  exit() {
    this.isActive = false;
    this.elements.overlay?.classList.add('hidden');

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    eventBus.emit(EVENTS.PRESENTATION_ENDED);
  }

  renderSlide() {
    const pages = markdownViewer.getPages();

    if (!this.elements.content) return;

    this.elements.content.innerHTML = pages[this.currentSlide] || '';

    if (this.elements.indicator) {
      this.elements.indicator.textContent = `${this.currentSlide + 1} / ${pages.length}`;
    }

    if (this.elements.prevBtn) {
      this.elements.prevBtn.disabled = this.currentSlide === 0;
    }
    if (this.elements.nextBtn) {
      this.elements.nextBtn.disabled = this.currentSlide >= pages.length - 1;
    }
  }

  prev() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.renderSlide();
      eventBus.emit(EVENTS.PRESENTATION_SLIDE_CHANGED, this.currentSlide);
    }
  }

  next() {
    const pages = markdownViewer.getPages();
    if (this.currentSlide < pages.length - 1) {
      this.currentSlide++;
      this.renderSlide();
      eventBus.emit(EVENTS.PRESENTATION_SLIDE_CHANGED, this.currentSlide);
    }
  }

  isPresenting() {
    return this.isActive;
  }

  handleKeydown(e) {
    if (!this.isActive) return false;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.exit();
      return true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      this.prev();
      return true;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      this.next();
      return true;
    }

    return true; // Block other keys in presentation mode
  }

  showNotification(message) {
    eventBus.emit(EVENTS.NOTIFICATION_SHOWN, message);
  }
}

export const presentationMode = new PresentationMode();
