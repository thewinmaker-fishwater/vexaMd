/**
 * Search Manager Module
 */

let searchMatches = [];
let currentMatchIndex = -1;
let originalContent = '';
let isSearchVisible = false;

let els = {};
let ctx = {};

export function init(context) {
  ctx = context || {};
  els = {
    searchBar: document.getElementById('search-bar'),
    searchInput: document.getElementById('search-input'),
    searchCount: document.getElementById('search-count'),
    searchPrev: document.getElementById('search-prev'),
    searchNext: document.getElementById('search-next'),
    searchClose: document.getElementById('search-close'),
    btnSearch: document.getElementById('btn-search'),
    content: document.getElementById('content'),
  };

  let searchTimeout;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const activeTabId = ctx.getActiveTabId ? ctx.getActiveTabId() : null;
      const homeTabId = ctx.HOME_TAB_ID || 'home';
      performSearch(e.target.value, activeTabId, homeTabId);
    }, 200);
  });

  els.searchInput.addEventListener('keydown', (e) => {
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

  els.searchPrev.addEventListener('click', searchPrevMatch);
  els.searchNext.addEventListener('click', searchNextMatch);
  els.searchClose.addEventListener('click', hideSearchBar);
  els.btnSearch.addEventListener('click', toggleSearchBar);
}

export function getIsSearchVisible() {
  return isSearchVisible;
}

export function performSearch(query, activeTabId, HOME_TAB_ID) {
  clearSearchHighlights();

  if (!query || query.trim() === '' || activeTabId === HOME_TAB_ID) {
    els.searchCount.textContent = '';
    searchMatches = [];
    currentMatchIndex = -1;
    return;
  }

  const contentEl = els.content;
  if (!contentEl) return;

  if (!originalContent) {
    originalContent = contentEl.innerHTML;
  }

  const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, null, false);
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
      searchMatches.push({ node: textNode, index: index, length: query.length });
      index += query.length;
    }
  });

  if (searchMatches.length > 0) {
    highlightMatches(query);
    currentMatchIndex = 0;
    scrollToMatch(currentMatchIndex);
    updateSearchCount();
  } else {
    els.searchCount.textContent = '0개';
    currentMatchIndex = -1;
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatches(query) {
  const contentEl = els.content;
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
  searchMatches = Array.from(contentEl.querySelectorAll('.search-highlight'));
}

function clearSearchHighlights() {
  const contentEl = els.content;
  if (!contentEl) return;

  const marks = contentEl.querySelectorAll('.search-highlight');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  const spans = contentEl.querySelectorAll('span:empty');
  spans.forEach(span => span.remove());

  searchMatches = [];
  currentMatchIndex = -1;
}

function scrollToMatch(index) {
  if (index < 0 || index >= searchMatches.length) return;
  searchMatches.forEach(el => {
    if (el.classList) el.classList.remove('current');
  });
  const currentMatch = searchMatches[index];
  if (currentMatch && currentMatch.classList) {
    currentMatch.classList.add('current');
    currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  updateSearchCount();
}

function updateSearchCount() {
  if (searchMatches.length === 0) {
    els.searchCount.textContent = '0개';
  } else {
    els.searchCount.textContent = `${currentMatchIndex + 1}/${searchMatches.length}`;
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
  els.searchInput.value = '';
  clearSearchHighlights();
  els.searchCount.textContent = '';
  originalContent = '';
}

export function showSearchBar(tabsCount) {
  isSearchVisible = true;
  els.searchBar.classList.remove('hidden');
  updateSearchBarPosition(tabsCount);
  els.searchInput.focus();
  els.searchInput.select();
}

export function hideSearchBar() {
  isSearchVisible = false;
  els.searchBar.classList.add('hidden');
  clearSearch();
}

export function toggleSearchBar(tabsCount) {
  if (isSearchVisible) {
    hideSearchBar();
  } else {
    showSearchBar(tabsCount);
  }
}

function updateSearchBarPosition(tabsCount) {
  if (!tabsCount || tabsCount === 0) {
    els.searchBar.classList.add('no-tabs');
  } else {
    els.searchBar.classList.remove('no-tabs');
  }
}
