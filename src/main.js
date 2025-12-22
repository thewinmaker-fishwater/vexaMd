/**
 * ChilBong MD Viewer - Ultra Lightweight Markdown Viewer
 * Main JavaScript Module
 */

import { marked } from 'marked';

// Tauri API (조건부 로드)
let tauriApi = null;
let dialogOpen = null;
let dialogSave = null;
let fsWriteTextFile = null;

async function initTauri() {
  try {
    tauriApi = await import('@tauri-apps/api/core');
    const dialogModule = await import('@tauri-apps/plugin-dialog');
    dialogOpen = dialogModule.open;
    dialogSave = dialogModule.save;

    // fs 플러그인
    const fsModule = await import('@tauri-apps/plugin-fs');
    fsWriteTextFile = fsModule.writeTextFile;
  } catch (e) {
    console.log('Running in browser mode', e);
  }
}

// ========== Marked 설정 ==========
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
});

// ========== DOM Elements ==========
const content = document.getElementById('content');
const btnHome = document.getElementById('btn-home');
const btnOpen = document.getElementById('btn-open');
const btnRecent = document.getElementById('btn-recent');
const btnTheme = document.getElementById('btn-theme');
const btnPrint = document.getElementById('btn-print');
const colorTheme = document.getElementById('color-theme');
const fontSize = document.getElementById('font-size');
const contentWidth = document.getElementById('content-width');
const importInput = document.getElementById('import-input');
const dropOverlay = document.getElementById('drop-overlay');
const iconDark = document.getElementById('icon-dark');
const iconLight = document.getElementById('icon-light');
const tabBar = document.getElementById('tab-bar');
const tabsContainer = document.getElementById('tabs-container');
const recentDropdown = document.getElementById('recent-dropdown');
const recentList = document.getElementById('recent-list');
const recentEmpty = document.getElementById('recent-empty');
const clearRecent = document.getElementById('clear-recent');
const homeRecentList = document.getElementById('home-recent-list');
const homeRecent = document.getElementById('home-recent');

// View mode and zoom elements
const btnViewSingle = document.getElementById('btn-view-single');
const btnViewDouble = document.getElementById('btn-view-double');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomReset = document.getElementById('btn-zoom-reset');
const zoomLevelDisplay = document.getElementById('zoom-level');

// Search elements
const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const searchCount = document.getElementById('search-count');
const searchPrev = document.getElementById('search-prev');
const searchNext = document.getElementById('search-next');
const searchClose = document.getElementById('search-close');
const btnSearch = document.getElementById('btn-search');

// Theme editor elements
const themeEditorModal = document.getElementById('theme-editor-modal');
const themeEditorClose = document.getElementById('theme-editor-close');
const editorTabs = document.querySelectorAll('.editor-tab');
const tabPanels = document.querySelectorAll('.tab-panel');
const customCssTextarea = document.getElementById('custom-css');
const themeReset = document.getElementById('theme-reset');
const themePreview = document.getElementById('theme-preview');
const themeImportBtn = document.getElementById('theme-import');
const themeExportBtn = document.getElementById('theme-export');
const themeCancel = document.getElementById('theme-cancel');
const themeApply = document.getElementById('theme-apply');
const btnCustomize = document.getElementById('btn-customize');

// ========== State ==========
let currentTheme = localStorage.getItem('theme') || 'light';
let currentColor = localStorage.getItem('colorTheme') || 'default';
let currentFontSize = localStorage.getItem('fontSize') || 'medium';
let currentViewMode = localStorage.getItem('viewMode') || 'single';
let currentZoom = parseInt(localStorage.getItem('zoom') || '100');
let currentContentWidth = localStorage.getItem('contentWidth') || 'narrow';

// Zoom levels
const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

// Search state
let searchMatches = [];
let currentMatchIndex = -1;
let originalContent = '';
let isSearchVisible = false;

// Custom theme state
let customStyles = JSON.parse(localStorage.getItem('customStyles') || 'null');
let customStyleElement = null;

// Custom theme option element
const customThemeOption = document.getElementById('custom-theme-option');

// 테마 에디터 열기 전 상태 저장
let editorOriginalState = null;

// Tabs state
const HOME_TAB_ID = 'home';
let tabs = [];
let activeTabId = null;

// Recent files state
const MAX_RECENT_FILES = 10;
let recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');

