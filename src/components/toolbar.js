/**
 * SP MD Viewer - Toolbar Component
 * Dynamic toolbar generation with i18n support
 */

import { ICONS } from './icons.js';
import { i18n } from '../i18n.js';
import { store } from '../core/store.js';
import { eventBus, EVENTS } from '../core/events.js';

class Toolbar {
  constructor() {
    this.container = null;
  }

  /**
   * Initialize and render toolbar
   */
  init() {
    this.container = document.getElementById('toolbar');
    if (!this.container) return;

    this.render();
    this.bindEvents();

    // Subscribe to language changes
    store.subscribe('language', () => this.updateTexts());
  }

  /**
   * Get current language translations
   */
  get lang() {
    return i18n[store.get('language') || 'ko'];
  }

  /**
   * Render toolbar HTML
   */
  render() {
    this.container.innerHTML = `
      <!-- Navigation buttons -->
      <button id="btn-home" title="${this.lang.homeTooltip}">${ICONS.home}</button>
      <button id="btn-open" title="${this.lang.openFile}">${ICONS.file}</button>
      <button id="btn-recent" title="${this.lang.recentFiles}">${ICONS.clock}</button>

      <div class="toolbar-divider"></div>

      <!-- Color Theme -->
      <select id="color-theme" title="${this.lang.colorTheme}">
        <option value="default">${this.lang.themeDefault}</option>
        <option value="purple">${this.lang.themePurple}</option>
        <option value="ocean">${this.lang.themeOcean}</option>
        <option value="sunset">${this.lang.themeSunset}</option>
        <option value="forest">${this.lang.themeForest}</option>
        <option value="rose">${this.lang.themeRose}</option>
        <option value="custom" id="custom-theme-option" hidden>${this.lang.themeCustom}</option>
      </select>

      <!-- Font Family -->
      <select id="font-family" title="${this.lang.fontFamily}">
        <option value="system">${this.lang.fontSystem}</option>
        <option value="malgun">${this.lang.fontMalgun}</option>
        <option value="nanum">${this.lang.fontNanum}</option>
        <option value="pretendard">${this.lang.fontPretendard}</option>
        <option value="noto">${this.lang.fontNoto}</option>
      </select>

      <!-- Font Size -->
      <select id="font-size" title="${this.lang.fontSize}">
        <option value="small">${this.lang.fontSmall}</option>
        <option value="medium" selected>${this.lang.fontMedium}</option>
        <option value="large">${this.lang.fontLarge}</option>
        <option value="xlarge">${this.lang.fontXlarge}</option>
      </select>

      <!-- Content Width -->
      <select id="content-width" title="${this.lang.contentWidth}">
        <option value="narrow">${this.lang.widthNarrow}</option>
        <option value="medium">${this.lang.widthMedium}</option>
        <option value="wide">${this.lang.widthWide}</option>
        <option value="full">${this.lang.widthFull}</option>
      </select>

      <!-- Language -->
      <select id="language" title="${this.lang.language}">
        <option value="ko">한국어</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>

      <!-- Theme Toggle -->
      <button id="btn-theme" title="${this.lang.toggleTheme}">
        <span id="icon-dark">${ICONS.moon}</span>
        <span id="icon-light" style="display:none">${ICONS.sun}</span>
      </button>

      <div class="toolbar-divider"></div>

      <!-- Theme Customizer -->
      <button id="btn-customize" title="${this.lang.themeCustomizer}">${ICONS.palette}</button>

      <div class="toolbar-divider"></div>

      <!-- Print, PDF & Search -->
      <button id="btn-print" title="${this.lang.print}">${ICONS.print}</button>
      <button id="btn-pdf" title="${this.lang.exportPdf}">${ICONS.pdf}</button>
      <button id="btn-search" title="${this.lang.search}">${ICONS.search}</button>

      <div class="toolbar-divider"></div>

      <!-- View Mode Group -->
      <div class="view-mode-group">
        <button id="btn-view-single" class="view-btn active" title="${this.lang.viewSingle}">${ICONS.viewSingle}</button>
        <button id="btn-view-double" class="view-btn" title="${this.lang.viewDouble}">${ICONS.viewDouble}</button>
        <button id="btn-view-paging" class="view-btn" title="${this.lang.viewPaging}">${ICONS.viewPaging}</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Zoom Controls -->
      <div class="zoom-group">
        <button id="btn-zoom-out" title="${this.lang.zoomOut}">${ICONS.zoomOut}</button>
        <span id="zoom-level" class="zoom-level" title="${this.lang.zoomRatio}">100%</span>
        <button id="btn-zoom-in" title="${this.lang.zoomIn}">${ICONS.zoomIn}</button>
        <button id="btn-zoom-reset" title="${this.lang.zoomReset}">${ICONS.zoomReset}</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Presentation -->
      <button id="btn-presentation" title="${this.lang.presentation}">${ICONS.presentation}</button>

      <div class="toolbar-divider"></div>

      <!-- Help Menu -->
      <div class="help-menu-wrapper">
        <button id="btn-help" title="${this.lang.help}">${ICONS.help}</button>
        <div id="help-dropdown" class="help-dropdown hidden">
          <button class="help-menu-item" id="help-shortcuts">
            ${ICONS.keyboard}
            <span>${this.lang.shortcuts}</span>
          </button>
          <div class="help-menu-divider"></div>
          <button class="help-menu-item" id="help-about">
            ${ICONS.info}
            <span>${this.lang.about}</span>
          </button>
        </div>
      </div>
    `;

    // Restore saved values
    this.restoreValues();
  }

  /**
   * Restore saved select values from store
   */
  restoreValues() {
    const colorTheme = store.get('colorTheme');
    const fontFamily = store.get('fontFamily');
    const fontSize = store.get('fontSize');
    const contentWidth = store.get('contentWidth');
    const language = store.get('language');

    if (colorTheme) {
      const colorSelect = document.getElementById('color-theme');
      if (colorSelect) colorSelect.value = colorTheme;
    }
    if (fontFamily) {
      const fontSelect = document.getElementById('font-family');
      if (fontSelect) fontSelect.value = fontFamily;
    }
    if (fontSize) {
      const sizeSelect = document.getElementById('font-size');
      if (sizeSelect) sizeSelect.value = fontSize;
    }
    if (contentWidth) {
      const widthSelect = document.getElementById('content-width');
      if (widthSelect) widthSelect.value = contentWidth;
    }
    if (language) {
      const langSelect = document.getElementById('language');
      if (langSelect) langSelect.value = language;
    }
  }

  /**
   * Bind toolbar events
   */
  bindEvents() {
    // Events are handled in main.js for now
    // This allows better control over module initialization order
  }

  /**
   * Update all text elements when language changes
   */
  updateTexts() {
    // Re-render to update all texts
    this.render();
    eventBus.emit(EVENTS.TOOLBAR_UPDATED);
  }

  /**
   * Show/hide theme icons based on current theme
   */
  updateThemeIcons(isDark) {
    const iconDark = document.getElementById('icon-dark');
    const iconLight = document.getElementById('icon-light');
    if (iconDark) iconDark.style.display = isDark ? 'none' : '';
    if (iconLight) iconLight.style.display = isDark ? '' : 'none';
  }

  /**
   * Show custom theme option in select
   */
  showCustomThemeOption() {
    const option = document.getElementById('custom-theme-option');
    if (option) option.hidden = false;
  }
}

export const toolbar = new Toolbar();
export default toolbar;
