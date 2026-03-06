/**
 * Theme System Module
 * Theme apply, editor, import/export, saved themes
 */

import { showNotification, showError } from '../notification/notification.js';

// State
let currentTheme = localStorage.getItem('theme') || 'light';
let currentColor = localStorage.getItem('colorTheme') || 'default';
let currentFontFamily = localStorage.getItem('fontFamily') || 'system';
let currentFontSize = localStorage.getItem('fontSize') || 'medium';
let currentContentWidth = localStorage.getItem('contentWidth') || 'narrow';
let customStyles = JSON.parse(localStorage.getItem('customStyles') || 'null');
let customStyleElement = null;
let customThemes = JSON.parse(localStorage.getItem('customThemes') || '[]');
let editorOriginalState = null;
let currentEditorTab = 'ui';

let els = {};
let ctx = {};

export function init(context) {
  els = {
    iconDark: document.getElementById('icon-dark'),
    iconLight: document.getElementById('icon-light'),
    colorTheme: document.getElementById('color-theme'),
    fontFamily: document.getElementById('font-family'),
    fontSize: document.getElementById('font-size'),
    contentWidth: document.getElementById('content-width'),
    customThemeOption: document.getElementById('custom-theme-option'),
    btnTheme: document.getElementById('btn-theme'),
    btnCustomize: document.getElementById('btn-customize'),
    // Theme editor
    themeEditorModal: document.getElementById('theme-editor-modal'),
    themeEditorClose: document.getElementById('theme-editor-close'),
    editorTabs: document.querySelectorAll('.editor-tab'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    customCssTextarea: document.getElementById('custom-css'),
    themeReset: document.getElementById('theme-reset'),
    themePreview: document.getElementById('theme-preview'),
    themeImportBtn: document.getElementById('theme-import'),
    themeExportBtn: document.getElementById('theme-export'),
    themeCancel: document.getElementById('theme-cancel'),
    themeApply: document.getElementById('theme-apply'),
    // Saved themes
    themeNameInput: document.getElementById('theme-name-input'),
    saveCurrentThemeBtn: document.getElementById('save-current-theme'),
    savedThemesList: document.getElementById('saved-themes-list'),
  };
  ctx = context;

  // Event listeners
  els.btnTheme.addEventListener('click', toggleTheme);
  els.btnCustomize.addEventListener('click', openThemeEditor);

  els.colorTheme.addEventListener('change', (e) => applyColorTheme(e.target.value));
  els.fontFamily.addEventListener('change', (e) => applyFontFamily(e.target.value));
  els.fontSize.addEventListener('change', (e) => applyFontSize(e.target.value));
  els.contentWidth.addEventListener('change', (e) => applyContentWidth(e.target.value));

  els.themeEditorClose.addEventListener('click', closeThemeEditor);
  els.themeEditorModal.querySelector('.modal-backdrop').addEventListener('click', closeThemeEditor);

  els.editorTabs.forEach(tab => {
    tab.addEventListener('click', () => switchEditorTab(tab.dataset.tab));
  });

  document.querySelectorAll('.editor-field input[type="range"]').forEach(range => {
    range.addEventListener('input', updateRangeDisplays);
  });

  els.themeReset.addEventListener('click', resetTheme);
  els.themePreview.addEventListener('click', previewTheme);
  els.themeImportBtn.addEventListener('click', handleThemeImport);
  els.themeExportBtn.addEventListener('click', exportTheme);
  els.themeCancel.addEventListener('click', cancelThemeEditor);
  els.themeApply.addEventListener('click', applyAndSaveTheme);

  if (els.saveCurrentThemeBtn) {
    els.saveCurrentThemeBtn.addEventListener('click', saveCurrentTheme);
  }
  if (els.themeNameInput) {
    els.themeNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveCurrentTheme();
    });
  }
}

export function getCurrentTheme() { return currentTheme; }
export function getCurrentColor() { return currentColor; }
export function getCurrentFontFamily() { return currentFontFamily; }
export function getCurrentFontSize() { return currentFontSize; }
export function getCurrentContentWidth() { return currentContentWidth; }

