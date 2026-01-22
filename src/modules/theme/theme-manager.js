/**
 * Theme Manager - 테마 전환 및 관리
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id } from '../../core/dom.js';

class ThemeManager {
  constructor() {
    this.customStyleElement = null;
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupSubscriptions();
    this.applyInitialTheme();
  }

  cacheElements() {
    this.elements = {
      iconDark: $id('icon-dark'),
      iconLight: $id('icon-light'),
      colorTheme: $id('color-theme'),
      customThemeOption: $id('custom-theme-option')
    };
  }

  setupSubscriptions() {
    store.subscribe('theme', (theme) => this.applyTheme(theme));
    store.subscribe('colorTheme', (color) => this.applyColorTheme(color));
    store.subscribe('customStyles', (styles) => {
      if (styles && store.get('colorTheme') === 'custom') {
        this.applyCustomStyles(styles);
      }
    });
  }

  applyInitialTheme() {
    const theme = store.get('theme');
    const colorTheme = store.get('colorTheme');
    const customStyles = store.get('customStyles');

    this.applyTheme(theme);

    // 저장된 테마 옵션 업데이트
    this.updateColorThemeSelect();

    if (customStyles && this.elements.customThemeOption) {
      this.elements.customThemeOption.hidden = false;
    }

    this.applyColorTheme(colorTheme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    store.set('theme', theme);

    if (this.elements.iconDark && this.elements.iconLight) {
      if (theme === 'dark') {
        this.elements.iconDark.style.display = 'none';
        this.elements.iconLight.style.display = 'block';
      } else {
        this.elements.iconDark.style.display = 'block';
        this.elements.iconLight.style.display = 'none';
      }
    }

    eventBus.emit(EVENTS.THEME_CHANGED, theme);
  }

  applyColorTheme(color) {
    // 저장된 테마인 경우 (theme- 접두사)
    if (color.startsWith('theme-')) {
      return this.applySavedTheme(color);
    }

    // 커스텀이나 저장된 테마가 아닌 경우 커스텀 스타일 제거
    if (color !== 'custom') {
      if (this.customStyleElement) {
        this.customStyleElement.remove();
        this.customStyleElement = null;
      }
    }

    if (color === 'default') {
      document.documentElement.removeAttribute('data-color');
    } else if (color === 'custom') {
      document.documentElement.removeAttribute('data-color');
      const customStyles = store.get('customStyles');
      if (customStyles) {
        this.applyCustomStyles(customStyles);
      }
    } else {
      document.documentElement.setAttribute('data-color', color);
    }

    store.set('colorTheme', color);

    if (this.elements.colorTheme) {
      this.elements.colorTheme.value = color;
    }

    eventBus.emit(EVENTS.COLOR_THEME_CHANGED, color);
  }

  toggle() {
    const current = store.get('theme');
    this.applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  selectCustomTheme() {
    if (this.elements.customThemeOption) {
      this.elements.customThemeOption.hidden = false;
      this.elements.colorTheme.value = 'custom';
      store.set('colorTheme', 'custom');
    }
  }

  hideCustomThemeOption() {
    if (this.elements.customThemeOption) {
      this.elements.customThemeOption.hidden = true;
      this.elements.colorTheme.value = 'default';
      store.set('colorTheme', 'default');
    }
  }

  applyCustomStyles(styles) {
    if (this.customStyleElement) {
      this.customStyleElement.remove();
    }

    this.customStyleElement = document.createElement('style');
    this.customStyleElement.id = 'custom-theme-styles';
    this.customStyleElement.textContent = this.generateCustomCss(styles);
    document.head.appendChild(this.customStyleElement);

    eventBus.emit(EVENTS.CUSTOM_THEME_APPLIED, styles);
  }

  removeCustomStyles() {
    if (this.customStyleElement) {
      this.customStyleElement.remove();
      this.customStyleElement = null;
    }
  }

  generateCustomCss(styles) {
    let css = `
/* SP MD Viewer - Custom Theme */
:root {
  --bg: ${styles.bg} !important;
  --text: ${styles.text} !important;
  --accent: ${styles.accent} !important;
  --border: ${styles.border} !important;
  --code-bg: ${styles.codeBg} !important;
  --code-text: ${styles.codeText} !important;
  --blockquote-bg: ${styles.blockquoteBg} !important;
  --blockquote-border: ${styles.blockquoteBorder} !important;
  --table-header-bg: ${styles.tableHeaderBg} !important;
  --table-header-text: ${styles.tableHeaderText} !important;
}

body {
  font-family: ${styles.fontFamily} !important;
}

.markdown-body {
  line-height: ${styles.lineHeight} !important;
}

.markdown-body code,
.markdown-body pre code {
  font-family: ${styles.codeFont} !important;
}

.markdown-body blockquote {
  border-left-width: ${styles.blockquoteBorderWidth}px !important;
}

.markdown-body table {
  border-radius: ${styles.tableRadius}px !important;
}

.markdown-body h1 {
  ${styles.h1Gradient
    ? `background: linear-gradient(135deg, ${styles.h1Color}, ${styles.accent}) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;`
    : `color: ${styles.h1Color} !important;
  -webkit-text-fill-color: ${styles.h1Color} !important;`}
}