// Welcome HTML cache
const welcomeHTML = `
  <div class="welcome">
    <h1>ChilBong MD Viewer</h1>
    <p class="subtitle">초경량 마크다운 뷰어</p>
    <p>Markdown 파일을 열거나 이 영역에 드래그하세요.</p>
    <p><kbd>Ctrl</kbd>+<kbd>O</kbd> 열기 &nbsp; <kbd>Ctrl</kbd>+<kbd>D</kbd> 테마 &nbsp; <kbd>Ctrl</kbd>+<kbd>P</kbd> 인쇄 &nbsp; <kbd>Ctrl</kbd>+<kbd>F</kbd> 검색 &nbsp; <kbd>Esc</kbd> 홈</p>
    <div id="home-recent" class="home-recent">
      <h3>최근 파일</h3>
      <div id="home-recent-list"></div>
    </div>
  </div>
`;

// ========== Theme ==========
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('theme', theme);

  if (theme === 'dark') {
    iconDark.style.display = 'none';
    iconLight.style.display = 'block';
  } else {
    iconDark.style.display = 'block';
    iconLight.style.display = 'none';
  }
}

function applyColorTheme(color) {
  // 커스텀이 아닌 모든 테마는 커스텀 스타일 비활성화
  if (color !== 'custom') {
    if (customStyleElement) {
      customStyleElement.remove();
      customStyleElement = null;
    }
  }

  if (color === 'default') {
    document.documentElement.removeAttribute('data-color');
  } else if (color === 'custom') {
    // 커스텀 선택 시 data-color 제거하고 커스텀 스타일 적용
    document.documentElement.removeAttribute('data-color');
    if (customStyles) {
      applyCustomStyles(customStyles);
    }
  } else {
    // 프리셋 테마 선택
    document.documentElement.setAttribute('data-color', color);
  }
  currentColor = color;
  localStorage.setItem('colorTheme', color);
  colorTheme.value = color;
}

function selectCustomTheme() {
  // 커스텀 옵션을 보이게 하고 선택
  if (customThemeOption) {
    customThemeOption.hidden = false;
    colorTheme.value = 'custom';
    currentColor = 'custom';
    localStorage.setItem('colorTheme', 'custom');
  }
}

function hideCustomThemeOption() {
  // 커스텀 옵션 숨기고 기본 테마로
  if (customThemeOption) {
    customThemeOption.hidden = true;
    colorTheme.value = 'default';
    currentColor = 'default';
    localStorage.setItem('colorTheme', 'default');
  }
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// ========== Font Size ==========
function applyFontSize(size) {
  document.documentElement.setAttribute('data-font-size', size);
  currentFontSize = size;
  localStorage.setItem('fontSize', size);
  fontSize.value = size;
}

// ========== Content Width ==========
function applyContentWidth(width) {
  document.documentElement.setAttribute('data-content-width', width);
  currentContentWidth = width;
  localStorage.setItem('contentWidth', width);
  contentWidth.value = width;
}

// ========== View Mode ==========
function setViewMode(mode) {
  currentViewMode = mode;
  localStorage.setItem('viewMode', mode);

  if (mode === 'single') {
    content.classList.remove('view-double');
    btnViewSingle.classList.add('active');
    btnViewDouble.classList.remove('active');
  } else {
    content.classList.add('view-double');
    btnViewSingle.classList.remove('active');
    btnViewDouble.classList.add('active');
  }
}

// ========== Zoom ==========
function setZoom(level) {
  // Clamp zoom level
  level = Math.max(ZOOM_LEVELS[0], Math.min(ZOOM_LEVELS[ZOOM_LEVELS.length - 1], level));

  // Find nearest zoom level
  let nearest = ZOOM_LEVELS.reduce((prev, curr) =>
    Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev
  );

  currentZoom = nearest;
  localStorage.setItem('zoom', nearest.toString());
  content.setAttribute('data-zoom', nearest.toString());
  zoomLevelDisplay.textContent = `${nearest}%`;
}

function zoomIn() {
  const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
  if (currentIndex < ZOOM_LEVELS.length - 1) {
    setZoom(ZOOM_LEVELS[currentIndex + 1]);
  }
}

function zoomOut() {
  const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
  if (currentIndex > 0) {
    setZoom(ZOOM_LEVELS[currentIndex - 1]);
  }
}

function zoomReset() {
  setZoom(100);
}

// ========== Search ==========
function performSearch(query) {
  clearSearchHighlights();

  if (!query || query.trim() === '' || activeTabId === HOME_TAB_ID) {
    searchCount.textContent = '';
    searchMatches = [];
    currentMatchIndex = -1;
    return;
  }

  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  // Store original content if not already stored
  if (!originalContent) {
    originalContent = contentEl.innerHTML;
  }

  // Find all text nodes and search
  const walker = document.createTreeWalker(
    contentEl,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim()) {
      textNodes.push(node);
    }
  }

  searchMatches = [];
  const searchLower = query.toLowerCase();

  textNodes.forEach(textNode => {
    const text = textNode.textContent;
    const textLower = text.toLowerCase();
    let index = 0;

    while ((index = textLower.indexOf(searchLower, index)) !== -1) {
      searchMatches.push({
        node: textNode,
        index: index,
        length: query.length
      });
      index += query.length;
    }
  });

  if (searchMatches.length > 0) {
    highlightMatches(query);
    currentMatchIndex = 0;
    scrollToMatch(currentMatchIndex);
    updateSearchCount();
  } else {
    searchCount.textContent = '0개';
    currentMatchIndex = -1;
  }
}