// ========== Theme Apply ==========
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('theme', theme);
  if (theme === 'dark') {
    els.iconDark.style.display = 'none';
    els.iconLight.style.display = 'block';
  } else {
    els.iconDark.style.display = 'block';
    els.iconLight.style.display = 'none';
  }
}

export function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

export function applyColorTheme(color) {
  if (color.startsWith('theme-')) {
    if (applySavedTheme(color)) return;
    color = 'default';
  }
  if (color !== 'custom') {
    if (customStyleElement) {
      customStyleElement.remove();
      customStyleElement = null;
    }
  }
  if (color === 'default') {
    document.documentElement.removeAttribute('data-color');
  } else if (color === 'custom') {
    document.documentElement.removeAttribute('data-color');
    if (customStyles) applyCustomStyles(customStyles);
  } else {
    document.documentElement.setAttribute('data-color', color);
  }
  currentColor = color;
  localStorage.setItem('colorTheme', color);
  els.colorTheme.value = color;
}

function selectCustomTheme() {
  if (els.customThemeOption) {
    els.customThemeOption.hidden = false;
    els.colorTheme.value = 'custom';
    currentColor = 'custom';
    localStorage.setItem('colorTheme', 'custom');
  }
}

function hideCustomThemeOption() {
  if (els.customThemeOption) {
    els.customThemeOption.hidden = true;
    els.colorTheme.value = 'default';
    currentColor = 'default';
    localStorage.setItem('colorTheme', 'default');
  }
}

export function applyFontFamily(family) {
  document.documentElement.setAttribute('data-font-family', family);
  currentFontFamily = family;
  localStorage.setItem('fontFamily', family);
  els.fontFamily.value = family;
}

export function applyFontSize(size) {
  document.documentElement.setAttribute('data-font-size', size);
  currentFontSize = size;
  localStorage.setItem('fontSize', size);
  els.fontSize.value = size;
}

export function applyContentWidth(width) {
  document.documentElement.setAttribute('data-content-width', width);
  currentContentWidth = width;
  localStorage.setItem('contentWidth', width);
  els.contentWidth.value = width;
}

// ========== Theme Editor ==========
function openThemeEditor() {
  editorOriginalState = {
    colorTheme: currentColor,
    customStyles: customStyles ? JSON.parse(JSON.stringify(customStyles)) : null,
    hasCustomStyleElement: !!customStyleElement
  };
  els.themeEditorModal.classList.remove('hidden');
  loadCurrentStylesToEditor();
  refreshSavedThemesList();
}

function closeThemeEditor() {
  els.themeEditorModal.classList.add('hidden');
}

function cancelThemeEditor() {
  if (customStyleElement) {
    customStyleElement.remove();
    customStyleElement = null;
  }
  if (editorOriginalState) {
    if (editorOriginalState.customStyles) {
      customStyles = editorOriginalState.customStyles;
      if (editorOriginalState.colorTheme === 'custom') {
        applyCustomStyles(customStyles);
      }
    }
    applyColorTheme(editorOriginalState.colorTheme);
    editorOriginalState = null;
  }
  closeThemeEditor();
}

function switchEditorTab(tabName) {
  currentEditorTab = tabName;
  els.editorTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  els.tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
  const previewBtn = document.getElementById('theme-preview');
  const applyBtn = document.getElementById('theme-apply');
  if (tabName === 'saved') {
    previewBtn.style.display = 'none';
    applyBtn.style.display = 'none';
  } else {
    previewBtn.style.display = '';
    applyBtn.style.display = '';
  }
}

