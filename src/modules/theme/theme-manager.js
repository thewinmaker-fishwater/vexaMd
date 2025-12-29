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
