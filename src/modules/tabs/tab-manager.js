/**
 * Tab Manager Module
 */

import { i18n } from '../../i18n.js';
import { getTocVisible, clearToc, setTocVisible } from '../toc/toc.js';
import { showNotification } from '../notification/notification.js';
import { eventBus, EVENTS } from '../../core/events.js';

export const HOME_TAB_ID = 'home';

let tabs = [];
let activeTabId = null;

let els = {};
let ctx = {};
let homeScrollTop = 0;

export function init(context) {
  els = {
    content: document.getElementById('content'),
    tabBar: document.getElementById('tab-bar'),
    tabsContainer: document.getElementById('tabs-container'),
  };
  ctx = context;
  activeTabId = HOME_TAB_ID;

  initScrollButtons();
}

export function getTabs() {
  return tabs;
}

export function getActiveTabId() {
  return activeTabId;
}

export function setActiveTabId(id) {
  activeTabId = id;
}

function generateTabId() {
  return 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export function createTab(name, filePath, content, options = {}) {
  const tabId = generateTabId();
  const tab = {
    id: tabId,
    name: name,
    filePath: filePath,
    content: content,
    originalContent: content,
    isDirty: false,
    editMode: 'view',
    tocVisible: false,
    zoom: 100,
    scrollTop: 0,
    readOnly: options.readOnly || false
  };
  tabs.push(tab);
  renderTabs();
  switchToTab(tabId);
  updateTabBarVisibility();

  if (filePath && filePath !== name) {
    ctx.startWatching?.(filePath, tabId);
  }

  ctx.saveSession?.();
  return tabId;
}

export function switchToTab(tabId) {
  // Hide search bar when switching tabs
  ctx.hideSearchBar?.();

  // 현재 탭의 상태 저장 (TOC, 스크롤 위치, 에디트 모드)
  if (activeTabId !== HOME_TAB_ID) {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) {
      currentTab.tocVisible = getTocVisible();
      currentTab.scrollTop = els.content.scrollTop;
      currentTab.editMode = ctx.getCurrentEditorMode?.() || currentTab.editMode || 'view';
    }
  } else {
    homeScrollTop = els.content.scrollTop;
  }

  if (tabId === HOME_TAB_ID) {
    activeTabId = HOME_TAB_ID;
    els.content.innerHTML = ctx.getWelcomeHTML();
    els.content.classList.remove('view-double');
    ctx.renderHomeRecentFiles?.();
    renderTabs();
    clearToc();
    ctx.setEditorMode?.('view');
    ctx.applyTabZoom?.(HOME_TAB_ID);
    ctx.updateExportButtons?.();
    ctx.saveSession?.();
    els.content.scrollTop = homeScrollTop;
    eventBus.emit(EVENTS.TAB_SWITCHED, { tabId: HOME_TAB_ID });
    return;
  }

  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  activeTabId = tabId;
  ctx.renderMarkdown?.(tab.content, false);
  if (ctx.getCurrentViewMode?.() === 'double') {
    els.content.classList.add('view-double');
  }
  renderTabs();

  // Scroll active tab into view
  const activeTabEl = els.tabsContainer.querySelector('.tab.active');
  if (activeTabEl) {
    activeTabEl.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
  }

  setTocVisible(tab.tocVisible || false);
  ctx.loadEditorContent?.(tab.content);

  if (tab.readOnly) {
    ctx.setEditorMode?.('view');
    ctx.updateEditModeButtonsDisabled?.(true);
  } else {
    ctx.setEditorMode?.(tab.editMode || 'view');
    ctx.updateEditModeButtonsDisabled?.(false);
  }

  ctx.applyTabZoom?.(tabId);
  ctx.updateExportButtons?.();
  ctx.saveSession?.();

  // 콘텐츠 스크롤 위치 복원
  els.content.scrollTop = tab.scrollTop || 0;

  eventBus.emit(EVENTS.TAB_SWITCHED, { tabId });
}