function highlightMatches(query) {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  // Use regex to highlight all matches
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (regex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        node.parentNode.replaceChild(span, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE &&
               !['SCRIPT', 'STYLE', 'MARK'].includes(node.tagName)) {
      Array.from(node.childNodes).forEach(walk);
    }
  };

  walk(contentEl);

  // Update searchMatches to point to the new mark elements
  searchMatches = Array.from(contentEl.querySelectorAll('.search-highlight'));
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearSearchHighlights() {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  // Remove all highlight marks
  const marks = contentEl.querySelectorAll('.search-highlight');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  // Clean up empty spans
  const spans = contentEl.querySelectorAll('span:empty');
  spans.forEach(span => span.remove());

  searchMatches = [];
  currentMatchIndex = -1;
}

function scrollToMatch(index) {
  if (index < 0 || index >= searchMatches.length) return;

  // Remove current class from all
  searchMatches.forEach(el => {
    if (el.classList) el.classList.remove('current');
  });

  // Add current class to active match
  const currentMatch = searchMatches[index];
  if (currentMatch && currentMatch.classList) {
    currentMatch.classList.add('current');
    currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  updateSearchCount();
}

function updateSearchCount() {
  if (searchMatches.length === 0) {
    searchCount.textContent = '0개';
  } else {
    searchCount.textContent = `${currentMatchIndex + 1}/${searchMatches.length}`;
  }
}

function searchPrevMatch() {
  if (searchMatches.length === 0) return;
  currentMatchIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
  scrollToMatch(currentMatchIndex);
}

function searchNextMatch() {
  if (searchMatches.length === 0) return;
  currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
  scrollToMatch(currentMatchIndex);
}

function clearSearch() {
  searchInput.value = '';
  clearSearchHighlights();
  searchCount.textContent = '';
  originalContent = '';
}

function showSearchBar() {
  isSearchVisible = true;
  searchBar.classList.remove('hidden');
  updateSearchBarPosition();
  searchInput.focus();
  searchInput.select();
}

function hideSearchBar() {
  isSearchVisible = false;
  searchBar.classList.add('hidden');
  clearSearch();
}

function toggleSearchBar() {
  if (isSearchVisible) {
    hideSearchBar();
  } else {
    showSearchBar();
  }
}

function updateSearchBarPosition() {
  // 탭이 없으면 toolbar 바로 아래에 위치
  if (tabs.length === 0) {
    searchBar.classList.add('no-tabs');
  } else {
    searchBar.classList.remove('no-tabs');
  }
}

// ========== Theme Editor ==========
function openThemeEditor() {
  // 현재 상태 저장 (취소 시 복원용)
  editorOriginalState = {
    colorTheme: currentColor,
    customStyles: customStyles ? JSON.parse(JSON.stringify(customStyles)) : null,
    hasCustomStyleElement: !!customStyleElement
  };

  themeEditorModal.classList.remove('hidden');
  loadCurrentStylesToEditor();
}

function closeThemeEditor() {
  themeEditorModal.classList.add('hidden');
}

function cancelThemeEditor() {
  // 미리보기로 적용된 스타일 제거
  if (customStyleElement) {
    customStyleElement.remove();
    customStyleElement = null;
  }

  // 원래 상태로 복원
  if (editorOriginalState) {
    // 원래 커스텀 스타일이 있었으면 복원
    if (editorOriginalState.customStyles) {
      customStyles = editorOriginalState.customStyles;
      if (editorOriginalState.colorTheme === 'custom') {
        applyCustomStyles(customStyles);
      }
    }

    // 원래 테마로 복원
    applyColorTheme(editorOriginalState.colorTheme);
    editorOriginalState = null;
  }

  closeThemeEditor();
}

function switchEditorTab(tabName) {
  editorTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
}

function getDefaultStyles() {
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

function rgbToHex(rgb) {
  // rgb(r, g, b) 형식을 #rrggbb로 변환
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
  // 현재 적용된 CSS 변수 값들을 읽어옴
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
  // 현재 테마 색상 읽기
  const currentThemeColors = getCurrentThemeColors();
  const defaults = getDefaultStyles();

  // "커스텀" 테마가 선택된 경우에만 customStyles 사용, 아니면 현재 테마 색상 사용
  const useCustom = currentColor === 'custom' && customStyles;
  const styles = useCustom ? customStyles : defaults;

  // 기본 색상
  document.getElementById('custom-bg').value = useCustom ? customStyles.bg : currentThemeColors.bg || '#ffffff';
  document.getElementById('custom-text').value = useCustom ? customStyles.text : currentThemeColors.text || '#1f2328';
  document.getElementById('custom-accent').value = useCustom ? customStyles.accent : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-border').value = useCustom ? customStyles.border : currentThemeColors.border || '#d0d7de';

  // 글꼴
  document.getElementById('custom-font-family').value = styles.fontFamily || 'system-ui';
  document.getElementById('custom-font-size').value = styles.fontSize || 16;
  document.getElementById('custom-line-height').value = styles.lineHeight || 1.7;

  // 코드 블록
  document.getElementById('custom-code-bg').value = useCustom ? customStyles.codeBg : currentThemeColors.codeBg || '#f6f8fa';
  document.getElementById('custom-code-text').value = useCustom ? customStyles.codeText : currentThemeColors.codeText || '#1f2328';
  document.getElementById('custom-code-font').value = styles.codeFont || "'SFMono-Regular', Consolas, monospace";

  // 인용문
  document.getElementById('custom-blockquote-bg').value = useCustom ? customStyles.blockquoteBg : currentThemeColors.blockquoteBg || '#f6f8fa';
  document.getElementById('custom-blockquote-border').value = useCustom ? customStyles.blockquoteBorder : currentThemeColors.blockquoteBorder || '#d0d7de';
  document.getElementById('custom-blockquote-border-width').value = styles.blockquoteBorderWidth || 4;

  // 테이블
  document.getElementById('custom-table-header-bg').value = useCustom ? customStyles.tableHeaderBg : currentThemeColors.tableHeaderBg || '#f6f8fa';
  document.getElementById('custom-table-header-text').value = useCustom ? customStyles.tableHeaderText : currentThemeColors.tableHeaderText || '#1f2328';
  document.getElementById('custom-table-radius').value = styles.tableRadius || 8;

  // 제목
  document.getElementById('custom-h1-color').value = useCustom ? customStyles.h1Color : currentThemeColors.h1Color || '#24292f';
  document.getElementById('custom-h2-color').value = useCustom ? customStyles.h2Color : currentThemeColors.h2Color || '#656d76';
  document.getElementById('custom-h1-gradient').checked = styles.h1Gradient !== false;

  // 텍스트 마크
  document.getElementById('custom-link-color').value = useCustom ? customStyles.linkColor : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-bold-color').value = useCustom ? customStyles.boldColor : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-italic-color').value = useCustom ? customStyles.italicColor : currentThemeColors.textSecondary || '#57606a';
  document.getElementById('custom-mark-bg').value = useCustom ? customStyles.markBg : currentThemeColors.accentLight || '#fff8c5';
  document.getElementById('custom-mark-text').value = useCustom ? customStyles.markText : currentThemeColors.accent || '#656d76';
  document.getElementById('custom-list-marker').value = useCustom ? customStyles.listMarker : currentThemeColors.accent || '#656d76';

  // 툴바
  document.getElementById('custom-toolbar-bg').value = useCustom ? customStyles.toolbarBg : currentThemeColors.bg || '#f6f8fa';
  document.getElementById('custom-toolbar-bg2').value = useCustom ? customStyles.toolbarBg2 : currentThemeColors.bg || '#f6f8fa';
  document.getElementById('custom-tabbar-bg').value = useCustom ? customStyles.tabbarBg : currentThemeColors.bg || '#ffffff';

  // CSS
  customCssTextarea.value = styles.customCss || '';

  // Range 값 표시 업데이트
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
    customCss: customCssTextarea.value
  };
}

function generateCustomCss(styles) {
  let css = `
/* ChilBong MD Viewer - Custom Theme */
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

/* 텍스트 마크 스타일 */
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

/* 툴바 스타일 */
#toolbar {
  background: linear-gradient(135deg, ${styles.toolbarBg} 0%, ${styles.toolbarBg2} 100%) !important;
}

#tab-bar {
  background: ${styles.tabbarBg} !important;
}
`;

  // 사용자 커스텀 CSS 추가
  if (styles.customCss && styles.customCss.trim()) {
    css += `\n/* User Custom CSS */\n${styles.customCss}`;
  }

  return css;
}

function applyCustomStyles(styles) {
  // 기존 커스텀 스타일 제거
  if (customStyleElement) {
    customStyleElement.remove();
  }

  // 새 스타일 적용
  customStyleElement = document.createElement('style');
  customStyleElement.id = 'custom-theme-styles';
  customStyleElement.textContent = generateCustomCss(styles);
  document.head.appendChild(customStyleElement);
}

function previewTheme() {
  const styles = getStylesFromEditor();
  applyCustomStyles(styles);
  showNotification('미리보기 적용됨');
}

function applyAndSaveTheme() {
  const styles = getStylesFromEditor();
  customStyles = styles;
  localStorage.setItem('customStyles', JSON.stringify(styles));
  applyCustomStyles(styles);
  selectCustomTheme();
  closeThemeEditor();
  showNotification('테마가 적용되었습니다!');
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

async function exportTheme() {
  const styles = getStylesFromEditor();
  const themeData = {
    version: '2.0',
    app: 'ChilBong MD Viewer',
    exportedAt: new Date().toISOString(),
    baseTheme: currentTheme,
    colorTheme: currentColor,
    customStyles: styles,
    generatedCss: generateCustomCss(styles)
  };

  const jsonContent = JSON.stringify(themeData, null, 2);
  const defaultFileName = `chilbong-custom-theme-${Date.now()}.json`;

  if (dialogSave && tauriApi) {
    try {
      const filePath = await dialogSave({
        defaultPath: defaultFileName,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (filePath) {
        console.log('Saving to:', filePath);
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

function importTheme(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.version === '2.0' && data.customStyles) {
        // 새 형식 (커스텀 스타일 포함)
        customStyles = data.customStyles;
        localStorage.setItem('customStyles', JSON.stringify(customStyles));
        applyCustomStyles(customStyles);
        selectCustomTheme();
        loadCurrentStylesToEditor();
        showNotification('커스텀 테마를 불러왔습니다!');
      } else if (data.theme || data.colorTheme) {
        // 구 형식 (기본 테마만)
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

function handleThemeImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    if (e.target.files.length > 0) {
      importTheme(e.target.files[0]);
    }
  };
  input.click();
}

function showNotification(message) {
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
}

// ========== Print ==========
function printDocument() {
  if (tabs.length === 0) {
    showNotification('인쇄할 문서가 없습니다.');
    return;
  }
  window.print();
}

// ========== Tabs Management ==========
function generateTabId() {
  return 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function createTab(name, filePath, content) {
  const tabId = generateTabId();
  const tab = {
    id: tabId,
    name: name,
    filePath: filePath,
    content: content
  };
  tabs.push(tab);
  renderTabs();
  switchToTab(tabId);
  updateTabBarVisibility();
  return tabId;
}

function switchToTab(tabId) {
  // Hide search bar when switching tabs
  if (isSearchVisible) {
    hideSearchBar();
  }

  if (tabId === HOME_TAB_ID) {
    activeTabId = HOME_TAB_ID;
    content.innerHTML = welcomeHTML;
    content.classList.remove('view-double'); // 홈은 항상 한 페이지
    renderHomeRecentFiles();
    renderTabs();
    return;
  }

  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  activeTabId = tabId;
  renderMarkdown(tab.content, false);
  // 파일 탭에서는 저장된 뷰 모드 적용
  if (currentViewMode === 'double') {
    content.classList.add('view-double');
  }
  renderTabs();
}

function closeTab(tabId, event) {
  if (event) {
    event.stopPropagation();
  }

  // Cannot close home tab
  if (tabId === HOME_TAB_ID) return;

  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;

  tabs.splice(tabIndex, 1);

  if (activeTabId === tabId) {
    if (tabs.length === 0) {
      // No more file tabs, go to home
      switchToTab(HOME_TAB_ID);
    } else {
      // Switch to adjacent tab
      const newIndex = Math.min(tabIndex, tabs.length - 1);
      switchToTab(tabs[newIndex].id);
    }
  }

  renderTabs();
  updateTabBarVisibility();
}

function renderTabs() {
  tabsContainer.innerHTML = '';

  // Home tab first
  const homeTabEl = document.createElement('div');
  homeTabEl.className = `tab ${activeTabId === HOME_TAB_ID ? 'active' : ''}`;
  homeTabEl.innerHTML = `
    <svg class="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
    <span class="tab-title">홈</span>
  `;
  homeTabEl.addEventListener('click', () => switchToTab(HOME_TAB_ID));
  tabsContainer.appendChild(homeTabEl);

  // File tabs
  tabs.forEach(tab => {
    const tabEl = document.createElement('div');
    tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
    tabEl.innerHTML = `
      <span class="tab-title" title="${tab.filePath || tab.name}">${tab.name}</span>
      <button class="tab-close" title="닫기">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    tabEl.querySelector('.tab-title').addEventListener('click', () => switchToTab(tab.id));
    tabEl.querySelector('.tab-close').addEventListener('click', (e) => closeTab(tab.id, e));

    tabsContainer.appendChild(tabEl);
  });
}

function updateTabBarVisibility() {
  // Tab bar is always visible (home tab is always there)
  tabBar.classList.remove('hidden');
  content.classList.remove('no-tabs');
}

// ========== Recent Files ==========
function addToRecentFiles(name, filePath) {
  // Remove if already exists
  recentFiles = recentFiles.filter(f => f.path !== filePath);

  // Add to beginning
  recentFiles.unshift({
    name: name,
    path: filePath,
    openedAt: Date.now()
  });

  // Keep only MAX_RECENT_FILES
  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  }

  localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
  renderRecentFiles();
  renderHomeRecentFiles();
}

function renderRecentFiles() {
  recentList.innerHTML = '';

  if (recentFiles.length === 0) {
    recentEmpty.style.display = 'block';
    clearRecent.style.display = 'none';
    return;
  }

  recentEmpty.style.display = 'none';
  clearRecent.style.display = 'block';

  recentFiles.forEach(file => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
      <div class="recent-item-content">
        <div class="recent-item-name">${file.name}</div>
        <div class="recent-item-path">${file.path}</div>
      </div>
      <button class="recent-item-remove" title="목록에서 제거">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    item.querySelector('.recent-item-content').addEventListener('click', () => {
      hideRecentDropdown();
      loadFile(file.path);
    });

    item.querySelector('.recent-item-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromRecentFiles(file.path);
    });

    recentList.appendChild(item);
  });
}

function renderHomeRecentFiles() {
  const homeList = document.getElementById('home-recent-list');
  const homeRecentSection = document.getElementById('home-recent');

  if (!homeList || !homeRecentSection) return;

  if (recentFiles.length === 0) {
    homeRecentSection.style.display = 'none';
    return;
  }

  homeRecentSection.style.display = 'block';
  homeList.innerHTML = '';

  // Show only first 5 items on home
  recentFiles.slice(0, 5).forEach(file => {
    const item = document.createElement('div');
    item.className = 'home-recent-item';
    item.innerHTML = `
      <svg class="home-recent-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <div class="home-recent-info">
        <div class="home-recent-name">${file.name}</div>
        <div class="home-recent-path">${file.path}</div>
      </div>
    `;
    item.addEventListener('click', () => loadFile(file.path));
    homeList.appendChild(item);
  });
}

function removeFromRecentFiles(filePath) {
  recentFiles = recentFiles.filter(f => f.path !== filePath);
  localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
  renderRecentFiles();
  renderHomeRecentFiles();
}

function clearRecentFiles() {
  recentFiles = [];
  localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
  renderRecentFiles();
  renderHomeRecentFiles();
  hideRecentDropdown();
}

function toggleRecentDropdown() {
  if (recentDropdown.classList.contains('hidden')) {
    showRecentDropdown();
  } else {
    hideRecentDropdown();
  }
}

function showRecentDropdown() {
  renderRecentFiles();
  recentDropdown.classList.remove('hidden');

  // Position dropdown below button
  const btnRect = btnRecent.getBoundingClientRect();
  recentDropdown.style.top = (btnRect.bottom + 4) + 'px';
  recentDropdown.style.left = btnRect.left + 'px';
}

function hideRecentDropdown() {
  recentDropdown.classList.add('hidden');
}

// ========== Home ==========
function showHome() {
  switchToTab(HOME_TAB_ID);
}

// ========== Markdown Rendering ==========
function renderMarkdown(text, isNewFile = true) {
  const startTime = performance.now();

  try {
    const html = marked.parse(text);
    content.innerHTML = html;
    content.classList.add('markdown-body');

    const elapsed = (performance.now() - startTime).toFixed(1);
    console.log(`Rendered in ${elapsed}ms`);
  } catch (error) {
    showError('Markdown 파싱 오류', error.message);
  }
}

// ========== File Handling ==========
async function openFile() {
  if (dialogOpen) {
    // Tauri 환경
    const selected = await dialogOpen({
      multiple: false,
      filters: [{
        name: 'Markdown',
        extensions: ['md', 'markdown', 'txt']
      }]
    });

    if (selected) {
      await loadFile(selected);
    }
  } else {
    // 브라우저 환경 (개발용)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        // Browser mode: create tab with file content
        createTab(file.name, file.name, text);
        addToRecentFiles(file.name, file.name);
      }
    };
    input.click();
  }
}

async function loadFile(filePath) {
  try {
    if (tauriApi) {
      const text = await tauriApi.invoke('read_file', { path: filePath });
      const name = filePath.split(/[/\\]/).pop();

      // Check if file is already open
      const existingTab = tabs.find(t => t.filePath === filePath);
      if (existingTab) {
        switchToTab(existingTab.id);
        return;
      }

      createTab(name, filePath, text);
      addToRecentFiles(name, filePath);
    }
  } catch (error) {
    showError('파일 읽기 실패', error.toString());
    // Remove from recent files if it failed to load
    removeFromRecentFiles(filePath);
  }
}

// ========== CLI 인자 처리 ==========
async function handleCliArgs() {
  if (tauriApi) {
    try {
      const args = await tauriApi.invoke('get_cli_args');
      if (args && args.length > 0) {
        await loadFile(args[0]);
      }
    } catch (e) {
      console.log('No CLI args');
    }
  }
}

// ========== Drag & Drop ==========
function setupDragDrop() {
  let dragCounter = 0;

  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropOverlay.classList.add('active');
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropOverlay.classList.remove('active');
    }
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.remove('active');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      if (file.name.match(/\.(md|markdown|txt)$/i)) {
        const text = await file.text();
        createTab(file.name, file.name, text);
        addToRecentFiles(file.name, file.name);
      } else if (file.name.endsWith('.json')) {
        // 테마 파일 드롭
        importTheme(file);
      } else {
        showError('지원하지 않는 형식', 'Markdown 파일(.md, .markdown, .txt) 또는 테마 파일(.json)만 지원합니다.');
      }
    }
  });
}

// ========== Keyboard Shortcuts ==========
function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+O: Open file
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      openFile();
    }
    // Ctrl+D: Toggle dark/light theme
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      toggleTheme();
    }
    // Ctrl+E: Export theme
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      exportTheme();
    }
    // Ctrl+P: Print
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      printDocument();
    }
    // Ctrl++: Zoom in
    if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      zoomIn();
    }
    // Ctrl+-: Zoom out
    if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      zoomOut();
    }
    // Ctrl+0: Reset zoom
    if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      zoomReset();
    }
    // Ctrl+F: Toggle search bar
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      toggleSearchBar();
    }
    // Ctrl+W: Close current tab
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
    }
    // Escape: Hide search bar first, then go home
    if (e.key === 'Escape') {
      e.preventDefault();
      hideRecentDropdown();
      if (isSearchVisible) {
        hideSearchBar();
      } else {
        showHome();
      }
    }
    // Ctrl+Tab: Next tab (including home)
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      const allTabs = [HOME_TAB_ID, ...tabs.map(t => t.id)];
      const currentIndex = allTabs.indexOf(activeTabId);
      const nextIndex = (currentIndex + 1) % allTabs.length;
      switchToTab(allTabs[nextIndex]);
    }
  });

  // Mouse wheel zoom (Ctrl + scroll)
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }, { passive: false });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!recentDropdown.contains(e.target) && !btnRecent.contains(e.target)) {
      hideRecentDropdown();
    }
  });
}

// ========== Error Display ==========
function showError(title, message) {
  content.innerHTML = `
    <div class="welcome" style="color: var(--accent);">
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `;
}

// ========== Tauri Events ==========
async function setupTauriEvents() {
  if (tauriApi) {
    try {
      const { listen } = await import('@tauri-apps/api/event');

      // 파일 드롭 이벤트 (Tauri 네이티브)
      await listen('tauri://file-drop', async (event) => {
        const files = event.payload;
        if (files && files.length > 0) {
          const filePath = files[0];
          if (filePath.match(/\.(md|markdown|txt)$/i)) {
            await loadFile(filePath);
          }
        }
      });
    } catch (e) {
      console.log('Tauri events not available');
    }
  }
}

// ========== Initialize ==========
async function init() {
  await initTauri();

  // Apply saved themes
  applyTheme(currentTheme);
  applyFontSize(currentFontSize);

  // 커스텀 테마가 저장되어 있으면 먼저 옵션을 보이게
  if (customStyles && customThemeOption) {
    customThemeOption.hidden = false;
  }
  applyColorTheme(currentColor);

  setupDragDrop();
  setupKeyboard();
  await setupTauriEvents();

  // Initial state - start with home tab
  activeTabId = HOME_TAB_ID;
  updateTabBarVisibility();
  renderTabs();
  renderHomeRecentFiles();

  // Apply saved view mode, zoom, and content width
  setViewMode(currentViewMode);
  setZoom(currentZoom);
  applyContentWidth(currentContentWidth);

  // Event listeners
  btnHome.addEventListener('click', showHome);
  btnOpen.addEventListener('click', openFile);
  btnRecent.addEventListener('click', toggleRecentDropdown);
  btnTheme.addEventListener('click', toggleTheme);
  btnCustomize.addEventListener('click', openThemeEditor);

  if (btnPrint) {
    btnPrint.addEventListener('click', printDocument);
  }

  // View mode buttons
  btnViewSingle.addEventListener('click', () => setViewMode('single'));
  btnViewDouble.addEventListener('click', () => setViewMode('double'));

  // Zoom buttons
  btnZoomIn.addEventListener('click', zoomIn);
  btnZoomOut.addEventListener('click', zoomOut);
  btnZoomReset.addEventListener('click', zoomReset);

  // Search event listeners
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value);
    }, 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        searchPrevMatch();
      } else {
        searchNextMatch();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      hideSearchBar();
    }
  });

  searchPrev.addEventListener('click', searchPrevMatch);
  searchNext.addEventListener('click', searchNextMatch);
  searchClose.addEventListener('click', hideSearchBar);
  btnSearch.addEventListener('click', toggleSearchBar);

  clearRecent.addEventListener('click', clearRecentFiles);

  colorTheme.addEventListener('change', (e) => {
    applyColorTheme(e.target.value);
  });

  fontSize.addEventListener('change', (e) => {
    applyFontSize(e.target.value);
  });

  contentWidth.addEventListener('change', (e) => {
    applyContentWidth(e.target.value);
  });

  importInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      importTheme(e.target.files[0]);
      e.target.value = ''; // Reset for same file selection
    }
  });

  // Theme editor event listeners
  themeEditorClose.addEventListener('click', closeThemeEditor);
  themeEditorModal.querySelector('.modal-backdrop').addEventListener('click', closeThemeEditor);

  editorTabs.forEach(tab => {
    tab.addEventListener('click', () => switchEditorTab(tab.dataset.tab));
  });

  // Range inputs - update display value
  document.querySelectorAll('.editor-field input[type="range"]').forEach(range => {
    range.addEventListener('input', updateRangeDisplays);
  });

  themeReset.addEventListener('click', resetTheme);
  themePreview.addEventListener('click', previewTheme);
  themeImportBtn.addEventListener('click', handleThemeImport);
  themeExportBtn.addEventListener('click', exportTheme);
  themeCancel.addEventListener('click', cancelThemeEditor);
  themeApply.addEventListener('click', applyAndSaveTheme);

  // CLI 인자로 파일이 전달된 경우 로드
  await handleCliArgs();
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Start
init();
