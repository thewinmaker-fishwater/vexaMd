/**
 * Vexa MD - Ultra Lightweight Markdown Viewer
 * Seven Peaks Software
 * Main Orchestrator
 */

import { i18n } from './i18n.js';
import { toggleToc, updateTocTexts, clearToc, hideToc } from './modules/toc/toc.js';
import { markdownEditor } from './modules/editor/editor.js';
import { pluginManager } from './core/plugin-manager.js';
import { eventBus, EVENTS } from './core/events.js';
import { pluginUI } from './modules/plugins/plugin-ui.js';

// Modules
import { showNotification, showError } from './modules/notification/notification.js';
import * as imageModal from './modules/image-modal/image-modal.js';
import { printDocument, exportPdf } from './modules/print/print.js';
import * as presentation from './modules/presentation/presentation-mode.js';
import * as renderer from './modules/markdown/renderer.js';
import * as search from './modules/search/search-manager.js';
import * as tabManager from './modules/tabs/tab-manager.js';
import * as zoom from './modules/zoom/zoom-manager.js';
import * as fileOps from './modules/files/file-ops.js';
import { saveSession, restoreSession } from './modules/session/session.js';
import { exportVmd, exportVmdToMd, loadVmdFile } from './modules/vmd/vmd.js';
import * as themeSystem from './modules/theme/theme-system.js';
import * as shortcuts from './modules/shortcuts/shortcuts.js';

// ========== State ==========
let currentLanguage = localStorage.getItem('language') || 'ko';
const languageSelect = document.getElementById('language');

// ========== i18n helper ==========
function t(key) {
  return i18n[currentLanguage][key] || key;
}

function applyLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  languageSelect.value = lang;
  updateUITexts();
}

// ========== Welcome HTML ==========
function getWelcomeHTML() {
  const lang = i18n[currentLanguage];
  return `
  <div class="welcome">
    <div class="welcome-logo">
      <img src="/logo.png" alt="Vexa MD" width="120">
    </div>
    <h1>Vexa MD</h1>
    <p class="subtitle">${lang.welcomeSubtitle}</p>
    <p>${lang.welcomeInstruction}</p>
    <p><kbd>Ctrl</kbd>+<kbd>O</kbd> 열기 &nbsp; <kbd>Ctrl</kbd>+<kbd>D</kbd> 테마 &nbsp; <kbd>Ctrl</kbd>+<kbd>P</kbd> 인쇄 &nbsp; <kbd>Ctrl</kbd>+<kbd>F</kbd> 검색 &nbsp; <kbd>Esc</kbd> 홈</p>
    <div id="home-recent" class="home-recent">
      <h3>${lang.recentFiles}</h3>
      <div id="home-recent-list"></div>
    </div>
  </div>
`;
}

// ========== Editor Functions ==========
const editorPane = document.getElementById('editor-pane');
const editorTextarea = document.getElementById('markdown-editor');
const mainContainer = document.getElementById('main-container');
const btnModeView = document.getElementById('btn-mode-view');
const btnModeEdit = document.getElementById('btn-mode-edit');
const btnModeSplit = document.getElementById('btn-mode-split');
const btnSave = document.getElementById('btn-save');
const contentEl = document.getElementById('content');

let editorDebounceTimer = null;
const EDITOR_DEBOUNCE_DELAY = 300;

function loadEditorContent(content) {
  if (editorTextarea) editorTextarea.value = content || '';
}

function setEditorMode(mode) {
  if (!mainContainer) return;
  if (tabManager.getActiveTabId() === tabManager.HOME_TAB_ID) mode = 'view';
  const activeTab = tabManager.getTabs().find(t => t.id === tabManager.getActiveTabId());
  if (activeTab) activeTab.editMode = mode;
  updateEditorModeButtons(mode);
  mainContainer.classList.remove('mode-view', 'mode-edit', 'mode-split');
  mainContainer.classList.add(`mode-${mode}`);
  if (editorPane) {
    if (mode === 'view') editorPane.classList.add('hidden');
    else editorPane.classList.remove('hidden');
  }
  if (mode === 'split') updateEditorPreview();
}