function getDefaultStyles() {
  return {
    bg: '#ffffff', text: '#1f2328', accent: '#656d76', border: '#d0d7de',
    fontFamily: 'system-ui', fontSize: 16, lineHeight: 1.7,
    codeBg: '#f6f8fa', codeText: '#1f2328', codeFont: "'SFMono-Regular', Consolas, monospace",
    blockquoteBg: '#f6f8fa', blockquoteBorder: '#d0d7de', blockquoteBorderWidth: 4,
    tableHeaderBg: '#f6f8fa', tableHeaderText: '#1f2328', tableRadius: 8,
    h1Color: '#24292f', h2Color: '#656d76', h1Gradient: true,
    linkColor: '#656d76', boldColor: '#656d76', italicColor: '#57606a',
    markBg: '#fff8c5', markText: '#656d76', listMarker: '#656d76',
    toolbarBg: '#f6f8fa', toolbarBg2: '#f6f8fa', tabbarBg: '#ffffff',
    customCss: ''
  };
}

function getDefaultCssTemplate() {
  return `/* ========================================
   Vexa MD - Custom Theme CSS Template
   UI 에디터와 동일한 수준의 커스터마이징 가능

   중요: !important를 사용해야 스타일이 적용됩니다!
   ======================================== */

/* ========== 1. 기본 색상 변수 (Basic Colors) ========== */
:root {
  --bg: #ffffff !important;
  --text: #1f2328 !important;
  --accent: #656d76 !important;
  --border: #d0d7de !important;
  --code-bg: #f6f8fa !important;
  --code-text: #1f2328 !important;
  --blockquote-bg: #f6f8fa !important;
  --blockquote-border: #d0d7de !important;
  --table-header-bg: #f6f8fa !important;
  --table-header-text: #1f2328 !important;
}

body {
  font-family: system-ui, -apple-system, sans-serif !important;
}

.markdown-body {
  line-height: 1.7 !important;
}

.markdown-body code,
.markdown-body pre code {
  font-family: 'SFMono-Regular', Consolas, monospace !important;
}

.markdown-body h1 {
  background: linear-gradient(135deg, #24292f, #656d76) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

.markdown-body h2,
.markdown-body h3 {
  color: #656d76 !important;
}

.markdown-body pre {
  background: var(--code-bg) !important;
}

.markdown-body blockquote {
  background: var(--blockquote-bg) !important;
  border-left-color: var(--blockquote-border) !important;
  border-left-width: 4px !important;
}

.markdown-body table {
  border-radius: 8px !important;
}

.markdown-body table th {
  background: var(--table-header-bg) !important;
  color: var(--table-header-text) !important;
}

.markdown-body a {
  color: #656d76 !important;
}
.markdown-body a:hover {
  border-bottom-color: #656d76 !important;
}

.markdown-body strong {
  color: #656d76 !important;
}

.markdown-body em {
  color: #57606a !important;
}

.markdown-body mark {
  background: #fff8c5 !important;
  color: #656d76 !important;
}

.markdown-body li::marker {
  color: #656d76 !important;
}

.markdown-body hr {
  background: linear-gradient(90deg, transparent, #656d76, transparent) !important;
}

#toolbar {
  background: linear-gradient(135deg, #f6f8fa 0%, #f6f8fa 100%) !important;
}

#tab-bar {
  background: #ffffff !important;
}

`;
}

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent') return '#ffffff';
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#ffffff';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function getCurrentThemeColors() {
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

