/**
 * UI Texts - i18n-based UI text updater
 * Extracted from main.js updateUITexts()
 */

import { i18n } from '../../i18n.js';
import { updateTocTexts } from '../toc/toc.js';
import * as tabManager from '../tabs/tab-manager.js';
import * as zoom from '../zoom/zoom-manager.js';
import * as imageModal from '../image-modal/image-modal.js';
import * as renderer from '../markdown/renderer.js';
import * as fileOps from '../files/file-ops.js';

let _getWelcomeHTML = null;
let _contentEl = null;

export function initUITexts({ getWelcomeHTML, contentEl }) {
  _getWelcomeHTML = getWelcomeHTML;
  _contentEl = contentEl;
}

export function updateUITexts(currentLanguage) {
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
  document.getElementById('btn-help').title = lang.help;
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

  document.getElementById('language').title = lang.language;
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
    _contentEl.innerHTML = _getWelcomeHTML();
    fileOps.renderHomeRecentFiles();
  }
  if (tabManager.getActiveTabId() !== tabManager.HOME_TAB_ID && renderer.getPages().length > 0) {
    renderer.renderPages(_contentEl, {
      currentViewMode: zoom.getCurrentViewMode(),
      currentLanguage,
      attachImageClickListeners: imageModal.attachImageClickListeners,
    });
  }
  updateTocTexts();
}
