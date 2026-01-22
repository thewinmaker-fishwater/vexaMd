/**
 * Vexa MD - Ultra Lightweight Markdown Viewer
 * Seven Peaks Software
 * Main JavaScript Module
 */

import { marked } from 'marked';
import { i18n } from './i18n.js';
import { generateToc, clearToc, toggleToc, updateTocTexts, getTocVisible, setTocVisible, hideToc } from './modules/toc/toc.js';

// Tauri API (조건부 로드)
let tauriApi = null;
let dialogOpen = null;
let dialogSave = null;
let fsWriteTextFile = null;
let fsWatchImmediate = null;

// File watchers map (filePath -> { unwatch: Function, tabIds: Set })
const fileWatchers = new Map();
// Debounce map for file change events
const fileChangeDebounce = new Map();

async function initTauri() {
  try {
    // 모든 모듈을 병렬로 로드하여 초기화 시간 단축
    const [coreModule, dialogModule, fsModule] = await Promise.all([
      import('@tauri-apps/api/core'),
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs')
    ]);

    tauriApi = coreModule;
    dialogOpen = dialogModule.open;
    dialogSave = dialogModule.save;
    fsWriteTextFile = fsModule.writeTextFile;
    fsWatchImmediate = fsModule.watchImmediate;
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
const fontFamily = document.getElementById('font-family');
const fontSize = document.getElementById('font-size');
const contentWidth = document.getElementById('content-width');
const languageSelect = document.getElementById('language');
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
const btnViewPaging = document.getElementById('btn-view-paging');
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

// Presentation elements
const btnPresentation = document.getElementById('btn-presentation');
const presentationOverlay = document.getElementById('presentation-overlay');
const presentationContent = document.querySelector('.presentation-content');
const presIndicator = document.getElementById('pres-indicator');
const presPrev = document.getElementById('pres-prev');
const presNext = document.getElementById('pres-next');
const presExit = document.getElementById('pres-exit');

// Help menu elements
const btnHelp = document.getElementById('btn-help');
const helpDropdown = document.getElementById('help-dropdown');
const helpShortcuts = document.getElementById('help-shortcuts');
const helpAbout = document.getElementById('help-about');
const aboutModal = document.getElementById('about-modal');
const aboutClose = document.getElementById('about-close');
const aboutOk = document.getElementById('about-ok');
const shortcutsModal = document.getElementById('shortcuts-modal');
const shortcutsClose = document.getElementById('shortcuts-close');
const shortcutsOk = document.getElementById('shortcuts-ok');

// Image modal elements
const imageModal = document.getElementById('image-modal');
const imageModalImg = document.getElementById('image-modal-img');
const imageZoomInfo = document.getElementById('image-zoom-info');
const imageZoomIn = document.getElementById('image-zoom-in');
const imageZoomOut = document.getElementById('image-zoom-out');
const imageZoomReset = document.getElementById('image-zoom-reset');
const imageModalClose = document.getElementById('image-modal-close');
const imageModalBackdrop = imageModal?.querySelector('.image-modal-backdrop');
const imageModalContent = imageModal?.querySelector('.image-modal-content');

// ========== State ==========
let currentTheme = localStorage.getItem('theme') || 'light';
let currentColor = localStorage.getItem('colorTheme') || 'default';
let currentFontFamily = localStorage.getItem('fontFamily') || 'system';
let currentFontSize = localStorage.getItem('fontSize') || 'medium';
let currentLanguage = localStorage.getItem('language') || 'ko';
let currentViewMode = localStorage.getItem('viewMode') || 'single';
let currentZoom = parseInt(localStorage.getItem('zoom') || '100');

// Pan state (for dragging content when zoomed in)
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panScrollLeft = 0;
let panScrollTop = 0;
let currentContentWidth = localStorage.getItem('contentWidth') || 'narrow';

// Image modal state
let imageModalZoom = 1;
const imageModalMinZoom = 0.5;
const imageModalMaxZoom = 3;
let isImageDragging = false;
let imageStartX = 0;
let imageStartY = 0;
let imageTranslateX = 0;
let imageTranslateY = 0;

// Zoom levels
const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

// Search state
let searchMatches = [];
let currentMatchIndex = -1;
let originalContent = '';
let isSearchVisible = false;

// Paging state
let pages = [];
let currentPage = 0;

// Presentation state
let isPresentationMode = false;
let presentationPage = 0;

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

// Welcome HTML cache (will be updated by i18n)
function getWelcomeHTML() {
  const t = i18n[currentLanguage];
  return `
  <div class="welcome">
    <div class="welcome-logo">
      <img src="/logo.png" alt="Vexa MD" width="120">
    </div>
    <h1>Vexa MD</h1>
    <p class="subtitle">${t.welcomeSubtitle}</p>
    <p>${t.welcomeInstruction}</p>
    <p><kbd>Ctrl</kbd>+<kbd>O</kbd> 열기 &nbsp; <kbd>Ctrl</kbd>+<kbd>D</kbd> 테마 &nbsp; <kbd>Ctrl</kbd>+<kbd>P</kbd> 인쇄 &nbsp; <kbd>Ctrl</kbd>+<kbd>F</kbd> 검색 &nbsp; <kbd>Esc</kbd> 홈</p>
    <div id="home-recent" class="home-recent">
      <h3>${t.recentFiles}</h3>
      <div id="home-recent-list"></div>
    </div>
  </div>
`;
}

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

// ========== Font Family ==========
function applyFontFamily(family) {
  document.documentElement.setAttribute('data-font-family', family);
  currentFontFamily = family;
  localStorage.setItem('fontFamily', family);
  fontFamily.value = family;
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

// ========== Language ==========
function applyLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  languageSelect.value = lang;
  updateUITexts();
}

function t(key) {
  return i18n[currentLanguage][key] || key;
}

function updateUITexts() {
  const lang = i18n[currentLanguage];

  // Toolbar buttons
  btnHome.title = lang.homeTooltip;
  btnOpen.title = lang.openFile;
  btnRecent.title = lang.recentFiles;
  btnTheme.title = lang.toggleTheme;
  btnCustomize.title = lang.themeCustomizer;
  if (btnPrint) btnPrint.title = lang.print;
  btnSearch.title = lang.search;
  btnViewSingle.title = lang.viewSingle;
  btnViewDouble.title = lang.viewDouble;
  btnViewPaging.title = lang.viewPaging;
  btnZoomIn.title = lang.zoomIn;
  btnZoomOut.title = lang.zoomOut;
  btnZoomReset.title = lang.zoomReset;
  btnPresentation.title = lang.presentation;
  btnHelp.title = lang.help;

  // Zoom level tooltip
  zoomLevelDisplay.title = lang.zoomRatio;

  // Search bar
  searchInput.placeholder = lang.searchPlaceholder;
  searchPrev.title = lang.searchPrev;
  searchNext.title = lang.searchNext;
  searchClose.title = lang.searchClose;

  // Recent dropdown
  document.getElementById('recent-empty').textContent = lang.recentEmpty;
  document.getElementById('clear-recent').textContent = lang.clearList;
  document.querySelector('.dropdown-header').textContent = lang.recentFiles;

  // Drop overlay
  document.querySelector('.drop-message').textContent = lang.dropMessage;

  // Color theme select
  const colorThemeSelect = document.getElementById('color-theme');
  colorThemeSelect.title = lang.colorTheme;
  colorThemeSelect.querySelector('[value="default"]').textContent = lang.themeDefault;
  colorThemeSelect.querySelector('[value="purple"]').textContent = lang.themePurple;
  colorThemeSelect.querySelector('[value="ocean"]').textContent = lang.themeOcean;
  colorThemeSelect.querySelector('[value="sunset"]').textContent = lang.themeSunset;
  colorThemeSelect.querySelector('[value="forest"]').textContent = lang.themeForest;
  colorThemeSelect.querySelector('[value="rose"]').textContent = lang.themeRose;
  colorThemeSelect.querySelector('[value="custom"]').textContent = lang.themeCustom;

  // Font family select
  const fontFamilySelect = document.getElementById('font-family');
  fontFamilySelect.title = lang.fontFamily;
  fontFamilySelect.querySelector('[value="system"]').textContent = lang.fontSystem;
  fontFamilySelect.querySelector('[value="malgun"]').textContent = lang.fontMalgun;
  fontFamilySelect.querySelector('[value="nanum"]').textContent = lang.fontNanum;
  fontFamilySelect.querySelector('[value="pretendard"]').textContent = lang.fontPretendard;
  fontFamilySelect.querySelector('[value="noto"]').textContent = lang.fontNoto;

  // Font size select
  const fontSizeSelect = document.getElementById('font-size');
  fontSizeSelect.title = lang.fontSize;
  fontSizeSelect.querySelector('[value="small"]').textContent = lang.fontSmall;
  fontSizeSelect.querySelector('[value="medium"]').textContent = lang.fontMedium;
  fontSizeSelect.querySelector('[value="large"]').textContent = lang.fontLarge;
  fontSizeSelect.querySelector('[value="xlarge"]').textContent = lang.fontXlarge;

  // Content width select
  const contentWidthSelect = document.getElementById('content-width');
  contentWidthSelect.title = lang.contentWidth;
  contentWidthSelect.querySelector('[value="narrow"]').textContent = lang.widthNarrow;
  contentWidthSelect.querySelector('[value="medium"]').textContent = lang.widthMedium;
  contentWidthSelect.querySelector('[value="wide"]').textContent = lang.widthWide;
  contentWidthSelect.querySelector('[value="full"]').textContent = lang.widthFull;

  // Language select
  languageSelect.title = lang.language;

  // Help menu
  document.querySelector('#help-shortcuts span').textContent = lang.shortcuts;
  document.querySelector('#help-about span').textContent = lang.about;

  // Presentation controls
  presPrev.title = lang.prevSlide;
  presNext.title = lang.nextSlide;
  presExit.title = lang.exitPresentation;

  // About modal
  document.querySelector('#about-modal .modal-header h2').textContent = lang.aboutTitle;
  document.querySelector('.about-version').textContent = `${lang.version} 1.0.0`;
  document.querySelector('.about-description').textContent = lang.welcomeSubtitle;
  const aboutInfoPs = document.querySelectorAll('.about-info p');
  if (aboutInfoPs.length >= 3) {
    aboutInfoPs[0].innerHTML = `<strong>${lang.developer}</strong>: Seven Peaks Software`;
    aboutInfoPs[1].innerHTML = `<strong>${lang.technology}</strong>: Tauri 2.x + Vanilla JavaScript`;
    aboutInfoPs[2].innerHTML = `<strong>${lang.license}</strong>: Apache 2.0`;
  }
  aboutOk.textContent = lang.confirm;

  // Shortcuts modal
  document.querySelector('#shortcuts-modal .modal-header h2').textContent = lang.shortcutsTitle;
  const shortcutSections = document.querySelectorAll('.shortcuts-section h4');
  if (shortcutSections.length >= 3) {
    shortcutSections[0].textContent = lang.shortcutFile;
    shortcutSections[1].textContent = lang.shortcutView;
    shortcutSections[2].textContent = lang.shortcutNav;
  }
  // Shortcut items
  const shortcutItems = document.querySelectorAll('.shortcut-item span');
  const shortcutTexts = [
    lang.scOpenFile, lang.scCloseTab, lang.scPrint, lang.scHome,
    lang.scToggleTheme, lang.scZoomIn, lang.scZoomOut, lang.scZoomReset,
    lang.scSearch, lang.scToc, lang.scPageNav, lang.scNextTab, lang.scPresentation
  ];
  shortcutItems.forEach((item, idx) => {
    if (shortcutTexts[idx]) item.textContent = shortcutTexts[idx];
  });
  shortcutsOk.textContent = lang.confirm;

  // Theme editor modal
  document.querySelector('#theme-editor-modal .modal-header h2').textContent = lang.themeEditorTitle;
  const editorTabs = document.querySelectorAll('.editor-tab');
  if (editorTabs.length >= 2) {
    editorTabs[0].textContent = lang.tabUIEditor;
    editorTabs[1].textContent = lang.tabCSSEditor;
  }

  // Theme editor sections
  const sectionTitles = document.querySelectorAll('.editor-section h3');
  const sectionTexts = [
    lang.sectionColors, lang.sectionFont, lang.sectionCode, lang.sectionBlockquote,
    lang.sectionTable, lang.sectionHeadings, lang.sectionTextMark, lang.sectionToolbar
  ];
  sectionTitles.forEach((title, idx) => {
    if (sectionTexts[idx]) title.textContent = sectionTexts[idx];
  });

  // Theme editor labels
  const labels = document.querySelectorAll('.editor-field label');
  const labelTexts = [
    lang.labelBgColor, lang.labelTextColor, lang.labelAccentColor, lang.labelBorderColor,
    lang.labelBodyFont, lang.labelBaseFontSize, lang.labelLineHeight,
    lang.labelBgColor, lang.labelTextColor, lang.labelCodeFont,
    lang.labelBgColor, lang.labelBorderColor, lang.labelBorderWidth,
    lang.labelHeaderBg, lang.labelHeaderText, lang.labelBorderRadius,
    lang.labelH1Color, lang.labelH2Color, lang.labelUseGradient,
    lang.labelLinkColor, lang.labelBoldColor, lang.labelItalicColor,
    lang.labelHighlightBg, lang.labelHighlightText, lang.labelListMarker,
    lang.labelToolbarBg, lang.labelToolbarGradient, lang.labelTabbarBg
  ];
  labels.forEach((label, idx) => {
    if (labelTexts[idx]) label.textContent = labelTexts[idx];
  });

  // Theme editor font selects
  const bodyFontSelect = document.getElementById('custom-font-family');
  if (bodyFontSelect) {
    const options = bodyFontSelect.querySelectorAll('option');
    if (options.length >= 5) {
      options[0].textContent = lang.fontSystem;
      options[2].textContent = lang.fontMalgun;
      options[3].textContent = lang.fontNanum;
    }
  }
  const codeFontSelect = document.getElementById('custom-code-font');
  if (codeFontSelect) {
    const firstOption = codeFontSelect.querySelector('option');
    if (firstOption) firstOption.textContent = lang.labelCodeFontDefault;
  }

  // CSS editor info
  const cssInfo = document.querySelector('.css-editor-info p');
  if (cssInfo) cssInfo.textContent = lang.cssEditorInfo;

  // Theme editor buttons
  themeReset.textContent = lang.reset;
  themeImportBtn.textContent = lang.import;
  themeExportBtn.textContent = lang.export;
  themeCancel.textContent = lang.cancel;
  themePreview.textContent = lang.preview;
  themeApply.textContent = lang.apply;

  // Image modal buttons
  if (imageZoomIn) imageZoomIn.title = lang.zoomIn?.replace(' (Ctrl++)', '') || '확대';
  if (imageZoomOut) imageZoomOut.title = lang.zoomOut?.replace(' (Ctrl+-)', '') || '축소';
  if (imageZoomReset) imageZoomReset.title = lang.zoomReset?.replace(' (Ctrl+0)', '') || '원래 크기';
  if (imageModalClose) imageModalClose.title = lang.close || '닫기';

  // If on home, refresh welcome screen
  if (activeTabId === HOME_TAB_ID) {
    content.innerHTML = getWelcomeHTML();
    renderHomeRecentFiles();
  }

  // Re-render pages to update page navigation text
  if (activeTabId !== HOME_TAB_ID && pages.length > 0) {
    renderPages();
  }

  // Update TOC texts
  updateTocTexts();
}

// ========== View Mode ==========
function setViewMode(mode) {
  currentViewMode = mode;
  localStorage.setItem('viewMode', mode);

  // Update button states
  btnViewSingle.classList.remove('active');
  btnViewDouble.classList.remove('active');
  btnViewPaging.classList.remove('active');

  if (mode === 'single') {
    btnViewSingle.classList.add('active');
  } else if (mode === 'double') {
    btnViewDouble.classList.add('active');
  } else if (mode === 'paging') {
    btnViewPaging.classList.add('active');
  }

  // Reset page when switching modes
  currentPage = 0;

  // Re-render pages if we have content
  if (activeTabId !== HOME_TAB_ID && pages.length > 0) {
    renderPages();
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

  // Enable/disable pan mode based on zoom level
  updatePanMode();
}

// ========== Pan (Drag to scroll when zoomed) ==========
function updatePanMode() {
  if (currentZoom > 100) {
    content.classList.add('pan-enabled');
  } else {
    content.classList.remove('pan-enabled');
    content.classList.remove('panning');
    isPanning = false;
  }
}

function isInteractivePanElement(element) {
  // Don't start panning on interactive elements
  const interactiveTags = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL'];
  const interactiveClasses = ['tab', 'tab-close', 'page-nav-btn', 'search-nav', 'search-box'];

  let current = element;
  while (current && current !== content) {
    if (interactiveTags.includes(current.tagName)) {
      return true;
    }
    if (interactiveClasses.some(cls => current.classList?.contains(cls))) {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

function onPanMouseDown(e) {
  if (currentZoom <= 100) return;
  if (e.button !== 0) return; // Only left mouse button
  if (isInteractivePanElement(e.target)) return;

  isPanning = true;
  panStartX = e.pageX;
  panStartY = e.pageY;
  panScrollLeft = content.scrollLeft;
  panScrollTop = content.scrollTop;

  content.classList.add('panning');
  e.preventDefault();
}

function onPanMouseMove(e) {
  if (!isPanning) return;

  e.preventDefault();

  const deltaX = e.pageX - panStartX;
  const deltaY = e.pageY - panStartY;

  // Move in opposite direction of mouse movement
  content.scrollLeft = panScrollLeft - deltaX;
  content.scrollTop = panScrollTop - deltaY;
}

function onPanMouseUp(e) {
  if (!isPanning) return;

  isPanning = false;
  content.classList.remove('panning');
}

function onPanMouseLeave(e) {
  if (!isPanning) return;

  isPanning = false;
  content.classList.remove('panning');
}

// ========== File Watcher (Auto-reload on external change) ==========
async function startWatching(filePath, tabId) {
  if (!fsWatchImmediate || !filePath) return;

  try {
    // Check if already watching this file
    if (fileWatchers.has(filePath)) {
      fileWatchers.get(filePath).tabIds.add(tabId);
      return;
    }

    // Start watching with watchImmediate for real-time updates
    const unwatch = await fsWatchImmediate(filePath, (event) => {
      handleFileChange(filePath, event);
    }, { recursive: false });

    fileWatchers.set(filePath, {
      unwatch: unwatch,
      tabIds: new Set([tabId])
    });
  } catch (error) {
    console.error('Failed to watch file:', filePath, error);
  }
}

async function stopWatching(filePath, tabId) {
  if (!fileWatchers.has(filePath)) return;

  const watcher = fileWatchers.get(filePath);
  watcher.tabIds.delete(tabId);

  // If no more tabs are watching this file, stop the watcher
  if (watcher.tabIds.size === 0) {
    try {
      if (typeof watcher.unwatch === 'function') {
        await watcher.unwatch();
      }
      fileWatchers.delete(filePath);
      console.log(`Stopped watching: ${filePath}`);
    } catch (error) {
      console.error(`Failed to stop watching: ${filePath}`, error);
    }
  }
}

function handleFileChange(filePath, event) {
  // Debounce: file changes can trigger multiple events in quick succession
  if (fileChangeDebounce.has(filePath)) {
    clearTimeout(fileChangeDebounce.get(filePath));
  }

  fileChangeDebounce.set(filePath, setTimeout(async () => {
    fileChangeDebounce.delete(filePath);

    // Check event type - watchImmediate returns different event structure
    const eventType = event?.type;
    const isModify = eventType === 'modify' ||
                     eventType === 'any' ||
                     eventType?.modify ||
                     eventType?.Modify ||
                     (typeof eventType === 'object' && eventType !== null);

    if (isModify) {
      // Find all tabs with this file path and reload them
      const tabsToReload = tabs.filter(t => t.filePath === filePath);

      for (const tab of tabsToReload) {
        try {
          const text = await tauriApi.invoke('read_file', { path: filePath });
          tab.content = text;

          // If this tab is active, re-render
          if (activeTabId === tab.id) {
            renderMarkdown(text, false);
            showNotification(t('fileReloaded') || '파일이 새로고침되었습니다');
          }
        } catch (error) {
          console.error('Failed to reload file:', filePath, error);
        }
      }
    }
  }, 300)); // 300ms debounce
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
    app: 'Vexa MD',
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

// ========== Presentation Mode ==========
function startPresentation() {
  if (pages.length === 0 || activeTabId === HOME_TAB_ID) {
    showNotification(t('noPrintDoc'));
    return;
  }

  isPresentationMode = true;
  presentationPage = 0;
  presentationOverlay.classList.remove('hidden');
  renderPresentationSlide();

  // Request fullscreen
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {
      // Fullscreen not supported or denied, continue anyway
    });
  }
}

function exitPresentation() {
  isPresentationMode = false;
  presentationOverlay.classList.add('hidden');

  // Exit fullscreen
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

function renderPresentationSlide() {
  if (!presentationContent) return;

  presentationContent.innerHTML = pages[presentationPage] || '';
  presIndicator.textContent = `${presentationPage + 1} / ${pages.length}`;

  presPrev.disabled = presentationPage === 0;
  presNext.disabled = presentationPage >= pages.length - 1;
}

function presentationPrev() {
  if (presentationPage > 0) {
    presentationPage--;
    renderPresentationSlide();
  }
}

function presentationNext() {
  if (presentationPage < pages.length - 1) {
    presentationPage++;
    renderPresentationSlide();
  }
}

// ========== Help Menu ==========
function toggleHelpDropdown() {
  if (helpDropdown.classList.contains('hidden')) {
    showHelpDropdown();
  } else {
    hideHelpDropdown();
  }
}

function showHelpDropdown() {
  helpDropdown.classList.remove('hidden');
}

function hideHelpDropdown() {
  helpDropdown.classList.add('hidden');
}

function showAboutModal() {
  hideHelpDropdown();
  aboutModal.classList.remove('hidden');
}

function closeAboutModal() {
  aboutModal.classList.add('hidden');
}

function showShortcutsModal() {
  hideHelpDropdown();
  shortcutsModal.classList.remove('hidden');
}

function closeShortcutsModal() {
  shortcutsModal.classList.add('hidden');
}

// ========== Image Modal ==========
function openImageModal(src, alt = '') {
  if (!imageModal || !imageModalImg) return;

  imageModalImg.src = src;
  imageModalImg.alt = alt;
  resetImageModalZoom();
  imageModal.classList.remove('hidden');
}

function closeImageModal() {
  if (!imageModal) return;

  imageModal.classList.add('hidden');
  if (imageModalImg) {
    imageModalImg.src = '';
  }
}

function imageModalZoomIn(amount = 0.25) {
  imageModalZoom = Math.min(imageModalMaxZoom, imageModalZoom + amount);
  applyImageModalZoom();
}

function imageModalZoomOut(amount = 0.25) {
  imageModalZoom = Math.max(imageModalMinZoom, imageModalZoom - amount);
  applyImageModalZoom();
}

function resetImageModalZoom() {
  imageModalZoom = 1;
  imageTranslateX = 0;
  imageTranslateY = 0;
  applyImageModalZoom();
}

function applyImageModalZoom() {
  if (!imageModalImg || !imageZoomInfo) return;

  imageModalImg.style.transform = `translate(${imageTranslateX}px, ${imageTranslateY}px) scale(${imageModalZoom})`;
  imageZoomInfo.textContent = `${Math.round(imageModalZoom * 100)}%`;

  // Update cursor based on zoom level
  if (imageModalContent) {
    if (imageModalZoom > 1) {
      imageModalContent.style.cursor = isImageDragging ? 'grabbing' : 'grab';
    } else {
      imageModalContent.style.cursor = 'default';
    }
  }
}

function onImageDragStart(e) {
  if (imageModalZoom <= 1) return;

  isImageDragging = true;
  imageStartX = e.clientX - imageTranslateX;
  imageStartY = e.clientY - imageTranslateY;

  if (imageModalContent) {
    imageModalContent.style.cursor = 'grabbing';
  }
}

function onImageDrag(e) {
  if (!isImageDragging) return;

  imageTranslateX = e.clientX - imageStartX;
  imageTranslateY = e.clientY - imageStartY;
  applyImageModalZoom();
}

function onImageDragEnd() {
  isImageDragging = false;
  if (imageModalContent && imageModalZoom > 1) {
    imageModalContent.style.cursor = 'grab';
  }
}

function attachImageClickListeners() {
  // Find all images in markdown content
  const images = content.querySelectorAll('img');
  images.forEach(img => {
    // Skip if already has listener
    if (img.dataset.modalEnabled) return;

    img.dataset.modalEnabled = 'true';
    img.style.cursor = 'zoom-in';

    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openImageModal(img.src, img.alt);
    });
  });
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
    content: content,
    tocVisible: false  // 새 탭은 TOC 숨김 상태로 시작
  };
  tabs.push(tab);
  renderTabs();
  switchToTab(tabId);
  updateTabBarVisibility();

  // Start watching for file changes (if it's a real file path)
  if (filePath && filePath !== name) {
    startWatching(filePath, tabId);
  }

  return tabId;
}

function switchToTab(tabId) {
  // Hide search bar when switching tabs
  if (isSearchVisible) {
    hideSearchBar();
  }

  // 현재 탭의 TOC 상태 저장 (홈이 아닌 경우)
  if (activeTabId !== HOME_TAB_ID) {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) {
      currentTab.tocVisible = getTocVisible();
    }
  }

  if (tabId === HOME_TAB_ID) {
    activeTabId = HOME_TAB_ID;
    content.innerHTML = getWelcomeHTML();
    content.classList.remove('view-double'); // 홈은 항상 한 페이지
    renderHomeRecentFiles();
    renderTabs();
    // 홈 탭은 항상 TOC 숨김
    clearToc();
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

  // 해당 탭의 TOC 상태 복원
  setTocVisible(tab.tocVisible || false);
}

function closeTab(tabId, event) {
  if (event) {
    event.stopPropagation();
  }

  // Cannot close home tab
  if (tabId === HOME_TAB_ID) return;

  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;

  // Stop watching this file
  const tab = tabs[tabIndex];
  if (tab.filePath && tab.filePath !== tab.name) {
    stopWatching(tab.filePath, tabId);
  }

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
  clearToc();
}

// ========== GitHub-style Alerts (Callout Boxes) ==========
// Supports: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
const ALERT_TYPES = {
  NOTE: {
    icon: '📝',
    class: 'alert-note',
    label: { ko: '참고', en: 'Note' }
  },
  TIP: {
    icon: '💡',
    class: 'alert-tip',
    label: { ko: '팁', en: 'Tip' }
  },
  IMPORTANT: {
    icon: '❗',
    class: 'alert-important',
    label: { ko: '중요', en: 'Important' }
  },
  WARNING: {
    icon: '⚠️',
    class: 'alert-warning',
    label: { ko: '경고', en: 'Warning' }
  },
  CAUTION: {
    icon: '🚨',
    class: 'alert-caution',
    label: { ko: '주의', en: 'Caution' }
  }
};

function processAlerts(text) {
  // Match GitHub-style alerts: > [!TYPE] followed by content lines starting with >
  const alertPattern = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n((?:>.*\n?)*)/gim;

  return text.replace(alertPattern, (match, type, content) => {
    const alertType = ALERT_TYPES[type.toUpperCase()];
    if (!alertType) return match;

    // Remove leading > from each line and trim
    const contentText = content
      .split('\n')
      .map(line => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();

    const label = alertType.label[currentLanguage] || alertType.label.en;

    // Return a placeholder that will be converted to HTML after marked parsing
    return `\n<div class="alert-box ${alertType.class}">
<div class="alert-header">
<span class="alert-icon">${alertType.icon}</span>
<span class="alert-title">${label}</span>
</div>
<div class="alert-content">

${contentText}

</div>
</div>\n`;
  });
}

// ========== Markdown Rendering ==========
function renderMarkdown(text, isNewFile = true) {
  const startTime = performance.now();

  try {
    // Normalize line endings to \n
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Process GitHub-style alerts before markdown parsing
    const processedText = processAlerts(normalizedText);

    // Split by --- (page breaks) for paging
    // Matches: standalone line with 3+ dashes, with optional spaces
    // Handles: ---  or ----  or -----  etc.
    const pageTexts = processedText.split(/\n\s*-{3,}\s*\n|\n\s*-{3,}\s*$|^\s*-{3,}\s*\n/);
    pages = pageTexts.filter(p => p.trim()).map(p => marked.parse(p));

    if (isNewFile) {
      currentPage = 0;
    }

    renderPages();

    const elapsed = (performance.now() - startTime).toFixed(1);
    console.log(`Rendered ${pages.length} pages in ${elapsed}ms`);
  } catch (error) {
    showError('Markdown 파싱 오류', error.message);
  }
}

function renderPages() {
  content.classList.add('markdown-body');
  const lang = i18n[currentLanguage];

  if (currentViewMode === 'single') {
    // Single view: Continuous scroll (all content)
    const allContent = pages.join('<hr class="page-break">');
    content.innerHTML = `<div class="markdown-content-wrapper">${allContent}</div>`;
  } else if (currentViewMode === 'double') {
    // Double view: Two pages side by side, continuous scroll
    let doubleContent = '';
    for (let i = 0; i < pages.length; i += 2) {
      const leftPage = pages[i] || '';
      const rightPage = pages[i + 1] || '';
      doubleContent += `
        <div class="double-page-row">
          <div class="page-left">${leftPage}</div>
          <div class="page-right">${rightPage}</div>
        </div>
      `;
      if (i + 2 < pages.length) {
        doubleContent += '<hr class="page-break">';
      }
    }
    content.innerHTML = `<div class="markdown-content-wrapper double-scroll-view">${doubleContent}</div>`;
  } else if (currentViewMode === 'paging') {
    // Paging view: One page at a time with navigation
    const totalPages = pages.length;
    const currentDisplay = currentPage + 1;

    if (totalPages <= 1) {
      content.innerHTML = `<div class="markdown-content-wrapper">${pages[0] || ''}</div>`;
    } else {
      content.innerHTML = `
        <div class="markdown-content-wrapper paging-view">
          ${pages[currentPage] || ''}
        </div>
        <div class="page-nav">
          <button id="page-prev" class="page-nav-btn" ${currentPage === 0 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div class="page-indicator-group">
            <input type="number" id="page-input" class="page-input" value="${currentDisplay}" min="1" max="${totalPages}" />
            <span class="page-total">/ ${totalPages}</span>
          </div>
          <button id="page-next" class="page-nav-btn" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      `;

      // Add event listeners for paging navigation
      const prevBtn = document.getElementById('page-prev');
      const nextBtn = document.getElementById('page-next');
      const pageInput = document.getElementById('page-input');

      if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
      if (pageInput) {
        pageInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const targetPage = parseInt(pageInput.value) - 1;
            goToPage(targetPage);
          }
        });
        pageInput.addEventListener('blur', () => {
          const targetPage = parseInt(pageInput.value) - 1;
          goToPage(targetPage);
        });
      }
    }
  } else {
    // Fallback: show all content
    const allContent = pages.join('<hr class="page-break">');
    content.innerHTML = `<div class="markdown-content-wrapper">${allContent}</div>`;
  }

  // Attach click listeners to images for modal
  attachImageClickListeners();

  // Generate TOC from headings
  generateToc();
}

function goToPage(pageNum) {
  if (pageNum < 0) pageNum = 0;
  if (pageNum >= pages.length) pageNum = pages.length - 1;
  currentPage = pageNum;
  renderPages();
  content.scrollTop = 0;
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
    // Presentation mode keyboard handling
    if (isPresentationMode) {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitPresentation();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        presentationPrev();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        presentationNext();
        return;
      }
      return; // Block other keys in presentation mode
    }

    // F5: Start presentation
    if (e.key === 'F5') {
      e.preventDefault();
      startPresentation();
    }
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
    // Ctrl+Shift+T: Toggle TOC sidebar
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      toggleToc();
    }
    // Ctrl+W: Close current tab
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
    }
    // Escape: Close modals/dropdowns or go home
    if (e.key === 'Escape') {
      e.preventDefault();
      hideRecentDropdown();
      hideHelpDropdown();
      if (imageModal && !imageModal.classList.contains('hidden')) {
        closeImageModal();
      } else if (!aboutModal.classList.contains('hidden')) {
        closeAboutModal();
      } else if (!shortcutsModal.classList.contains('hidden')) {
        closeShortcutsModal();
      } else if (isSearchVisible) {
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
    // Arrow keys for page navigation (paging view only, when not in search or input)
    if (!isSearchVisible && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      if (currentViewMode === 'paging' && pages.length > 1) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPage(currentPage - 1);
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToPage(currentPage + 1);
        }
      }
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

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!recentDropdown.contains(e.target) && !btnRecent.contains(e.target)) {
      hideRecentDropdown();
    }
    if (!helpDropdown.contains(e.target) && !btnHelp.contains(e.target)) {
      hideHelpDropdown();
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

      // 파일 드롭 이벤트 (Tauri 2.0)
      await listen('tauri://drag-drop', async (event) => {
        console.log('Drag drop event:', event);
        const paths = event.payload?.paths || event.payload;
        if (paths && paths.length > 0) {
          for (const filePath of paths) {
            if (filePath.match(/\.(md|markdown|txt)$/i)) {
              await loadFile(filePath);
            } else if (filePath.match(/\.json$/i)) {
              // 테마 파일
              try {
                const text = await tauriApi.invoke('read_file', { path: filePath });
                const data = JSON.parse(text);
                if (data.customStyles) {
                  customStyles = data.customStyles;
                  localStorage.setItem('customStyles', JSON.stringify(customStyles));
                  applyCustomStyles(customStyles);
                  selectCustomTheme();
                  showNotification(t('themeImported') || '테마를 불러왔습니다');
                }
              } catch (e) {
                console.error('Failed to import theme:', e);
              }
            }
          }
        }
      });

      // 싱글 인스턴스: 두 번째 인스턴스에서 파일 열기 요청
      await listen('open-files-from-instance', async (event) => {
        const filePaths = event.payload;
        if (filePaths && filePaths.length > 0) {
          for (const filePath of filePaths) {
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
  // [PERF] 성능 측정 코드 (필요시 주석 해제)
  // const initStart = performance.now();
  // console.log('[PERF] init() 시작');

  // 1. UI 먼저 렌더링 (즉시 화면 표시)
  applyTheme(currentTheme);
  applyFontFamily(currentFontFamily);
  applyFontSize(currentFontSize);

  if (customStyles && customThemeOption) {
    customThemeOption.hidden = false;
  }
  applyColorTheme(currentColor);

  activeTabId = HOME_TAB_ID;
  updateTabBarVisibility();
  renderTabs();
  renderHomeRecentFiles();

  setViewMode(currentViewMode);
  setZoom(currentZoom);
  applyContentWidth(currentContentWidth);
  languageSelect.value = currentLanguage;
  updateUITexts();

  setupDragDrop();
  setupKeyboard();
  // console.log(`[PERF] UI 초기화: ${(performance.now() - initStart).toFixed(1)}ms`);

  // 2. Tauri 초기화 (백그라운드)
  initTauri().then(() => {
    // console.log(`[PERF] Tauri 완료: ${(performance.now() - initStart).toFixed(1)}ms`);
    setupTauriEvents();
    handleCliArgs();
  });

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
  btnViewPaging.addEventListener('click', () => setViewMode('paging'));

  // Zoom buttons
  btnZoomIn.addEventListener('click', zoomIn);
  btnZoomOut.addEventListener('click', zoomOut);
  btnZoomReset.addEventListener('click', zoomReset);

  // Pan event listeners (drag to scroll when zoomed in)
  content.addEventListener('mousedown', onPanMouseDown);
  content.addEventListener('mousemove', onPanMouseMove);
  content.addEventListener('mouseup', onPanMouseUp);
  content.addEventListener('mouseleave', onPanMouseLeave);

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

  fontFamily.addEventListener('change', (e) => {
    applyFontFamily(e.target.value);
  });

  fontSize.addEventListener('change', (e) => {
    applyFontSize(e.target.value);
  });

  contentWidth.addEventListener('change', (e) => {
    applyContentWidth(e.target.value);
  });

  languageSelect.addEventListener('change', (e) => {
    applyLanguage(e.target.value);
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

  // Presentation mode event listeners
  btnPresentation.addEventListener('click', startPresentation);
  presPrev.addEventListener('click', presentationPrev);
  presNext.addEventListener('click', presentationNext);
  presExit.addEventListener('click', exitPresentation);

  // Handle fullscreen change
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isPresentationMode) {
      exitPresentation();
    }
  });

  // Help menu event listeners
  btnHelp.addEventListener('click', toggleHelpDropdown);
  helpShortcuts.addEventListener('click', showShortcutsModal);
  helpAbout.addEventListener('click', showAboutModal);
  aboutClose.addEventListener('click', closeAboutModal);
  aboutOk.addEventListener('click', closeAboutModal);
  aboutModal.querySelector('.modal-backdrop').addEventListener('click', closeAboutModal);

  // Shortcuts modal event listeners
  shortcutsClose.addEventListener('click', closeShortcutsModal);
  shortcutsOk.addEventListener('click', closeShortcutsModal);
  shortcutsModal.querySelector('.modal-backdrop').addEventListener('click', closeShortcutsModal);

  // Image modal event listeners
  if (imageModal) {
    imageModalClose?.addEventListener('click', closeImageModal);
    imageModalBackdrop?.addEventListener('click', closeImageModal);
    imageZoomIn?.addEventListener('click', () => imageModalZoomIn());
    imageZoomOut?.addEventListener('click', () => imageModalZoomOut());
    imageZoomReset?.addEventListener('click', resetImageModalZoom);

    // Mouse wheel zoom on image modal
    imageModalContent?.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        imageModalZoomIn(0.1);
      } else {
        imageModalZoomOut(0.1);
      }
    }, { passive: false });

    // Drag to pan image
    imageModalContent?.addEventListener('mousedown', onImageDragStart);
    imageModalContent?.addEventListener('mousemove', onImageDrag);
    imageModalContent?.addEventListener('mouseup', onImageDragEnd);
    imageModalContent?.addEventListener('mouseleave', onImageDragEnd);
  }

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
