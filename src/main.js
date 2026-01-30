/**
 * Vexa MD - Ultra Lightweight Markdown Viewer
 * Seven Peaks Software
 * Main Orchestrator
 */

import { i18n } from './i18n.js';
import { toggleToc, clearToc } from './modules/toc/toc.js';
import { pluginManager } from './core/plugin-manager.js';
import { eventBus, EVENTS } from './core/events.js';
import { pluginUI } from './modules/plugins/plugin-ui.js';

// Modules
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

// Extracted modules
import { getWelcomeHTML } from './modules/welcome/welcome.js';
import { initUITexts, updateUITexts as _updateUITexts } from './modules/ui/ui-texts.js';
import * as editorManager from './modules/editor/editor-manager.js';

// ========== State ==========
let currentLanguage = localStorage.getItem('language') || 'ko';
const languageSelect = document.getElementById('language');
const contentEl = document.getElementById('content');

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

function updateUITexts() {
  _updateUITexts(currentLanguage);
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
  // Init extracted modules
  const welcomeGetter = () => getWelcomeHTML(currentLanguage);

  initUITexts({ getWelcomeHTML: welcomeGetter, contentEl });

  editorManager.init({
    t,
    doRenderMarkdown,
  });

  // Theme system init (DOM refs)
  themeSystem.init({
    getDialogSave: fileOps.getDialogSave,
    getFsWriteTextFile: fileOps.getFsWriteTextFile,
    getTauriApi: fileOps.getTauriApi,
  });
  themeSystem.initStyles();

  // Tab manager init
  tabManager.init({
    getWelcomeHTML: welcomeGetter,
    renderHomeRecentFiles: fileOps.renderHomeRecentFiles,
    setEditorMode: editorManager.setEditorMode,
    applyTabZoom: zoom.applyTabZoom,
    updateExportButtons,
    renderMarkdown: (text, isNew) => doRenderMarkdown(text, isNew),
    getCurrentViewMode: zoom.getCurrentViewMode,
    loadEditorContent: editorManager.loadEditorContent,
    updateEditModeButtonsDisabled: editorManager.updateEditModeButtonsDisabled,
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
    saveCurrentFile: editorManager.saveCurrentFile,
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

// Start
init();
