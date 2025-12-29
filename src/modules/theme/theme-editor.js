/**
 * Theme Editor - 테마 편집기 모달
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id, $, $$ } from '../../core/dom.js';
import { rgbToHex } from '../../utils/helpers.js';
import { themeManager } from './theme-manager.js';

class ThemeEditor {
  constructor() {
    this.modal = null;
    this.originalState = null;
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
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
    this.modal.querySelector('.modal-backdrop')?.addEventListener('click', () => this.close());

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
    this.showNotification('미리보기 적용됨');
  }

  applyAndSave() {
    const styles = this.getStylesFromEditor();
    store.set('customStyles', styles);
    themeManager.applyCustomStyles(styles);
    themeManager.selectCustomTheme();
    this.close();
    this.showNotification('테마가 적용되었습니다!');
  }

  reset() {
    store.set('customStyles', null);
    themeManager.removeCustomStyles();
    themeManager.hideCustomThemeOption();
    this.loadCurrentStyles();
    this.showNotification('테마가 초기화되었습니다');
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
        this.showNotification('테마를 저장했습니다!');
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
          this.showNotification('커스텀 테마를 불러왔습니다!');
        } else if (data.theme || data.colorTheme) {
          if (data.theme) themeManager.applyTheme(data.theme);
          if (data.colorTheme) themeManager.applyColorTheme(data.colorTheme);
          this.showNotification('테마 설정을 불러왔습니다!');
        } else {
          throw new Error('알 수 없는 테마 형식');
        }
      } catch (error) {
        this.showError('테마 불러오기 실패', '유효한 테마 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: var(--accent);
      color: white;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1001;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);

    eventBus.emit(EVENTS.NOTIFICATION_SHOWN, message);
  }

  showError(title, message) {
    console.error(`${title}: ${message}`);
    this.showNotification(`${title}: ${message}`);
  }
}

export const themeEditor = new ThemeEditor();