function updateEditorModeButtons(mode) {
  if (btnModeView) btnModeView.classList.toggle('active', mode === 'view');
  if (btnModeEdit) btnModeEdit.classList.toggle('active', mode === 'edit');
  if (btnModeSplit) btnModeSplit.classList.toggle('active', mode === 'split');
}

function updateEditModeButtonsDisabled(disabled) {
  if (btnModeEdit) btnModeEdit.disabled = disabled;
  if (btnModeSplit) btnModeSplit.disabled = disabled;
}

function onEditorInput() {
  const editorContent = editorTextarea?.value || '';
  const activeTab = tabManager.getTabs().find(t => t.id === tabManager.getActiveTabId());
  if (activeTab && tabManager.getActiveTabId() !== tabManager.HOME_TAB_ID) {
    activeTab.content = editorContent;
    const wasDirty = activeTab.isDirty;
    activeTab.isDirty = activeTab.content !== activeTab.originalContent;
    if (wasDirty !== activeTab.isDirty) tabManager.renderTabs();
    const currentMode = mainContainer?.classList.contains('mode-split') ? 'split' :
                        mainContainer?.classList.contains('mode-edit') ? 'edit' : 'view';
    if (currentMode === 'split') {
      if (editorDebounceTimer) clearTimeout(editorDebounceTimer);
      editorDebounceTimer = setTimeout(() => updateEditorPreview(), EDITOR_DEBOUNCE_DELAY);
    }
  }
}

function updateEditorPreview() {
  const editorContent = editorTextarea?.value || '';
  if (contentEl) doRenderMarkdown(editorContent, false);
}

async function saveCurrentFile() {
  const activeTab = tabManager.getTabs().find(t => t.id === tabManager.getActiveTabId());
  if (!activeTab || tabManager.getActiveTabId() === tabManager.HOME_TAB_ID) return;
  const editorContent = editorTextarea?.value || activeTab.content;
  const fsWrite = fileOps.getFsWriteTextFile();
  if (activeTab.filePath && fsWrite) {
    try {
      await fsWrite(activeTab.filePath, editorContent);
      activeTab.content = editorContent;
      activeTab.originalContent = editorContent;
      activeTab.isDirty = false;
      tabManager.renderTabs();
      showNotification(t('saved') || '저장되었습니다');
    } catch (error) {
      showError('저장 실패', error.toString());
    }
  }
}

// ========== Export Buttons ==========
function updateExportButtons() {
  const activeTab = tabManager.getTabs().find(t => t.id === tabManager.getActiveTabId());
  const hasFile = activeTab != null;
  const isReadOnly = activeTab?.readOnly || false;
  const btnExportVmd = document.getElementById('btn-export-vmd');
  const btnExportVmdToMd = document.getElementById('btn-export-vmd-to-md');
  if (btnExportVmd) btnExportVmd.disabled = !hasFile || isReadOnly;
  if (btnExportVmdToMd) btnExportVmdToMd.disabled = !hasFile || !isReadOnly;
}

// ========== Toolbar Dropdowns ==========
const formatDropdown = document.getElementById('format-dropdown');
const toolsDropdown = document.getElementById('tools-dropdown');
const helpDropdown = document.getElementById('help-dropdown');
const btnFormat = document.getElementById('btn-format');
const btnTools = document.getElementById('btn-tools');
const btnHelp = document.getElementById('btn-help');
const aboutModal = document.getElementById('about-modal');
const shortcutsModal = document.getElementById('shortcuts-modal');

function closeAllToolbarDropdowns() {
  formatDropdown?.classList.add('hidden');
  toolsDropdown?.classList.add('hidden');
  helpDropdown?.classList.add('hidden');
}

// ========== Render wrapper ==========
function doRenderMarkdown(text, isNewFile) {
  renderer.renderMarkdown(text, isNewFile, {
    contentEl,
    currentLanguage,
    currentViewMode: zoom.getCurrentViewMode(),
    attachImageClickListeners: imageModal.attachImageClickListeners,
  });
}