function loadCurrentStylesToEditor() {
  const currentThemeColors = getCurrentThemeColors();
  const defaults = getDefaultStyles();
  const useCustom = currentColor === 'custom' && customStyles;
  const styles = useCustom ? customStyles : defaults;

  document.getElementById('custom-bg').value = useCustom ? customStyles.bg : currentThemeColors.bg || '#ffffff';
  document.getElementById('custom-text').value = useCustom ? customStyles.text : currentThemeColors.text || '#1f2328';
  document.getElementById('custom-accent').value = useCustom ? customStyles.accent : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-border').value = useCustom ? customStyles.border : currentThemeColors.border || '#d0d7de';
  document.getElementById('custom-font-family').value = styles.fontFamily || 'system-ui';
  document.getElementById('custom-font-size').value = styles.fontSize || 16;
  document.getElementById('custom-line-height').value = styles.lineHeight || 1.7;
  document.getElementById('custom-code-bg').value = useCustom ? customStyles.codeBg : currentThemeColors.codeBg || '#f6f8fa';
  document.getElementById('custom-code-text').value = useCustom ? customStyles.codeText : currentThemeColors.codeText || '#1f2328';
  document.getElementById('custom-code-font').value = styles.codeFont || "'SFMono-Regular', Consolas, monospace";
  document.getElementById('custom-blockquote-bg').value = useCustom ? customStyles.blockquoteBg : currentThemeColors.blockquoteBg || '#f6f8fa';
  document.getElementById('custom-blockquote-border').value = useCustom ? customStyles.blockquoteBorder : currentThemeColors.blockquoteBorder || '#d0d7de';
  document.getElementById('custom-blockquote-border-width').value = styles.blockquoteBorderWidth || 4;
  document.getElementById('custom-table-header-bg').value = useCustom ? customStyles.tableHeaderBg : currentThemeColors.tableHeaderBg || '#f6f8fa';
  document.getElementById('custom-table-header-text').value = useCustom ? customStyles.tableHeaderText : currentThemeColors.tableHeaderText || '#1f2328';
  document.getElementById('custom-table-radius').value = styles.tableRadius || 8;
  document.getElementById('custom-h1-color').value = useCustom ? customStyles.h1Color : currentThemeColors.h1Color || '#24292f';
  document.getElementById('custom-h2-color').value = useCustom ? customStyles.h2Color : currentThemeColors.h2Color || '#656d76';
  document.getElementById('custom-h1-gradient').checked = styles.h1Gradient !== false;
  document.getElementById('custom-link-color').value = useCustom ? customStyles.linkColor : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-bold-color').value = useCustom ? customStyles.boldColor : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-italic-color').value = useCustom ? customStyles.italicColor : currentThemeColors.textSecondary || '#57606a';
  document.getElementById('custom-mark-bg').value = useCustom ? customStyles.markBg : currentThemeColors.accentLight || '#fff8c5';
  document.getElementById('custom-mark-text').value = useCustom ? customStyles.markText : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-list-marker').value = useCustom ? customStyles.listMarker : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-toolbar-bg').value = useCustom ? customStyles.toolbarBg : currentThemeColors.bg || '#f6f8fa';
  document.getElementById('custom-toolbar-bg2').value = useCustom ? customStyles.toolbarBg2 : currentThemeColors.bg || '#f6f8fa';
  document.getElementById('custom-tabbar-bg').value = useCustom ? customStyles.tabbarBg : currentThemeColors.bg || '#ffffff';
  els.customCssTextarea.value = styles.customCss || getDefaultCssTemplate();
  updateRangeDisplays();
}

function updateRangeDisplays() {
  document.querySelectorAll('.editor-field input[type="range"]').forEach(range => {
    const display = range.parentElement.querySelector('.range-value');
    if (display) {
      const unit = range.id.includes('height') ? '' : 'px';
      display.textContent = range.value + unit;
    }
  });
}

function getStylesFromEditor() {
  return {
    bg: document.getElementById('custom-bg').value,
    text: document.getElementById('custom-text').value,
    accent: document.getElementById('custom-accent').value,
    border: document.getElementById('custom-border').value,
    fontFamily: document.getElementById('custom-font-family').value,
    fontSize: parseInt(document.getElementById('custom-font-size').value),
    lineHeight: parseFloat(document.getElementById('custom-line-height').value),
    codeBg: document.getElementById('custom-code-bg').value,
    codeText: document.getElementById('custom-code-text').value,
    codeFont: document.getElementById('custom-code-font').value,
    blockquoteBg: document.getElementById('custom-blockquote-bg').value,
    blockquoteBorder: document.getElementById('custom-blockquote-border').value,
    blockquoteBorderWidth: parseInt(document.getElementById('custom-blockquote-border-width').value),
    tableHeaderBg: document.getElementById('custom-table-header-bg').value,
    tableHeaderText: document.getElementById('custom-table-header-text').value,
    tableRadius: parseInt(document.getElementById('custom-table-radius').value),
    h1Color: document.getElementById('custom-h1-color').value,
    h2Color: document.getElementById('custom-h2-color').value,
    h1Gradient: document.getElementById('custom-h1-gradient').checked,
    linkColor: document.getElementById('custom-link-color').value,
    boldColor: document.getElementById('custom-bold-color').value,
    italicColor: document.getElementById('custom-italic-color').value,
    markBg: document.getElementById('custom-mark-bg').value,
    markText: document.getElementById('custom-mark-text').value,
    listMarker: document.getElementById('custom-list-marker').value,
    toolbarBg: document.getElementById('custom-toolbar-bg').value,
    toolbarBg2: document.getElementById('custom-toolbar-bg2').value,
    tabbarBg: document.getElementById('custom-tabbar-bg').value,
    customCss: els.customCssTextarea.value
  };
}

