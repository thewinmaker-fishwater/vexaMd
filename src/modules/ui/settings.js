/**
 * Settings Manager - 설정 관리 (폰트, 콘텐츠 너비, 언어)
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id, $, $$ } from '../../core/dom.js';
import { i18n } from '../../i18n.js';

class SettingsManager {
  constructor() {
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.applyInitialSettings();
  }

  cacheElements() {
    this.elements = {
      fontFamily: $id('font-family'),
      fontSize: $id('font-size'),
      contentWidth: $id('content-width'),
      language: $id('language')
    };
  }

  setupEventListeners() {
    this.elements.fontFamily?.addEventListener('change', (e) => {
      this.applyFontFamily(e.target.value);
    });

    this.elements.fontSize?.addEventListener('change', (e) => {
      this.applyFontSize(e.target.value);
    });

    this.elements.contentWidth?.addEventListener('change', (e) => {
      this.applyContentWidth(e.target.value);
    });

    this.elements.language?.addEventListener('change', (e) => {
      this.applyLanguage(e.target.value);
    });
  }

  applyInitialSettings() {
    const fontFamily = store.get('fontFamily') || 'system';
    const fontSize = store.get('fontSize') || 'medium';
    const contentWidth = store.get('contentWidth') || 'narrow';
    const language = store.get('language') || 'ko';

    this.applyFontFamily(fontFamily);
    this.applyFontSize(fontSize);
    this.applyContentWidth(contentWidth);
    this.applyLanguage(language);
  }

  applyFontFamily(family) {
    document.documentElement.setAttribute('data-font-family', family);
    store.set('fontFamily', family);
    if (this.elements.fontFamily) {
      this.elements.fontFamily.value = family;
    }
  }

  applyFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
    store.set('fontSize', size);
    if (this.elements.fontSize) {
      this.elements.fontSize.value = size;
    }
  }

  applyContentWidth(width) {
    document.documentElement.setAttribute('data-content-width', width);
    store.set('contentWidth', width);
    if (this.elements.contentWidth) {
      this.elements.contentWidth.value = width;
    }
  }

  applyLanguage(lang) {
    store.set('language', lang);
    if (this.elements.language) {
      this.elements.language.value = lang;
    }
    this.updateUITexts();
    eventBus.emit(EVENTS.LANGUAGE_CHANGED, lang);
  }

  updateUITexts() {
    const lang = i18n[store.get('language') || 'ko'];

    // 툴바 버튼
    this.setTitle('btn-home', lang.homeTooltip);
    this.setTitle('btn-open', lang.openFile);
    this.setTitle('btn-recent', lang.recentFiles);
    this.setTitle('btn-theme', lang.toggleTheme);
    this.setTitle('btn-customize', lang.themeCustomizer);
    this.setTitle('btn-print', lang.print);
    this.setTitle('btn-search', lang.search);
    this.setTitle('btn-view-single', lang.viewSingle);
    this.setTitle('btn-view-double', lang.viewDouble);
    this.setTitle('btn-view-paging', lang.viewPaging);
    this.setTitle('btn-zoom-in', lang.zoomIn);
    this.setTitle('btn-zoom-out', lang.zoomOut);
    this.setTitle('btn-zoom-reset', lang.zoomReset);
    this.setTitle('btn-presentation', lang.presentation);
    this.setTitle('btn-help', lang.help);
    this.setTitle('zoom-level', lang.zoomRatio);

    // 검색바
    this.setPlaceholder('search-input', lang.searchPlaceholder);
    this.setTitle('search-prev', lang.searchPrev);
    this.setTitle('search-next', lang.searchNext);
    this.setTitle('search-close', lang.searchClose);

    // 최근 파일 드롭다운
    this.setText('recent-empty', lang.recentEmpty);
    this.setText('clear-recent', lang.clearList);
    this.setTextBySelector('.dropdown-header', lang.recentFiles);

    // 드롭 오버레이
    this.setTextBySelector('.drop-message', lang.dropMessage);

    // 셀렉트 옵션 업데이트
    this.updateSelectOptions('color-theme', {
      'default': lang.themeDefault,
      'purple': lang.themePurple,
      'ocean': lang.themeOcean,
      'sunset': lang.themeSunset,
      'forest': lang.themeForest,
      'rose': lang.themeRose,
      'custom': lang.themeCustom
    });

    this.updateSelectOptions('font-family', {
      'system': lang.fontSystem,
      'malgun': lang.fontMalgun,
      'nanum': lang.fontNanum,
      'pretendard': lang.fontPretendard,
      'noto': lang.fontNoto
    });

    this.updateSelectOptions('font-size', {
      'small': lang.fontSmall,
      'medium': lang.fontMedium,
      'large': lang.fontLarge,
      'xlarge': lang.fontXlarge
    });

    this.updateSelectOptions('content-width', {
      'narrow': lang.widthNarrow,
      'medium': lang.widthMedium,
      'wide': lang.widthWide,
      'full': lang.widthFull
    });

    // 도움말 메뉴
    this.setTextBySelector('#help-shortcuts span', lang.shortcuts);
    this.setTextBySelector('#help-about span', lang.about);

    // 프레젠테이션 컨트롤
    this.setTitle('pres-prev', lang.prevSlide);
    this.setTitle('pres-next', lang.nextSlide);
    this.setTitle('pres-exit', lang.exitPresentation);

    // 정보 모달
    this.setTextBySelector('#about-modal .modal-header h2', lang.aboutTitle);
    this.setTextBySelector('.about-version', `${lang.version} 1.0.0`);
    this.setTextBySelector('.about-description', lang.welcomeSubtitle);

    const aboutInfoPs = $$('.about-info p');
    if (aboutInfoPs.length >= 3) {
      aboutInfoPs[0].innerHTML = `<strong>${lang.developer}</strong>: Seven Peaks Software`;
      aboutInfoPs[1].innerHTML = `<strong>${lang.technology}</strong>: Tauri 2.x + Vanilla JavaScript`;
      aboutInfoPs[2].innerHTML = `<strong>${lang.license}</strong>: Apache 2.0`;
    }
    this.setText('about-ok', lang.confirm);

    // 단축키 모달
    this.setTextBySelector('#shortcuts-modal .modal-header h2', lang.shortcutsTitle);
    const shortcutSections = $$('.shortcuts-section h4');
    if (shortcutSections.length >= 3) {
      shortcutSections[0].textContent = lang.shortcutFile;
      shortcutSections[1].textContent = lang.shortcutView;
      shortcutSections[2].textContent = lang.shortcutNav;
    }

    const shortcutItems = $$('.shortcut-item span');
    const shortcutTexts = [
      lang.scOpenFile, lang.scCloseTab, lang.scPrint, lang.scHome,
      lang.scToggleTheme, lang.scZoomIn, lang.scZoomOut, lang.scZoomReset,
      lang.scSearch, lang.scPageNav, lang.scNextTab, lang.scPresentation
    ];
    shortcutItems.forEach((item, idx) => {
      if (shortcutTexts[idx]) item.textContent = shortcutTexts[idx];
    });
    this.setText('shortcuts-ok', lang.confirm);

    // 테마 편집기 모달
    this.setTextBySelector('#theme-editor-modal .modal-header h2', lang.themeEditorTitle);
    const editorTabs = $$('.editor-tab');
    if (editorTabs.length >= 2) {
      editorTabs[0].textContent = lang.tabUIEditor;
      editorTabs[1].textContent = lang.tabCSSEditor;
    }

    // 테마 편집기 섹션
    const sectionTitles = $$('.editor-section h3');
    const sectionTexts = [
      lang.sectionColors, lang.sectionFont, lang.sectionCode, lang.sectionBlockquote,
      lang.sectionTable, lang.sectionHeadings, lang.sectionTextMark, lang.sectionToolbar
    ];
    sectionTitles.forEach((title, idx) => {
      if (sectionTexts[idx]) title.textContent = sectionTexts[idx];
    });

    // 테마 편집기 레이블
    const labels = $$('.editor-field label');
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

    // CSS 편집기 정보
    this.setTextBySelector('.css-editor-info p', lang.cssEditorInfo);

    // 테마 편집기 버튼
    this.setText('theme-reset', lang.reset);
    this.setText('theme-import', lang.import);
    this.setText('theme-export', lang.export);
    this.setText('theme-cancel', lang.cancel);
    this.setText('theme-preview', lang.preview);
    this.setText('theme-apply', lang.apply);
  }

  setTitle(id, title) {
    const el = $id(id);
    if (el && title) el.title = title;
  }

  setPlaceholder(id, placeholder) {
    const el = $id(id);
    if (el && placeholder) el.placeholder = placeholder;
  }

  setText(id, text) {
    const el = $id(id);
    if (el && text) el.textContent = text;
  }

  setTextBySelector(selector, text) {
    const el = $(selector);
    if (el && text) el.textContent = text;
  }

  updateSelectOptions(id, options) {
    const select = $id(id);
    if (!select) return;

    Object.entries(options).forEach(([value, text]) => {
      const option = select.querySelector(`[value="${value}"]`);
      if (option && text) option.textContent = text;
    });
  }
}

export const settingsManager = new SettingsManager();