export function closeTab(tabId, event) {
  if (event) event.stopPropagation();
  if (tabId === HOME_TAB_ID) return;

  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;

  const tab = tabs[tabIndex];
  if (tab.isDirty) {
    const lang = i18n[ctx.getCurrentLanguage?.() || 'ko'];
    const confirmed = window.confirm(lang.confirmClose || '저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?');
    if (!confirmed) return;
  }

  if (tab.filePath && tab.filePath !== tab.name) {
    ctx.stopWatching?.(tab.filePath, tabId);
  }

  tabs.splice(tabIndex, 1);

  if (activeTabId === tabId) {
    if (tabs.length === 0) {
      switchToTab(HOME_TAB_ID);
    } else {
      const newIndex = Math.min(tabIndex, tabs.length - 1);
      switchToTab(tabs[newIndex].id);
    }
  }

  renderTabs();
  updateTabBarVisibility();
  ctx.saveSession?.();
}

export function renderTabs() {
  els.tabsContainer.innerHTML = '';

  // Home tab
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
  els.tabsContainer.appendChild(homeTabEl);

  // File tabs
  const t = i18n[ctx.getCurrentLanguage?.() || 'ko'] || {};
  tabs.forEach(tab => {
    const dirtyIndicator = tab.isDirty ? ' •' : '';
    const lockIcon = tab.readOnly ? '<svg class="tab-lock-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' : '';
    const keyBadge = tab.vmdKeyName ? `<span class="tab-key-badge" title="${tab.vmdKeyName}">${tab.vmdKeyName === 'default' ? (t.vmdKeyBuiltin || '내장키') : tab.vmdKeyName}</span>` : '';
    const tabEl = document.createElement('div');
    tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''} ${tab.isDirty ? 'dirty' : ''}`;
    tabEl.innerHTML = `
      <span class="tab-title" title="${tab.filePath || tab.name}">${tab.name}${dirtyIndicator}</span>${lockIcon}${keyBadge}
      <button class="tab-close" title="닫기">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    tabEl.querySelector('.tab-title').addEventListener('click', () => switchToTab(tab.id));
    tabEl.querySelector('.tab-close').addEventListener('click', (e) => closeTab(tab.id, e));
    els.tabsContainer.appendChild(tabEl);
  });

  updateScrollButtons();
}

function updateTabBarVisibility() {
  els.tabBar.classList.remove('hidden');
  els.content.classList.remove('no-tabs');
}

function initScrollButtons() {
  // Create left button
  const leftBtn = document.createElement('button');
  leftBtn.className = 'tab-scroll-btn hidden';
  leftBtn.innerHTML = '‹';
  leftBtn.title = 'Scroll left';
  leftBtn.addEventListener('click', () => {
    els.tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
  });

  // Create right button
  const rightBtn = document.createElement('button');
  rightBtn.className = 'tab-scroll-btn hidden';
  rightBtn.innerHTML = '›';
  rightBtn.title = 'Scroll right';
  rightBtn.addEventListener('click', () => {
    els.tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });
  });

  // Insert: [leftBtn] [tabsContainer] [rightBtn] inside tabBar
  els.tabBar.insertBefore(leftBtn, els.tabsContainer);
  els.tabBar.appendChild(rightBtn);

  els.scrollLeftBtn = leftBtn;
  els.scrollRightBtn = rightBtn;

  // Wheel event: convert vertical scroll to horizontal
  els.tabsContainer.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      els.tabsContainer.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // Scroll event: update button visibility
  els.tabsContainer.addEventListener('scroll', updateScrollButtons);

  // Resize observer
  const ro = new ResizeObserver(() => updateScrollButtons());
  ro.observe(els.tabsContainer);
}

function updateScrollButtons() {
  if (!els.scrollLeftBtn || !els.scrollRightBtn) return;
  const { scrollLeft, scrollWidth, clientWidth } = els.tabsContainer;
  const needsScroll = scrollWidth > clientWidth + 1;

  els.scrollLeftBtn.classList.toggle('hidden', !needsScroll || scrollLeft <= 0);
  els.scrollRightBtn.classList.toggle('hidden', !needsScroll || scrollLeft + clientWidth >= scrollWidth - 1);
}

export function pushTab(tab) {
  tabs.push(tab);
}
