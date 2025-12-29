/**
 * Search Manager - 검색 기능
 * Generates search bar HTML dynamically with i18n support
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id } from '../../core/dom.js';
import { escapeRegex, debounce } from '../../utils/helpers.js';
import { tabsManager } from '../tabs/tabs.js';
import { i18n } from '../../i18n.js';
import { ICONS } from '../../components/icons.js';

class SearchManager {
  constructor() {
    this.matches = [];
    this.currentIndex = -1;
    this.originalContent = '';
    this.isVisible = false;
    this.elements = {};
    this.searchTimeout = null;
  }

  get lang() {
    return i18n[store.get('language') || 'ko'];
  }

  init() {
    this.createSearchBar();
    this.cacheElements();
    this.setupEventListeners();
    this.setupSubscriptions();

    // Update on language change
    store.subscribe('language', () => this.updateTexts());
  }

  /**
   * Create search bar HTML
   */
  createSearchBar() {
    const searchBar = document.createElement('div');
    searchBar.id = 'search-bar';
    searchBar.className = 'hidden';
    searchBar.innerHTML = this.getSearchBarHTML();
    document.body.appendChild(searchBar);
  }

  /**
   * Get search bar HTML
   */
  getSearchBarHTML() {
    return `
      <div class="search-box">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" id="search-input" placeholder="${this.lang.searchPlaceholder}" />
        <span id="search-count" class="search-count"></span>
        <button id="search-prev" class="search-nav" title="${this.lang.searchPrev}">
          ${ICONS.chevronUp}
        </button>
        <button id="search-next" class="search-nav" title="${this.lang.searchNext}">
          ${ICONS.chevronDown}
        </button>
        <button id="search-close" class="search-nav" title="${this.lang.searchClose}">
          ${ICONS.closeSmall}
        </button>
      </div>
    `;
  }

  /**
   * Update texts when language changes
   */
  updateTexts() {
    const searchBar = $id('search-bar');
    if (searchBar) {
      const wasVisible = this.isVisible;
      const currentValue = this.elements.searchInput?.value || '';

      searchBar.innerHTML = this.getSearchBarHTML();
      this.cacheElements();
      this.setupEventListeners();

      if (wasVisible) {
        searchBar.classList.remove('hidden');
        if (currentValue) {
          this.elements.searchInput.value = currentValue;
        }
      }
    }
  }

  cacheElements() {
    this.elements = {
      searchBar: $id('search-bar'),
      searchInput: $id('search-input'),
      searchCount: $id('search-count'),
      searchPrev: $id('search-prev'),
      searchNext: $id('search-next'),
      searchClose: $id('search-close'),
      content: $id('content')
    };
  }

  setupEventListeners() {
    const { searchInput, searchPrev, searchNext, searchClose } = this.elements;

    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.perform(e.target.value);
      }, 200));

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
            this.prevMatch();
          } else {
            this.nextMatch();
          }
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.hide();
        }
      });
    }

    searchPrev?.addEventListener('click', () => this.prevMatch());
    searchNext?.addEventListener('click', () => this.nextMatch());
    searchClose?.addEventListener('click', () => this.hide());
  }

  setupSubscriptions() {
    eventBus.on(EVENTS.SEARCH_CLOSED, () => this.hide());
    eventBus.on(EVENTS.TAB_SWITCHED, () => this.clear());
  }

  perform(query) {
    this.clearHighlights();

    if (!query || query.trim() === '' || tabsManager.isHome()) {
      this.updateCount('');
      this.matches = [];
      this.currentIndex = -1;
      return;
    }

    const contentEl = this.elements.content;
    if (!contentEl) return;

    if (!this.originalContent) {
      this.originalContent = contentEl.innerHTML;
    }

    // 텍스트 노드 검색
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

    this.matches = [];
    const searchLower = query.toLowerCase();

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const textLower = text.toLowerCase();
      let index = 0;

      while ((index = textLower.indexOf(searchLower, index)) !== -1) {
        this.matches.push({
          node: textNode,
          index: index,
          length: query.length
        });
        index += query.length;
      }
    });

    if (this.matches.length > 0) {
      this.highlightMatches(query);
      this.currentIndex = 0;
      this.scrollToMatch(this.currentIndex);
      this.updateCount();
    } else {
      this.updateCount('0');
      this.currentIndex = -1;
    }

    eventBus.emit(EVENTS.SEARCH_PERFORMED, { query, count: this.matches.length });
  }

  highlightMatches(query) {
    const contentEl = this.elements.content;
    if (!contentEl) return;

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
    this.matches = Array.from(contentEl.querySelectorAll('.search-highlight'));
  }

  clearHighlights() {
    const contentEl = this.elements.content;
    if (!contentEl) return;

    const marks = contentEl.querySelectorAll('.search-highlight');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });

    const spans = contentEl.querySelectorAll('span:empty');
    spans.forEach(span => span.remove());

    this.matches = [];
    this.currentIndex = -1;
  }

  scrollToMatch(index) {
    if (index < 0 || index >= this.matches.length) return;

    this.matches.forEach(el => {
      if (el.classList) el.classList.remove('current');
    });

    const currentMatch = this.matches[index];
    if (currentMatch && currentMatch.classList) {
      currentMatch.classList.add('current');
      currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    this.updateCount();
    eventBus.emit(EVENTS.SEARCH_MATCH_CHANGED, { index, total: this.matches.length });
  }

  updateCount(text) {
    if (this.elements.searchCount) {
      if (text !== undefined) {
        this.elements.searchCount.textContent = text;
      } else if (this.matches.length === 0) {
        this.elements.searchCount.textContent = '0';
      } else {
        this.elements.searchCount.textContent = `${this.currentIndex + 1}/${this.matches.length}`;
      }
    }
  }

  prevMatch() {
    if (this.matches.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    this.scrollToMatch(this.currentIndex);
  }

  nextMatch() {
    if (this.matches.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this.scrollToMatch(this.currentIndex);
  }

  clear() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    this.clearHighlights();
    this.updateCount('');
    this.originalContent = '';
  }

  show() {
    this.isVisible = true;
    this.elements.searchBar?.classList.remove('hidden');
    this.updatePosition();
    this.elements.searchInput?.focus();
    this.elements.searchInput?.select();
    eventBus.emit(EVENTS.SEARCH_OPENED);
  }

  hide() {
    this.isVisible = false;
    this.elements.searchBar?.classList.add('hidden');
    this.clear();
    eventBus.emit(EVENTS.SEARCH_CLOSED);
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  updatePosition() {
    const tabs = tabsManager.getAllTabs();
    if (tabs.length === 0) {
      this.elements.searchBar?.classList.add('no-tabs');
    } else {
      this.elements.searchBar?.classList.remove('no-tabs');
    }
  }

  isSearchVisible() {
    return this.isVisible;
  }
}

export const searchManager = new SearchManager();