// ========== updateUITexts ==========
function updateUITexts() {
  const lang = i18n[currentLanguage];

  document.getElementById('btn-home').title = lang.homeTooltip;
  document.getElementById('btn-open').title = lang.openFile;
  document.getElementById('btn-recent').title = lang.recentFiles;
  document.getElementById('btn-theme').title = lang.toggleTheme;
  document.getElementById('btn-customize').title = lang.themeCustomizer;
  const btnPrint = document.getElementById('btn-print');
  const btnPdf = document.getElementById('btn-pdf');
  if (btnPrint) btnPrint.title = lang.print;
  if (btnPdf) btnPdf.title = lang.exportPdf;
  document.getElementById('btn-search').title = lang.search;
  document.getElementById('btn-view-single').title = lang.viewSingle;
  document.getElementById('btn-view-double').title = lang.viewDouble;
  document.getElementById('btn-view-paging').title = lang.viewPaging;
  document.getElementById('btn-zoom-in').title = lang.zoomIn;
  document.getElementById('btn-zoom-out').title = lang.zoomOut;
  document.getElementById('btn-zoom-reset').title = lang.zoomReset;
  document.getElementById('btn-presentation').title = lang.presentation;
  btnHelp.title = lang.help;
  document.getElementById('zoom-level').title = lang.zoomRatio;

  // Search
  document.getElementById('search-input').placeholder = lang.searchPlaceholder;
  document.getElementById('search-prev').title = lang.searchPrev;
  document.getElementById('search-next').title = lang.searchNext;
  document.getElementById('search-close').title = lang.searchClose;

  // Recent
  document.getElementById('recent-empty').textContent = lang.recentEmpty;
  document.getElementById('clear-recent').textContent = lang.clearList;
  document.querySelector('.dropdown-header').textContent = lang.recentFiles;
  document.querySelector('.drop-message').textContent = lang.dropMessage;

  // Color theme select
  const colorTheme = document.getElementById('color-theme');
  colorTheme.title = lang.colorTheme;
  colorTheme.querySelector('[value="default"]').textContent = lang.themeDefault;
  colorTheme.querySelector('[value="purple"]').textContent = lang.themePurple;
  colorTheme.querySelector('[value="ocean"]').textContent = lang.themeOcean;
  colorTheme.querySelector('[value="sunset"]').textContent = lang.themeSunset;
  colorTheme.querySelector('[value="forest"]').textContent = lang.themeForest;
  colorTheme.querySelector('[value="rose"]').textContent = lang.themeRose;
  colorTheme.querySelector('[value="custom"]').textContent = lang.themeCustom;

  // Font
  const fontFamilySelect = document.getElementById('font-family');
  fontFamilySelect.title = lang.fontFamily;
  fontFamilySelect.querySelector('[value="system"]').textContent = lang.fontSystem;
  fontFamilySelect.querySelector('[value="malgun"]').textContent = lang.fontMalgun;
  fontFamilySelect.querySelector('[value="nanum"]').textContent = lang.fontNanum;
  fontFamilySelect.querySelector('[value="pretendard"]').textContent = lang.fontPretendard;
  fontFamilySelect.querySelector('[value="noto"]').textContent = lang.fontNoto;

  const fontSizeSelect = document.getElementById('font-size');
  fontSizeSelect.title = lang.fontSize;
  fontSizeSelect.querySelector('[value="small"]').textContent = lang.fontSmall;
  fontSizeSelect.querySelector('[value="medium"]').textContent = lang.fontMedium;
  fontSizeSelect.querySelector('[value="large"]').textContent = lang.fontLarge;
  fontSizeSelect.querySelector('[value="xlarge"]').textContent = lang.fontXlarge;

  const contentWidthSelect = document.getElementById('content-width');
  contentWidthSelect.title = lang.contentWidth;
  contentWidthSelect.querySelector('[value="narrow"]').textContent = lang.widthNarrow;
  contentWidthSelect.querySelector('[value="medium"]').textContent = lang.widthMedium;
  contentWidthSelect.querySelector('[value="wide"]').textContent = lang.widthWide;
  contentWidthSelect.querySelector('[value="full"]').textContent = lang.widthFull;

  languageSelect.title = lang.language;
  document.querySelector('#help-shortcuts span').textContent = lang.shortcuts;
  document.querySelector('#help-about span').textContent = lang.about;

  // Presentation
  document.getElementById('pres-prev').title = lang.prevSlide;
  document.getElementById('pres-next').title = lang.nextSlide;
  document.getElementById('pres-exit').title = lang.exitPresentation;

  // About
  document.querySelector('#about-modal .modal-header h2').textContent = lang.aboutTitle;
  document.querySelector('.about-version').textContent = `${lang.version} 1.0.0`;
  document.querySelector('.about-description').textContent = lang.welcomeSubtitle;
  const aboutInfoPs = document.querySelectorAll('.about-info p');
  if (aboutInfoPs.length >= 3) {
    aboutInfoPs[0].innerHTML = `<strong>${lang.developer}</strong>: Seven Peaks Software`;
    aboutInfoPs[1].innerHTML = `<strong>${lang.technology}</strong>: Tauri 2.x + Vanilla JavaScript`;
    aboutInfoPs[2].innerHTML = `<strong>${lang.license}</strong>: Apache 2.0`;
  }
  document.getElementById('about-ok').textContent = lang.confirm;

  // Shortcuts
  document.querySelector('#shortcuts-modal .modal-header h2').textContent = lang.shortcutsTitle;
  const shortcutSections = document.querySelectorAll('.shortcuts-section h4');
  if (shortcutSections.length >= 3) {
    shortcutSections[0].textContent = lang.shortcutFile;
    shortcutSections[1].textContent = lang.shortcutView;
    shortcutSections[2].textContent = lang.shortcutNav;
  }
  const shortcutItems = document.querySelectorAll('.shortcut-item span');
  const shortcutTexts = [
    lang.scOpenFile, lang.scSave, lang.scCloseTab, lang.scPrint, lang.scHome,
    lang.scToggleTheme, lang.scExportTheme, lang.scZoomIn, lang.scZoomOut, lang.scZoomReset,
    lang.scSearch, lang.scToc, lang.scPageNav, lang.scNextTab, lang.scPresentation
  ];
  shortcutItems.forEach((item, idx) => {
    if (shortcutTexts[idx]) item.textContent = shortcutTexts[idx];
  });
  document.getElementById('shortcuts-ok').textContent = lang.confirm;

  // Theme editor
  document.querySelector('#theme-editor-modal .modal-header h2').textContent = lang.themeEditorTitle;
  const edTabs = document.querySelectorAll('.editor-tab');
  if (edTabs.length >= 2) {
    edTabs[0].textContent = lang.tabUIEditor;
    edTabs[1].textContent = lang.tabCSSEditor;
  }
  const sectionTitles = document.querySelectorAll('.editor-section h3');
  const sectionTexts = [lang.sectionColors, lang.sectionFont, lang.sectionCode, lang.sectionBlockquote, lang.sectionTable, lang.sectionHeadings, lang.sectionTextMark, lang.sectionToolbar];
  sectionTitles.forEach((title, idx) => { if (sectionTexts[idx]) title.textContent = sectionTexts[idx]; });

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
  labels.forEach((label, idx) => { if (labelTexts[idx]) label.textContent = labelTexts[idx]; });

  const bodyFontSelect = document.getElementById('custom-font-family');
  if (bodyFontSelect) {
    const options = bodyFontSelect.querySelectorAll('option');
    if (options.length >= 5) { options[0].textContent = lang.fontSystem; options[2].textContent = lang.fontMalgun; options[3].textContent = lang.fontNanum; }
  }
  const codeFontSelect = document.getElementById('custom-code-font');
  if (codeFontSelect) {
    const firstOption = codeFontSelect.querySelector('option');
    if (firstOption) firstOption.textContent = lang.labelCodeFontDefault;
  }
  const cssInfo = document.querySelector('.css-editor-info p');
  if (cssInfo) cssInfo.textContent = lang.cssEditorInfo;

  document.getElementById('theme-reset').textContent = lang.reset;
  document.getElementById('theme-import').textContent = lang.import;
  document.getElementById('theme-export').textContent = lang.export;
  document.getElementById('theme-cancel').textContent = lang.cancel;
  document.getElementById('theme-preview').textContent = lang.preview;
  document.getElementById('theme-apply').textContent = lang.apply;

  const imageZoomInEl = document.getElementById('image-zoom-in');
  const imageZoomOutEl = document.getElementById('image-zoom-out');
  const imageZoomResetEl = document.getElementById('image-zoom-reset');
  const imageModalCloseEl = document.getElementById('image-modal-close');
  if (imageZoomInEl) imageZoomInEl.title = lang.zoomIn?.replace(' (Ctrl++)', '') || '확대';
  if (imageZoomOutEl) imageZoomOutEl.title = lang.zoomOut?.replace(' (Ctrl+-)', '') || '축소';
  if (imageZoomResetEl) imageZoomResetEl.title = lang.zoomReset?.replace(' (Ctrl+0)', '') || '원래 크기';
  if (imageModalCloseEl) imageModalCloseEl.title = lang.close || '닫기';

  if (tabManager.getActiveTabId() === tabManager.HOME_TAB_ID) {
    contentEl.innerHTML = getWelcomeHTML();
    fileOps.renderHomeRecentFiles();
  }
  if (tabManager.getActiveTabId() !== tabManager.HOME_TAB_ID && renderer.getPages().length > 0) {
    renderer.renderPages(contentEl, {
      currentViewMode: zoom.getCurrentViewMode(),
      currentLanguage,
      attachImageClickListeners: imageModal.attachImageClickListeners,
    });
  }
  updateTocTexts();
}

