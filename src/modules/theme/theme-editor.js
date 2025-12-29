/**
 * Theme Editor - 테마 편집기 모달
 * Generates modal HTML dynamically with i18n support
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id, $, $$ } from '../../core/dom.js';
import { rgbToHex } from '../../utils/helpers.js';
import { themeManager } from './theme-manager.js';
import { i18n } from '../../i18n.js';
import { ICONS } from '../../components/icons.js';

class ThemeEditor {
  constructor() {
    this.modal = null;
    this.originalState = null;
    this.elements = {};
  }

  get lang() {
    return i18n[store.get('language') || 'ko'];
  }

  init() {
    this.createModal();
    this.cacheElements();
    this.setupEventListeners();

    // Update on language change
    store.subscribe('language', () => this.updateTexts());
  }

  /**
   * Create modal HTML
   */
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'theme-editor-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = this.getModalHTML();
    document.body.appendChild(modal);
  }

  /**
   * Get modal HTML
   */
  getModalHTML() {
    return `
      <div class="modal-backdrop">
        <div class="modal-content theme-editor-content">
          <div class="modal-header">
            <h2 class="modal-title">${this.lang.themeEditorTitle}</h2>
            <button id="theme-editor-close" class="modal-close" title="${this.lang.close}">
              ${ICONS.close}
            </button>
          </div>

          <div class="editor-tabs">
            <button class="editor-tab active" data-tab="ui">${this.lang.tabUIEditor}</button>
            <button class="editor-tab" data-tab="css">${this.lang.tabCSSEditor}</button>
          </div>

          <div class="editor-panels">
            <!-- UI Editor Tab -->
            <div class="tab-panel active" id="tab-ui">
              <div class="editor-scroll">
                ${this.getUIEditorHTML()}
              </div>
            </div>

            <!-- CSS Editor Tab -->
            <div class="tab-panel" id="tab-css">
              <div class="css-editor-info">${this.lang.cssEditorInfo}</div>
              <textarea id="custom-css" class="css-textarea" placeholder="${this.lang.cssPlaceholder}"></textarea>
            </div>
          </div>

          <div class="modal-footer editor-footer">
            <div class="footer-left">
              <button id="theme-reset" class="btn btn-text">${this.lang.reset}</button>
              <button id="theme-preview" class="btn btn-text">${this.lang.preview}</button>
            </div>
            <div class="footer-right">
              <button id="theme-import" class="btn btn-outline">${this.lang.import}</button>
              <button id="theme-export" class="btn btn-outline">${this.lang.export}</button>
              <button id="theme-cancel" class="btn btn-outline">${this.lang.cancel}</button>
              <button id="theme-apply" class="btn btn-primary">${this.lang.apply}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get UI Editor sections HTML
   */
  getUIEditorHTML() {
    return `
      <!-- Basic Colors -->
      <div class="editor-section">
        <h3 class="section-title">${this.lang.sectionColors}</h3>
        <div class="editor-grid">
          ${this.colorField('custom-bg', this.lang.labelBgColor)}
          ${this.colorField('custom-text', this.lang.labelTextColor)}
          ${this.colorField('custom-accent', this.lang.labelAccentColor)}
          ${this.colorField('custom-border', this.lang.labelBorderColor)}
        </div>
      </div>

      <!-- Font -->
      <div class="editor-section">
        <h3 class="section-title">${this.lang.sectionFont}</h3>
        <div class="editor-grid">
          ${this.selectField('custom-font-family', this.lang.labelBodyFont, [
            { value: 'system-ui', label: this.lang.fontSystem },
            { value: "'Malgun Gothic', sans-serif", label: this.lang.fontMalgun },
            { value: "'Nanum Gothic', sans-serif", label: this.lang.fontNanum },
            { value: "'Pretendard', sans-serif", label: this.lang.fontPretendard },
            { value: "'Noto Sans KR', sans-serif", label: this.lang.fontNoto }
          ])}
          ${this.rangeField('custom-font-size', this.lang.labelBaseFontSize, 12, 24, 1, 16, 'px')}
          ${this.rangeField('custom-line-height', this.lang.labelLineHeight, 1.2, 2.2, 0.1, 1.7, '')}
        </div>
      </div>

      <!-- Code Block -->
      <div class="editor-section">
        <h3 class="section-title">${this.lang.sectionCode}</h3>
        <div class="editor-grid">
          ${this.colorField('custom-code-bg', this.lang.labelBgColor)}
          ${this.colorField('custom-code-text', this.lang.labelTextColor)}
          ${this.selectField('custom-code-font', this.lang.labelCodeFont, [
            { value: "'SFMono-Regular', Consolas, monospace", label: this.lang.labelCodeFontDefault },
            { value: "'Fira Code', monospace", label: 'Fira Code' },
            { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' }
          ])}
        </div>
      </div>

      <!-- Blockquote -->
      <div class="editor-section">
        <h3 class="section-title">${this.lang.sectionBlockquote}</h3>
        <div class="editor-grid">
          ${this.colorField('custom-blockquote-bg', this.lang.labelBgColor)}
          ${this.colorField('custom-blockquote-border', this.lang.labelBorderColor)}
          ${this.rangeField('custom-blockquote-border-width', this.lang.labelBorderWidth, 1, 10, 1, 4, 'px')}
        </div>
      </div>

      <!-- Table -->
      <div class="editor-section">
        <h3 class="section-title">${this.lang.sectionTable}</h3>
        <div class="editor-grid">
          ${this.colorField('custom-table-header-bg', this.lang.labelHeaderBg)}
          ${this.colorField('custom-table-header-text', this.lang.labelHeaderText)}
          ${this.rangeField('custom-table-radius', this.lang.labelBorderRadius, 0, 16, 1, 8, 'px')}
        </div>
      </div>

      <!-- Headings -->
      <div class="editor-section">
        <h3 class="section-title">${this.lang.sectionHeadings}</h3>
        <div class="editor-grid">
          ${this.colorField('custom-h1-color', this.lang.labelH1Color)}
          ${this.colorField('custom-h2-color', this.lang.labelH2Color)}
          ${this.checkboxField('custom-h1-gradient', this.lang.labelUseGradient)}
        </div>
      </div>

      <!-- Text Marks -->
      <div class="editor-section">
        <h3 class="section-title">${this.lang.sectionTextMark}</h3>
        <div class="editor-grid">
          ${this.colorField('custom-link-color', this.lang.labelLinkColor)}
          ${this.colorField('custom-bold-color', this.lang.labelBoldColor)}
          ${this.colorField('custom-italic-color', this.lang.labelItalicColor)}
          ${this.colorField('custom-mark-bg', this.lang.labelHighlightBg)}
          ${this.colorField('custom-mark-text', this.lang.labelHighlightText)}
          ${this.colorField('custom-list-marker', this.lang.labelListMarker)}
        </div>
      </div>

      <!-- Toolbar -->
      <div class="editor-section">
        <h3 class="section-title">${this.lang.sectionToolbar}</h3>
        <div class="editor-grid">
          ${this.colorField('custom-toolbar-bg', this.lang.labelToolbarBg)}
          ${this.colorField('custom-toolbar-bg2', this.lang.labelToolbarGradient)}
          ${this.colorField('custom-tabbar-bg', this.lang.labelTabbarBg)}
        </div>
      </div>
    `;
  }

  /**
   * Helper: Color input field
   */
  colorField(id, label) {
    return `
      <div class="editor-field">
        <label for="${id}">${label}</label>
        <div class="color-input-wrapper">
          <input type="color" id="${id}" class="color-input">
        </div>
      </div>
    `;
  }

  /**
   * Helper: Select field
   */
  selectField(id, label, options) {
    const optionsHtml = options.map(opt =>
      `<option value="${opt.value}">${opt.label}</option>`
    ).join('');

    return `
      <div class="editor-field">
        <label for="${id}">${label}</label>
        <select id="${id}" class="editor-select">${optionsHtml}</select>
      </div>
    `;
  }

  /**
   * Helper: Range input field
   */
  rangeField(id, label, min, max, step, defaultVal, unit) {
    return `
      <div class="editor-field">
        <label for="${id}">${label}</label>
        <div class="range-wrapper">
          <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${defaultVal}">
          <span class="range-value">${defaultVal}${unit}</span>
        </div>
      </div>
    `;
  }

  /**
   * Helper: Checkbox field
   */
  checkboxField(id, label) {
    return `
      <div class="editor-field checkbox-field">
        <input type="checkbox" id="${id}" checked>
        <label for="${id}">${label}</label>
      </div>
    `;
  }

  /**
   * Update texts when language changes
   */
  updateTexts() {
    const modal = $id('theme-editor-modal');
    if (modal && !modal.classList.contains('hidden')) {
      // Modal is open, save current values
      const currentStyles = this.getStylesFromEditor();
      modal.innerHTML = this.getModalHTML();
      this.cacheElements();
      this.setupEventListeners();
      this.applyStylesToEditor(currentStyles);
      modal.classList.remove('hidden');
    } else if (modal) {
      // Modal is closed, just update HTML
      modal.innerHTML = this.getModalHTML();
      this.cacheElements();
      this.setupEventListeners();
    }
  }

  /**
   * Apply styles object to editor inputs
   */
  applyStylesToEditor(styles) {
    // Colors
    this.setInputValue('custom-bg', styles.bg);
    this.setInputValue('custom-text', styles.text);
    this.setInputValue('custom-accent', styles.accent);
    this.setInputValue('custom-border', styles.border);

    // Font
    this.setInputValue('custom-font-family', styles.fontFamily);
    this.setInputValue('custom-font-size', styles.fontSize);
    this.setInputValue('custom-line-height', styles.lineHeight);

    // Code
    this.setInputValue('custom-code-bg', styles.codeBg);
    this.setInputValue('custom-code-text', styles.codeText);
    this.setInputValue('custom-code-font', styles.codeFont);

    // Blockquote
    this.setInputValue('custom-blockquote-bg', styles.blockquoteBg);
    this.setInputValue('custom-blockquote-border', styles.blockquoteBorder);
    this.setInputValue('custom-blockquote-border-width', styles.blockquoteBorderWidth);

    // Table
    this.setInputValue('custom-table-header-bg', styles.tableHeaderBg);
    this.setInputValue('custom-table-header-text', styles.tableHeaderText);
    this.setInputValue('custom-table-radius', styles.tableRadius);

    // Headings
    this.setInputValue('custom-h1-color', styles.h1Color);
    this.setInputValue('custom-h2-color', styles.h2Color);
    this.setCheckboxValue('custom-h1-gradient', styles.h1Gradient);

    // Text Marks
    this.setInputValue('custom-link-color', styles.linkColor);
    this.setInputValue('custom-bold-color', styles.boldColor);
    this.setInputValue('custom-italic-color', styles.italicColor);
    this.setInputValue('custom-mark-bg', styles.markBg);
    this.setInputValue('custom-mark-text', styles.markText);
    this.setInputValue('custom-list-marker', styles.listMarker);

    // Toolbar
    this.setInputValue('custom-toolbar-bg', styles.toolbarBg);
    this.setInputValue('custom-toolbar-bg2', styles.toolbarBg2);
    this.setInputValue('custom-tabbar-bg', styles.tabbarBg);

    // CSS
    if (this.elements.cssTextarea) {
      this.elements.cssTextarea.value = styles.customCss || '';
    }

    this.updateRangeDisplays();
  }

  cacheElements() {
    this.modal = $id('theme-editor-modal');
    this.elements = {
      close: $id('theme-editor-close'),
      tabs: $$('.editor-tab'),
      panels: $$('.tab-panel'),
      cssTextarea: $id('custom-css'),
      resetBtn: $id('theme-reset'),
      previewBtn: $id('theme-preview'),
      importBtn: $id('theme-import'),
      exportBtn: $id('theme-export'),
      cancelBtn: $id('theme-cancel'),
      applyBtn: $id('theme-apply')
    };
  }

  setupEventListeners() {
    if (!this.modal) return;

    this.elements.close?.addEventListener('click', () => this.close());
    this.modal.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        this.close();
      }
    });

    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    $$('.editor-field input[type="range"]').forEach(range => {
      range.addEventListener('input', () => this.updateRangeDisplays());
    });

    this.elements.resetBtn?.addEventListener('click', () => this.reset());
    this.elements.previewBtn?.addEventListener('click', () => this.preview());
    this.elements.importBtn?.addEventListener('click', () => this.handleImport());
    this.elements.exportBtn?.addEventListener('click', () => this.export());
    this.elements.cancelBtn?.addEventListener('click', () => this.cancel());
    this.elements.applyBtn?.addEventListener('click', () => this.applyAndSave());
  }

  open() {
    this.originalState = {
      colorTheme: store.get('colorTheme'),
      customStyles: store.get('customStyles') ? JSON.parse(JSON.stringify(store.get('customStyles'))) : null,
      hasCustomStyleElement: !!themeManager.customStyleElement
    };

    this.modal?.classList.remove('hidden');
    this.loadCurrentStyles();
    eventBus.emit(EVENTS.MODAL_OPENED, 'theme-editor');
  }

  close() {
    this.modal?.classList.add('hidden');
    eventBus.emit(EVENTS.MODAL_CLOSED, 'theme-editor');
  }

  cancel() {
    themeManager.removeCustomStyles();

    if (this.originalState) {
      if (this.originalState.customStyles) {
        store.set('customStyles', this.originalState.customStyles);
        if (this.originalState.colorTheme === 'custom') {
          themeManager.applyCustomStyles(this.originalState.customStyles);
        }
      }
      themeManager.applyColorTheme(this.originalState.colorTheme);
      this.originalState = null;
    }

    this.close();
  }

  switchTab(tabName) {
    this.elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    this.elements.panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
  }

  getCurrentThemeColors() {
    const computedStyle = getComputedStyle(document.documentElement);

    return {
      bg: rgbToHex(computedStyle.getPropertyValue('--bg').trim()),
      text: rgbToHex(computedStyle.getPropertyValue('--text').trim()),
      accent: rgbToHex(computedStyle.getPropertyValue('--accent').trim()),
      border: rgbToHex(computedStyle.getPropertyValue('--border').trim()),
      codeBg: rgbToHex(computedStyle.getPropertyValue('--code-bg').trim()),
      codeText: rgbToHex(computedStyle.getPropertyValue('--code-text').trim()),
      blockquoteBg: rgbToHex(computedStyle.getPropertyValue('--blockquote-bg').trim()),
      blockquoteBorder: rgbToHex(computedStyle.getPropertyValue('--blockquote-border').trim()),
      tableHeaderBg: rgbToHex(computedStyle.getPropertyValue('--table-header-bg').trim()),
      tableHeaderText: rgbToHex(computedStyle.getPropertyValue('--table-header-text').trim()),
      h1Color: rgbToHex(computedStyle.getPropertyValue('--gradient-start').trim()),
      h2Color: rgbToHex(computedStyle.getPropertyValue('--accent').trim()),
      textSecondary: rgbToHex(computedStyle.getPropertyValue('--text-secondary').trim()),
      accentLight: rgbToHex(computedStyle.getPropertyValue('--accent-light').trim())
    };
  }

  loadCurrentStyles() {
    const currentThemeColors = this.getCurrentThemeColors();
    const defaults = themeManager.getDefaultStyles();
    const customStyles = store.get('customStyles');
    const currentColor = store.get('colorTheme');

    const useCustom = currentColor === 'custom' && customStyles;
    const styles = useCustom ? customStyles : defaults;

    // 기본 색상
    this.setInputValue('custom-bg', useCustom ? customStyles.bg : currentThemeColors.bg || '#ffffff');
    this.setInputValue('custom-text', useCustom ? customStyles.text : currentThemeColors.text || '#1f2328');
    this.setInputValue('custom-accent', useCustom ? customStyles.accent : currentThemeColors.accent || '#656d76');
    this.setInputValue('custom-border', useCustom ? customStyles.border : currentThemeColors.border || '#d0d7de');

    // 글꼴
    this.setInputValue('custom-font-family', styles.fontFamily || 'system-ui');
    this.setInputValue('custom-font-size', styles.fontSize || 16);
    this.setInputValue('custom-line-height', styles.lineHeight || 1.7);

    // 코드 블록
    this.setInputValue('custom-code-bg', useCustom ? customStyles.codeBg : currentThemeColors.codeBg || '#f6f8fa');
    this.setInputValue('custom-code-text', useCustom ? customStyles.codeText : currentThemeColors.codeText || '#1f2328');
    this.setInputValue('custom-code-font', styles.codeFont || "'SFMono-Regular', Consolas, monospace");

    // 인용문
    this.setInputValue('custom-blockquote-bg', useCustom ? customStyles.blockquoteBg : currentThemeColors.blockquoteBg || '#f6f8fa');
    this.setInputValue('custom-blockquote-border', useCustom ? customStyles.blockquoteBorder : currentThemeColors.blockquoteBorder || '#d0d7de');
    this.setInputValue('custom-blockquote-border-width', styles.blockquoteBorderWidth || 4);

    // 테이블
    this.setInputValue('custom-table-header-bg', useCustom ? customStyles.tableHeaderBg : currentThemeColors.tableHeaderBg || '#f6f8fa');
    this.setInputValue('custom-table-header-text', useCustom ? customStyles.tableHeaderText : currentThemeColors.tableHeaderText || '#1f2328');
    this.setInputValue('custom-table-radius', styles.tableRadius || 8);

    // 제목
    this.setInputValue('custom-h1-color', useCustom ? customStyles.h1Color : currentThemeColors.h1Color || '#24292f');
    this.setInputValue('custom-h2-color', useCustom ? customStyles.h2Color : currentThemeColors.h2Color || '#656d76');
    this.setCheckboxValue('custom-h1-gradient', styles.h1Gradient !== false);

    // 텍스트 마크
    this.setInputValue('custom-link-color', useCustom ? customStyles.linkColor : currentThemeColors.accent || '#656d76');
    this.setInputValue('custom-bold-color', useCustom ? customStyles.boldColor : currentThemeColors.accent || '#656d76');
    this.setInputValue('custom-italic-color', useCustom ? customStyles.italicColor : currentThemeColors.textSecondary || '#57606a');
    this.setInputValue('custom-mark-bg', useCustom ? customStyles.markBg : currentThemeColors.accentLight || '#fff8c5');
    this.setInputValue('custom-mark-text', useCustom ? customStyles.markText : currentThemeColors.accent || '#656d76');
    this.setInputValue('custom-list-marker', useCustom ? customStyles.listMarker : currentThemeColors.accent || '#656d76');

    // 툴바
    this.setInputValue('custom-toolbar-bg', useCustom ? customStyles.toolbarBg : currentThemeColors.bg || '#f6f8fa');
    this.setInputValue('custom-toolbar-bg2', useCustom ? customStyles.toolbarBg2 : currentThemeColors.bg || '#f6f8fa');
    this.setInputValue('custom-tabbar-bg', useCustom ? customStyles.tabbarBg : currentThemeColors.bg || '#ffffff');

    // CSS
    if (this.elements.cssTextarea) {
      this.elements.cssTextarea.value = styles.customCss || '';
    }

    this.updateRangeDisplays();
  }

  setInputValue(id, value) {
    const el = $id(id);
    if (el) el.value = value;
  }

  setCheckboxValue(id, checked) {
    const el = $id(id);
    if (el) el.checked = checked;
  }

  getInputValue(id, defaultValue = '') {
    const el = $id(id);
    return el ? el.value : defaultValue;
  }

  getCheckboxValue(id) {
    const el = $id(id);
    return el ? el.checked : false;
  }

  updateRangeDisplays() {
    $$('.editor-field input[type="range"]').forEach(range => {
      const display = range.parentElement.querySelector('.range-value');
      if (display) {
        const unit = range.id.includes('height') ? '' : 'px';
        display.textContent = range.value + unit;
      }
    });
  }

  getStylesFromEditor() {
    return {
      bg: this.getInputValue('custom-bg'),
      text: this.getInputValue('custom-text'),
      accent: this.getInputValue('custom-accent'),
      border: this.getInputValue('custom-border'),
      fontFamily: this.getInputValue('custom-font-family'),
      fontSize: parseInt(this.getInputValue('custom-font-size')),
      lineHeight: parseFloat(this.getInputValue('custom-line-height')),
      codeBg: this.getInputValue('custom-code-bg'),
      codeText: this.getInputValue('custom-code-text'),
      codeFont: this.getInputValue('custom-code-font'),
      blockquoteBg: this.getInputValue('custom-blockquote-bg'),
      blockquoteBorder: this.getInputValue('custom-blockquote-border'),
      blockquoteBorderWidth: parseInt(this.getInputValue('custom-blockquote-border-width')),
      tableHeaderBg: this.getInputValue('custom-table-header-bg'),
      tableHeaderText: this.getInputValue('custom-table-header-text'),
      tableRadius: parseInt(this.getInputValue('custom-table-radius')),
      h1Color: this.getInputValue('custom-h1-color'),
      h2Color: this.getInputValue('custom-h2-color'),
      h1Gradient: this.getCheckboxValue('custom-h1-gradient'),
      linkColor: this.getInputValue('custom-link-color'),
      boldColor: this.getInputValue('custom-bold-color'),
      italicColor: this.getInputValue('custom-italic-color'),
      markBg: this.getInputValue('custom-mark-bg'),
      markText: this.getInputValue('custom-mark-text'),
      listMarker: this.getInputValue('custom-list-marker'),
      toolbarBg: this.getInputValue('custom-toolbar-bg'),
      toolbarBg2: this.getInputValue('custom-toolbar-bg2'),
      tabbarBg: this.getInputValue('custom-tabbar-bg'),
      customCss: this.elements.cssTextarea?.value || ''
    };
  }

  preview() {
    const styles = this.getStylesFromEditor();
    themeManager.applyCustomStyles(styles);
    this.showNotification(this.lang.previewApplied);
  }

  applyAndSave() {
    const styles = this.getStylesFromEditor();
    store.set('customStyles', styles);
    themeManager.applyCustomStyles(styles);
    themeManager.selectCustomTheme();
    this.close();
    this.showNotification(this.lang.themeApplied);
  }

  reset() {
    store.set('customStyles', null);
    themeManager.removeCustomStyles();
    themeManager.hideCustomThemeOption();
    this.loadCurrentStyles();
    this.showNotification(this.lang.themeReset);
  }

  async export() {
    const styles = this.getStylesFromEditor();
    const themeData = {
      version: '2.0',
      app: 'SP MD Viewer',
      exportedAt: new Date().toISOString(),
      baseTheme: store.get('theme'),
      colorTheme: store.get('colorTheme'),
      customStyles: styles,
      generatedCss: themeManager.generateCustomCss(styles)
    };

    const jsonContent = JSON.stringify(themeData, null, 2);
    const defaultFileName = `sp-mdviewer-theme-${Date.now()}.json`;

    // Tauri 환경 체크
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (filePath) {
        await writeTextFile(filePath, jsonContent);
        this.showNotification(this.lang.themeSaved);
      }
    } catch {
      // 브라우저 환경 폴백
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        this.importTheme(e.target.files[0]);
      }
    };
    input.click();
  }

  importTheme(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.version === '2.0' && data.customStyles) {
          store.set('customStyles', data.customStyles);
          themeManager.applyCustomStyles(data.customStyles);
          themeManager.selectCustomTheme();
          this.loadCurrentStyles();
          this.showNotification(this.lang.themeImported);
        } else if (data.theme || data.colorTheme) {
          if (data.theme) themeManager.applyTheme(data.theme);
          if (data.colorTheme) themeManager.applyColorTheme(data.colorTheme);
          this.showNotification(this.lang.themeImported);
        } else {
          throw new Error('Unknown theme format');
        }
      } catch (error) {
        this.showError(this.lang.themeImportError, this.lang.invalidTheme);
      }
    };
    reader.readAsText(file);
  }

  showNotification(message) {
    eventBus.emit(EVENTS.NOTIFICATION_SHOWN, message);
  }

  showError(title, message) {
    console.error(`${title}: ${message}`);
    eventBus.emit(EVENTS.NOTIFICATION_SHOWN, `${title}: ${message}`);
  }
}

export const themeEditor = new ThemeEditor();
