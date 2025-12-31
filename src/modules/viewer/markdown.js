/**
 * Markdown Viewer - 마크다운 렌더링 및 페이징
 */

import { marked } from 'marked';
import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id } from '../../core/dom.js';
import { i18n } from '../../i18n.js';
import { tabsManager, HOME_TAB_ID } from '../tabs/tabs.js';

// Marked 설정
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
});

class MarkdownViewer {
  constructor() {
    this.pages = [];
    this.currentPage = 0;
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupSubscriptions();
  }

  cacheElements() {
    this.elements = {
      content: $id('content')
    };
  }

  setupSubscriptions() {
    eventBus.on(EVENTS.TAB_SWITCHED, (data) => {
      if (data.isHome) {
        this.showHome();
      } else if (data.tab) {
        this.render(data.tab.content, false);
      }
    });

    eventBus.on(EVENTS.VIEW_MODE_CHANGED, () => {
      if (!tabsManager.isHome() && this.pages.length > 0) {
        this.renderPages();
      }
    });

    eventBus.on(EVENTS.LANGUAGE_CHANGED, () => {
      if (tabsManager.isHome()) {
        this.showHome();
      } else if (this.pages.length > 0) {
        this.renderPages();
      }
    });
  }

  render(text, isNewFile = true) {
    const startTime = performance.now();

    try {
      const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const pageTexts = normalizedText.split(/\n\s*-{3,}\s*\n|\n\s*-{3,}\s*$|^\s*-{3,}\s*\n/);
      this.pages = pageTexts.filter(p => p.trim()).map(p => marked.parse(p));

      if (isNewFile) {
        this.currentPage = 0;
      }

      this.renderPages();

      const elapsed = (performance.now() - startTime).toFixed(1);
      console.log(`Rendered ${this.pages.length} pages in ${elapsed}ms`);

      eventBus.emit(EVENTS.CONTENT_RENDERED, { pages: this.pages.length });
    } catch (error) {
      this.showError('Markdown 파싱 오류', error.message);
    }
  }

  renderPages() {
    const content = this.elements.content;
    if (!content) return;

    content.classList.add('markdown-body');
    const viewMode = store.get('viewMode') || 'single';
    const lang = i18n[store.get('language') || 'ko'];

    if (viewMode === 'single') {
      const allContent = this.pages.join('<hr class="page-break">');
      content.innerHTML = `<div class="markdown-content-wrapper">${allContent}</div>`;
    } else if (viewMode === 'double') {
      let doubleContent = '';
      for (let i = 0; i < this.pages.length; i += 2) {
        const leftPage = this.pages[i] || '';
        const rightPage = this.pages[i + 1] || '';
        doubleContent += `
          <div class="double-page-row">
            <div class="page-left">${leftPage}</div>
            <div class="page-right">${rightPage}</div>
          </div>
        `;
        if (i + 2 < this.pages.length) {
          doubleContent += '<hr class="page-break">';
        }
      }
      content.innerHTML = `<div class="markdown-content-wrapper double-scroll-view">${doubleContent}</div>`;
    } else if (viewMode === 'paging') {
      const totalPages = this.pages.length;
      const currentDisplay = this.currentPage + 1;

      if (totalPages <= 1) {
        content.innerHTML = `<div class="markdown-content-wrapper">${this.pages[0] || ''}</div>`;
      } else {
        content.innerHTML = `
          <div class="markdown-content-wrapper paging-view">
            ${this.pages[this.currentPage] || ''}
          </div>
          <div class="page-nav">
            <button id="page-prev" class="page-nav-btn" ${this.currentPage === 0 ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div class="page-indicator-group">
              <input type="number" id="page-input" class="page-input" value="${currentDisplay}" min="1" max="${totalPages}" />
              <span class="page-total">/ ${totalPages}</span>
            </div>
            <button id="page-next" class="page-nav-btn" ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        `;

        this.setupPageNavigation();
      }
    } else {
      const allContent = this.pages.join('<hr class="page-break">');
      content.innerHTML = `<div class="markdown-content-wrapper">${allContent}</div>`;
    }
  }

  setupPageNavigation() {
    const prevBtn = $id('page-prev');
    const nextBtn = $id('page-next');
    const pageInput = $id('page-input');

    prevBtn?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    nextBtn?.addEventListener('click', () => this.goToPage(this.currentPage + 1));

    if (pageInput) {
      pageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const targetPage = parseInt(pageInput.value) - 1;
          this.goToPage(targetPage);
        }
      });
      pageInput.addEventListener('blur', () => {
        const targetPage = parseInt(pageInput.value) - 1;
        this.goToPage(targetPage);
      });
    }
  }

  goToPage(pageNum) {
    if (pageNum < 0) pageNum = 0;
    if (pageNum >= this.pages.length) pageNum = this.pages.length - 1;

    this.currentPage = pageNum;
    this.renderPages();
    this.elements.content.scrollTop = 0;

    eventBus.emit(EVENTS.PAGE_CHANGED, { page: pageNum, total: this.pages.length });
  }

  showHome() {
    const content = this.elements.content;
    if (!content) return;

    content.innerHTML = this.getWelcomeHTML();
    content.classList.remove('view-double');
    eventBus.emit(EVENTS.CONTENT_RENDERED, { isHome: true });
  }

  getWelcomeHTML() {
    const lang = i18n[store.get('language') || 'ko'];
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

  showError(title, message) {
    const content = this.elements.content;
    if (content) {
      content.innerHTML = `
        <div class="welcome" style="color: var(--accent);">
          <h2>${title}</h2>
          <p>${message}</p>
        </div>
      `;
    }
  }

  getPages() {
    return this.pages;
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getPageCount() {
    return this.pages.length;
  }
}

export const markdownViewer = new MarkdownViewer();