// ========== doSaveSession ==========
function doSaveSession() {
  saveSession({
    tabs: tabManager.getTabs(),
    activeTabId: tabManager.getActiveTabId(),
    HOME_TAB_ID: tabManager.HOME_TAB_ID,
  });
}

// ========== VMD context builder ==========
function buildVmdCtx() {
  return {
    tabs: tabManager.getTabs(),
    activeTabId: tabManager.getActiveTabId(),
    currentLanguage,
    tauriApi: fileOps.getTauriApi(),
    dialogSave: fileOps.getDialogSave(),
    generateTabId: () => 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    pushTab: tabManager.pushTab,
    renderTabs: tabManager.renderTabs,
    switchToTab: tabManager.switchToTab,
    updateTabBarVisibility: () => {},
    addToRecentFiles: fileOps.addToRecentFiles,
    saveSession: doSaveSession,
  };
}

// ========== Initialize ==========
async function init() {
  // Theme system init (DOM refs)
  themeSystem.init({
    getDialogSave: fileOps.getDialogSave,
    getFsWriteTextFile: fileOps.getFsWriteTextFile,
    getTauriApi: fileOps.getTauriApi,
  });
  themeSystem.initStyles();

  // Tab manager init
  tabManager.init({
    getWelcomeHTML,
    renderHomeRecentFiles: fileOps.renderHomeRecentFiles,
    setEditorMode,
    applyTabZoom: zoom.applyTabZoom,
    updateExportButtons,
    renderMarkdown: (text, isNew) => doRenderMarkdown(text, isNew),
    getCurrentViewMode: zoom.getCurrentViewMode,
    loadEditorContent,
    updateEditModeButtonsDisabled,
    hideSearchBar: search.hideSearchBar,
    startWatching: fileOps.startWatching,
    stopWatching: fileOps.stopWatching,
    saveSession: doSaveSession,
    getCurrentLanguage: () => currentLanguage,
  });

  // Zoom init
  zoom.init({
    getActiveTabId: tabManager.getActiveTabId,
    HOME_TAB_ID: tabManager.HOME_TAB_ID,
    getTabs: tabManager.getTabs,
    onViewModeChange: (mode) => {
      // Reset page and re-render
      if (tabManager.getActiveTabId() !== tabManager.HOME_TAB_ID && renderer.getPages().length > 0) {
        renderer.renderPages(contentEl, {
          currentViewMode: mode,
          currentLanguage,
          attachImageClickListeners: imageModal.attachImageClickListeners,
        });
      }
    },
  });
  zoom.setViewMode(localStorage.getItem('viewMode') || 'single');
  zoom.applyTabZoom(tabManager.getActiveTabId());

  // Image modal init
  imageModal.init({});

  // Presentation init
  presentation.init({
    getPages: renderer.getPages,
    t,
  });

  // Search init
  search.init({
    getActiveTabId: () => tabManager.getActiveTabId(),
    HOME_TAB_ID: tabManager.HOME_TAB_ID,
  });

  // File operations init
  fileOps.init({
    createTab: tabManager.createTab,
    switchToTab: tabManager.switchToTab,
    getTabs: tabManager.getTabs,
    getActiveTabId: tabManager.getActiveTabId,
    closeTab: tabManager.closeTab,
    renderMarkdown: (text, isNew) => doRenderMarkdown(text, isNew),
    t,
    loadVmdFile: (path) => loadVmdFile(path, buildVmdCtx()),
    importTheme: themeSystem.importTheme,
    importThemeData: themeSystem.importThemeData,
  });
  fileOps.setupDragDrop();

  // Shortcuts init
  shortcuts.init({
    handlePresentationKeydown: presentation.handleKeydown,
    startPresentation: presentation.startPresentation,
    openFile: fileOps.openFile,
    toggleTheme: themeSystem.toggleTheme,
    exportTheme: themeSystem.exportTheme,
    printDocument: () => printDocument({ getTabs: tabManager.getTabs }),
    saveCurrentFile,
    zoomIn: zoom.zoomIn,
    zoomOut: zoom.zoomOut,
    zoomReset: zoom.zoomReset,
    toggleSearchBar: () => search.toggleSearchBar(tabManager.getTabs().length),
    toggleToc,
    closeCurrentTab: () => { if (tabManager.getActiveTabId()) tabManager.closeTab(tabManager.getActiveTabId()); },
    handleEscape: () => {
      const hasOpenDropdown = !formatDropdown?.classList.contains('hidden') ||
        !toolsDropdown?.classList.contains('hidden') ||
        !helpDropdown?.classList.contains('hidden');
      if (hasOpenDropdown) { closeAllToolbarDropdowns(); }
      else if (imageModal.isOpen()) { imageModal.closeImageModal(); }
      else if (!aboutModal.classList.contains('hidden')) { aboutModal.classList.add('hidden'); }
      else if (!shortcutsModal.classList.contains('hidden')) { shortcutsModal.classList.add('hidden'); }
      else if (search.getIsSearchVisible()) { search.hideSearchBar(); }
      fileOps.hideRecentDropdown();
    },
    nextTab: () => {
      const allTabs = [tabManager.HOME_TAB_ID, ...tabManager.getTabs().map(t => t.id)];
      const currentIndex = allTabs.indexOf(tabManager.getActiveTabId());
      tabManager.switchToTab(allTabs[(currentIndex + 1) % allTabs.length]);
    },
    getIsSearchVisible: search.getIsSearchVisible,
    getCurrentViewMode: zoom.getCurrentViewMode,
    getPages: renderer.getPages,
    getCurrentPage: renderer.getCurrentPage,
    goToPage: (p) => renderer.goToPage(p, contentEl),
    handleDocumentClick: (e) => {
      const recentDropdown = document.getElementById('recent-dropdown');
      const btnRecent = document.getElementById('btn-recent');
      if (!recentDropdown.contains(e.target) && !btnRecent.contains(e.target)) fileOps.hideRecentDropdown();
      if (!helpDropdown.contains(e.target) && !btnHelp.contains(e.target)) helpDropdown.classList.add('hidden');
      if (!e.target.closest('.toolbar-dropdown-wrapper') && !e.target.closest('.help-menu-wrapper')) closeAllToolbarDropdowns();
    },
  });

  // Language
  languageSelect.value = currentLanguage;
  languageSelect.addEventListener('change', (e) => applyLanguage(e.target.value));
  updateUITexts();

  // Home
  document.getElementById('btn-home').addEventListener('click', () => { tabManager.switchToTab(tabManager.HOME_TAB_ID); clearToc(); });

  // Print/PDF
  const btnPrint = document.getElementById('btn-print');
  const btnPdf = document.getElementById('btn-pdf');
  if (btnPrint) btnPrint.addEventListener('click', () => printDocument({ getTabs: tabManager.getTabs }));
  if (btnPdf) btnPdf.addEventListener('click', () => exportPdf({
    tabs: tabManager.getTabs(), activeTabId: tabManager.getActiveTabId(),
    HOME_TAB_ID: tabManager.HOME_TAB_ID, t
  }));

  // VMD exports
  const btnExportVmd = document.getElementById('btn-export-vmd');
  const btnExportVmdToMd = document.getElementById('btn-export-vmd-to-md');
  if (btnExportVmd) btnExportVmd.addEventListener('click', () => exportVmd(buildVmdCtx()));
  if (btnExportVmdToMd) btnExportVmdToMd.addEventListener('click', () => exportVmdToMd(buildVmdCtx()));

  // Toolbar dropdowns
  btnFormat?.addEventListener('click', (e) => {
    e?.stopPropagation();
    const isOpen = !formatDropdown.classList.contains('hidden');
    closeAllToolbarDropdowns();
    if (!isOpen) formatDropdown.classList.remove('hidden');
  });
  btnTools?.addEventListener('click', (e) => {
    e?.stopPropagation();
    const isOpen = !toolsDropdown.classList.contains('hidden');
    closeAllToolbarDropdowns();
    if (!isOpen) toolsDropdown.classList.remove('hidden');
  });

  // Help menu
  btnHelp.addEventListener('click', (e) => {
    e?.stopPropagation();
    const isOpen = !helpDropdown.classList.contains('hidden');
    closeAllToolbarDropdowns();
    if (!isOpen) helpDropdown.classList.remove('hidden');
  });
  document.getElementById('help-shortcuts').addEventListener('click', () => { helpDropdown.classList.add('hidden'); shortcutsModal.classList.remove('hidden'); });
  document.getElementById('help-about').addEventListener('click', () => { helpDropdown.classList.add('hidden'); aboutModal.classList.remove('hidden'); });
  document.getElementById('about-close').addEventListener('click', () => aboutModal.classList.add('hidden'));
  document.getElementById('about-ok').addEventListener('click', () => aboutModal.classList.add('hidden'));
  aboutModal.querySelector('.modal-backdrop').addEventListener('click', () => aboutModal.classList.add('hidden'));
  document.getElementById('shortcuts-close').addEventListener('click', () => shortcutsModal.classList.add('hidden'));
  document.getElementById('shortcuts-ok').addEventListener('click', () => shortcutsModal.classList.add('hidden'));
  shortcutsModal.querySelector('.modal-backdrop').addEventListener('click', () => shortcutsModal.classList.add('hidden'));

  // Editor mode buttons
  if (btnModeView) btnModeView.addEventListener('click', () => setEditorMode('view'));
  if (btnModeEdit) btnModeEdit.addEventListener('click', () => setEditorMode('edit'));
  if (btnModeSplit) btnModeSplit.addEventListener('click', () => setEditorMode('split'));
  if (btnSave) btnSave.addEventListener('click', saveCurrentFile);
  if (editorTextarea) editorTextarea.addEventListener('input', onEditorInput);

  // Editor
  markdownEditor.init();

  // Plugin system
  const btnPlugins = document.getElementById('btn-plugins');
  pluginManager.init().then(() => {
    eventBus.emit(EVENTS.PLUGINS_LOADED, { plugins: pluginManager.getPluginList() });
  }).catch(err => console.error('[Plugins] Failed to initialize:', err));
  if (btnPlugins) {
    pluginUI.init();
    btnPlugins.addEventListener('click', () => pluginUI.open());
  }

  // Tauri init (background)
  fileOps.initTauri().then(async () => {
    fileOps.setupTauriEvents();
    const tauriApi = fileOps.getTauriApi();
    const args = tauriApi ? await tauriApi.invoke('get_cli_args').catch(() => []) : [];
    if (args && args.length > 0) {
      await fileOps.loadFile(args[0]);
    } else {
      await restoreSession({
        tauriApi,
        generateTabId: () => 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        pushTab: tabManager.pushTab,
        getTabs: tabManager.getTabs,
        renderTabs: tabManager.renderTabs,
        updateTabBarVisibility: () => {},
        switchToTab: tabManager.switchToTab,
        startWatching: fileOps.startWatching,
        addToRecentFiles: fileOps.addToRecentFiles,
        HOME_TAB_ID: tabManager.HOME_TAB_ID,
      });
    }
  });

  // Render initial
  tabManager.renderTabs();
  fileOps.renderHomeRecentFiles();
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