.markdown-body h2,
.markdown-body h3 {
  color: ${styles.h2Color} !important;
}

.markdown-body a {
  color: ${styles.linkColor} !important;
}

.markdown-body a:hover {
  border-bottom-color: ${styles.linkColor} !important;
}

.markdown-body strong {
  color: ${styles.boldColor} !important;
}

.markdown-body em {
  color: ${styles.italicColor} !important;
}

.markdown-body mark {
  background: ${styles.markBg} !important;
  color: ${styles.markText} !important;
}

.markdown-body li::marker {
  color: ${styles.listMarker} !important;
}

.markdown-body hr {
  background: linear-gradient(90deg, transparent, ${styles.linkColor}, transparent) !important;
}

#toolbar {
  background: linear-gradient(135deg, ${styles.toolbarBg} 0%, ${styles.toolbarBg2} 100%) !important;
}

#tab-bar {
  background: ${styles.tabbarBg} !important;
}
`;

    if (styles.customCss && styles.customCss.trim()) {
      css += `\n/* User Custom CSS */\n${styles.customCss}`;
    }

    return css;
  }

  // ========== 저장된 테마 관리 ==========

  /**
   * 저장된 테마 목록 가져오기
   */
  getSavedThemes() {
    return store.get('customThemes') || [];
  }

  /**
   * 새 테마 저장
   */
  saveTheme(name, styles) {
    const themes = this.getSavedThemes();
    const newTheme = {
      id: 'theme-' + Date.now(),
      name: name.trim(),
      styles: JSON.parse(JSON.stringify(styles)),
      createdAt: new Date().toISOString()
    };
    themes.push(newTheme);
    store.set('customThemes', themes);
    this.updateColorThemeSelect();
    return newTheme;
  }

  /**
   * 테마 삭제
   */
  deleteTheme(themeId) {
    const themes = this.getSavedThemes();
    const filtered = themes.filter(t => t.id !== themeId);
    store.set('customThemes', filtered);

    // 현재 적용된 테마가 삭제된 경우 기본으로 변경
    if (store.get('colorTheme') === themeId) {
      this.applyColorTheme('default');
    }

    this.updateColorThemeSelect();
    return filtered;
  }

  /**
   * 테마 이름 변경
   */
  renameTheme(themeId, newName) {
    const themes = this.getSavedThemes();
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      theme.name = newName.trim();
      store.set('customThemes', themes);
      this.updateColorThemeSelect();
    }
    return themes;
  }

  /**
   * 저장된 테마 적용
   */
  applySavedTheme(themeId) {
    const themes = this.getSavedThemes();
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      store.set('customStyles', theme.styles);
      this.applyCustomStyles(theme.styles);
      store.set('colorTheme', themeId);

      if (this.elements.colorTheme) {
        this.elements.colorTheme.value = themeId;
      }

      eventBus.emit(EVENTS.COLOR_THEME_CHANGED, themeId);
      return true;
    }
    return false;
  }

  /**
   * 컬러 테마 select 업데이트 (저장된 테마 옵션 추가)
   */
  updateColorThemeSelect() {
    const select = this.elements.colorTheme;
    if (!select) return;

    // 기존 저장된 테마 옵션 제거
    const existingCustomOptions = select.querySelectorAll('option[data-custom-theme]');
    existingCustomOptions.forEach(opt => opt.remove());

    // 저장된 테마 옵션 추가
    const themes = this.getSavedThemes();
    const customOption = this.elements.customThemeOption;

    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.id;
      option.textContent = `★ ${theme.name}`;
      option.setAttribute('data-custom-theme', 'true');
      // custom 옵션 앞에 삽입
      if (customOption) {
        select.insertBefore(option, customOption);
      } else {
        select.appendChild(option);
      }
    });

    // 현재 선택된 테마 복원
    const currentTheme = store.get('colorTheme');
    if (currentTheme) {
      select.value = currentTheme;
    }
  }

  getDefaultStyles() {
    return {
      bg: '#ffffff',
      text: '#1f2328',
      accent: '#656d76',
      border: '#d0d7de',
      fontFamily: 'system-ui',
      fontSize: 16,
      lineHeight: 1.7,
      codeBg: '#f6f8fa',
      codeText: '#1f2328',
      codeFont: "'SFMono-Regular', Consolas, monospace",
      blockquoteBg: '#f6f8fa',
      blockquoteBorder: '#d0d7de',
      blockquoteBorderWidth: 4,
      tableHeaderBg: '#f6f8fa',
      tableHeaderText: '#1f2328',
      tableRadius: 8,
      h1Color: '#24292f',
      h2Color: '#656d76',
      h1Gradient: true,
      linkColor: '#656d76',
      boldColor: '#656d76',
      italicColor: '#57606a',
      markBg: '#fff8c5',
      markText: '#656d76',
      listMarker: '#656d76',
      toolbarBg: '#f6f8fa',
      toolbarBg2: '#f6f8fa',
      tabbarBg: '#ffffff',
      customCss: ''
    };
  }
}

export const themeManager = new ThemeManager();