function generateCustomCss(styles) {
  let css = `
/* Vexa MD - Custom Theme */
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
    const isDefaultTemplate = styles.customCss.includes('Vexa MD - Custom Theme CSS Template');
    if (!isDefaultTemplate) {
      css += `\n/* User Custom CSS */\n${styles.customCss}`;
    }
  }

  return css;
}

function applyCustomStyles(styles) {
  if (customStyleElement) customStyleElement.remove();
  customStyleElement = document.createElement('style');
  customStyleElement.id = 'custom-theme-styles';
  customStyleElement.textContent = generateCustomCss(styles);
  document.head.appendChild(customStyleElement);
}

function applyCssOnly(cssContent) {
  if (customStyleElement) customStyleElement.remove();
  customStyleElement = document.createElement('style');
  customStyleElement.id = 'custom-theme-styles';
  customStyleElement.textContent = cssContent;
  document.head.appendChild(customStyleElement);
}

function previewTheme() {
  if (currentEditorTab === 'css') {
    applyCssOnly(els.customCssTextarea.value);
    showNotification('CSS 미리보기 적용됨');
  } else {
    const styles = getStylesFromEditor();
    applyCustomStyles(styles);
    showNotification('미리보기 적용됨');
  }
}

function applyAndSaveTheme() {
  if (currentEditorTab === 'css') {
    const cssContent = els.customCssTextarea.value;
    customStyles = { ...getDefaultStyles(), customCss: cssContent };
    localStorage.setItem('customStyles', JSON.stringify(customStyles));
    applyCssOnly(cssContent);
    selectCustomTheme();
    closeThemeEditor();
    showNotification('CSS 테마가 적용되었습니다!');
  } else {
    const styles = getStylesFromEditor();
    customStyles = styles;
    localStorage.setItem('customStyles', JSON.stringify(styles));
    applyCustomStyles(styles);
    selectCustomTheme();
    closeThemeEditor();
    showNotification('테마가 적용되었습니다!');
  }
}

function resetTheme() {
  customStyles = null;
  localStorage.removeItem('customStyles');
  if (customStyleElement) {
    customStyleElement.remove();
    customStyleElement = null;
  }
  hideCustomThemeOption();
  loadCurrentStylesToEditor();
  showNotification('테마가 초기화되었습니다');
}

export async function exportTheme() {
  const styles = getStylesFromEditor();
  const themeData = {
    version: '2.0',
    app: 'Vexa MD',
    exportedAt: new Date().toISOString(),
    baseTheme: currentTheme,
    colorTheme: currentColor,
    customStyles: styles,
    generatedCss: generateCustomCss(styles)
  };

  const jsonContent = JSON.stringify(themeData, null, 2);
  const defaultFileName = `chilbong-custom-theme-${Date.now()}.json`;

  const dialogSave = ctx.getDialogSave?.();
  const fsWriteTextFile = ctx.getFsWriteTextFile?.();
  const tauriApi = ctx.getTauriApi?.();

  if (dialogSave && tauriApi) {
    try {
      const filePath = await dialogSave({
        defaultPath: defaultFileName,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (filePath) {
        await fsWriteTextFile(filePath, jsonContent);
        showNotification('테마를 저장했습니다!');
      }
    } catch (error) {
      console.error('Export error:', error);
      showError('저장 실패', String(error));
    }
  } else {
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

export function importTheme(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.version === '2.0' && data.customStyles) {
        customStyles = data.customStyles;
        localStorage.setItem('customStyles', JSON.stringify(customStyles));
        applyCustomStyles(customStyles);
        selectCustomTheme();
        loadCurrentStylesToEditor();
        showNotification('커스텀 테마를 불러왔습니다!');
      } else if (data.theme || data.colorTheme) {
        if (data.theme) applyTheme(data.theme);
        if (data.colorTheme) applyColorTheme(data.colorTheme);
        if (data.fontSize) applyFontSize(data.fontSize);
        showNotification('테마 설정을 불러왔습니다!');
      } else {
        throw new Error('알 수 없는 테마 형식');
      }
    } catch (error) {
      showError('테마 불러오기 실패', '유효한 테마 파일이 아닙니다.');
    }
  };
  reader.readAsText(file);
}

export function importThemeData(data) {
  if (data.customStyles) {
    customStyles = data.customStyles;
    localStorage.setItem('customStyles', JSON.stringify(customStyles));
    applyCustomStyles(customStyles);
    selectCustomTheme();
    showNotification('테마를 불러왔습니다');
  }
}

function handleThemeImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    if (e.target.files.length > 0) importTheme(e.target.files[0]);
  };
  input.click();
}

// ========== Saved Themes ==========
function saveCurrentTheme() {
  const name = els.themeNameInput?.value?.trim();
  if (!name) {
    showNotification('테마 이름을 입력하세요');
    return;
  }
  const styles = getStylesFromEditor();
  const newTheme = {
    id: 'theme-' + Date.now(),
    name,
    styles: JSON.parse(JSON.stringify(styles)),
    createdAt: new Date().toISOString()
  };
  customThemes.push(newTheme);
  localStorage.setItem('customThemes', JSON.stringify(customThemes));
  updateColorThemeSelect();
  refreshSavedThemesList();
  els.themeNameInput.value = '';
  showNotification(`"${name}" 테마가 저장되었습니다!`);
}

function deleteSavedTheme(themeId) {
  const theme = customThemes.find(t => t.id === themeId);
  if (!theme) return;
  customThemes = customThemes.filter(t => t.id !== themeId);
  localStorage.setItem('customThemes', JSON.stringify(customThemes));
  if (currentColor === themeId) applyColorTheme('default');
  updateColorThemeSelect();
  refreshSavedThemesList();
  showNotification(`"${theme.name}" 테마가 삭제되었습니다`);
}

function loadSavedTheme(themeId) {
  const theme = customThemes.find(t => t.id === themeId);
  if (!theme) return;
  const styles = theme.styles;

  document.getElementById('custom-bg').value = styles.bg || '#ffffff';
  document.getElementById('custom-text').value = styles.text || '#1f2328';
  document.getElementById('custom-accent').value = styles.accent || '#656d76';
  document.getElementById('custom-border').value = styles.border || '#d0d7de';
  document.getElementById('custom-font-family').value = styles.fontFamily || 'system-ui';
  document.getElementById('custom-font-size').value = styles.fontSize || 16;
  document.getElementById('custom-line-height').value = styles.lineHeight || 1.7;
  document.getElementById('custom-code-bg').value = styles.codeBg || '#f6f8fa';
  document.getElementById('custom-code-text').value = styles.codeText || '#1f2328';
  document.getElementById('custom-code-font').value = styles.codeFont || "'SFMono-Regular', Consolas, monospace";
  document.getElementById('custom-blockquote-bg').value = styles.blockquoteBg || '#f6f8fa';
  document.getElementById('custom-blockquote-border').value = styles.blockquoteBorder || '#d0d7de';
  document.getElementById('custom-blockquote-border-width').value = styles.blockquoteBorderWidth || 4;
  document.getElementById('custom-table-header-bg').value = styles.tableHeaderBg || '#f6f8fa';
  document.getElementById('custom-table-header-text').value = styles.tableHeaderText || '#1f2328';
  document.getElementById('custom-table-radius').value = styles.tableRadius || 8;
  document.getElementById('custom-h1-color').value = styles.h1Color || '#24292f';
  document.getElementById('custom-h2-color').value = styles.h2Color || '#656d76';
  document.getElementById('custom-h1-gradient').checked = styles.h1Gradient !== false;
  document.getElementById('custom-link-color').value = styles.linkColor || '#656d76';
  document.getElementById('custom-bold-color').value = styles.boldColor || '#656d76';
  document.getElementById('custom-italic-color').value = styles.italicColor || '#57606a';
  document.getElementById('custom-mark-bg').value = styles.markBg || '#fff8c5';
  document.getElementById('custom-mark-text').value = styles.markText || '#656d76';
  document.getElementById('custom-list-marker').value = styles.listMarker || '#656d76';
  document.getElementById('custom-toolbar-bg').value = styles.toolbarBg || '#f6f8fa';
  document.getElementById('custom-toolbar-bg2').value = styles.toolbarBg2 || '#f6f8fa';
  document.getElementById('custom-tabbar-bg').value = styles.tabbarBg || '#ffffff';
  els.customCssTextarea.value = styles.customCss || getDefaultCssTemplate();

  updateRangeDisplays();
  applyCustomStyles(styles);
  customStyles = styles;
  localStorage.setItem('customStyles', JSON.stringify(styles));
  selectCustomTheme();
  switchEditorTab('ui');
  showNotification(`"${theme.name}" 테마가 로드되었습니다!`);
}

function applySavedTheme(themeId) {
  const theme = customThemes.find(t => t.id === themeId);
  if (theme) {
    customStyles = theme.styles;
    localStorage.setItem('customStyles', JSON.stringify(customStyles));
    applyCustomStyles(customStyles);
    currentColor = themeId;
    localStorage.setItem('colorTheme', themeId);
    els.colorTheme.value = themeId;
    return true;
  }
  return false;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function refreshSavedThemesList() {
  if (!els.savedThemesList) return;
  const themes = customThemes;

  if (themes.length === 0) {
    els.savedThemesList.innerHTML = '<div class="saved-themes-empty">저장된 테마가 없습니다</div>';
    return;
  }

  els.savedThemesList.innerHTML = themes.map(theme => {
    const date = new Date(theme.createdAt).toLocaleDateString();
    return `
      <div class="saved-theme-item" data-theme-id="${theme.id}">
        <div class="saved-theme-info">
          <span class="saved-theme-name">${escapeHtml(theme.name)}</span>
          <span class="saved-theme-date">${date}</span>
        </div>
        <div class="saved-theme-actions">
          <button class="btn-icon load-theme-btn" title="불러오기" data-theme-id="${theme.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          </button>
          <button class="btn-icon delete-theme-btn" title="삭제" data-theme-id="${theme.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  els.savedThemesList.querySelectorAll('.load-theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadSavedTheme(btn.dataset.themeId);
    });
  });
  els.savedThemesList.querySelectorAll('.delete-theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSavedTheme(btn.dataset.themeId);
    });
  });
}

export function updateColorThemeSelect() {
  if (!els.colorTheme) return;
  const existingCustomOptions = els.colorTheme.querySelectorAll('option[data-custom-theme]');
  existingCustomOptions.forEach(opt => opt.remove());

  customThemes.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = `★ ${theme.name}`;
    option.setAttribute('data-custom-theme', 'true');
    if (els.customThemeOption) {
      els.colorTheme.insertBefore(option, els.customThemeOption);
    } else {
      els.colorTheme.appendChild(option);
    }
  });

  if (currentColor) els.colorTheme.value = currentColor;
}

export function initStyles() {
  applyTheme(currentTheme);
  applyFontFamily(currentFontFamily);
  applyFontSize(currentFontSize);

  if (customStyles && els.customThemeOption) {
    els.customThemeOption.hidden = false;
  }

  updateColorThemeSelect();
  refreshSavedThemesList();
  applyColorTheme(currentColor);
  applyContentWidth(currentContentWidth);
}
