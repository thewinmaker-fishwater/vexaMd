/**
 * Tabs Manager - 탭 관리
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id, createElement } from '../../core/dom.js';
import { generateId } from '../../utils/helpers.js';

export const HOME_TAB_ID = 'home';

class TabsManager {
  constructor() {
    this.tabs = [];
    this.activeTabId = HOME_TAB_ID;
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.activeTabId = HOME_TAB_ID;
    this.updateVisibility();
    this.render();
  }

  cacheElements() {
    this.elements = {
      tabBar: $id('tab-bar'),
      tabsContainer: $id('tabs-container'),
      content: $id('content')
    };
  }

  generateTabId() {
    return 'tab-' + generateId();
  }

  create(name, filePath, content) {
    const tabId = this.generateTabId();
    const tab = {
      id: tabId,
      name: name,
      filePath: filePath,
      content: content
    };

    this.tabs.push(tab);
    this.render();
    this.switchTo(tabId);
    this.updateVisibility();

    eventBus.emit(EVENTS.TAB_CREATED, tab);
    return tabId;
  }

  switchTo(tabId) {
    // 검색바 닫기
    eventBus.emit(EVENTS.SEARCH_CLOSED);

    if (tabId === HOME_TAB_ID) {
      this.activeTabId = HOME_TAB_ID;
      eventBus.emit(EVENTS.TAB_SWITCHED, { tabId: HOME_TAB_ID, isHome: true });
      this.render();
      return;
    }

    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    this.activeTabId = tabId;
    eventBus.emit(EVENTS.TAB_SWITCHED, { tabId, tab, isHome: false });
    this.render();
  }

  close(tabId, event) {
    if (event) {
      event.stopPropagation();
    }

    if (tabId === HOME_TAB_ID) return;

    const tabIndex = this.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const closedTab = this.tabs[tabIndex];
    this.tabs.splice(tabIndex, 1);

    if (this.activeTabId === tabId) {
      if (this.tabs.length === 0) {
        this.switchTo(HOME_TAB_ID);
      } else {
        const newIndex = Math.min(tabIndex, this.tabs.length - 1);
        this.switchTo(this.tabs[newIndex].id);
      }
    }

    this.render();
    this.updateVisibility();
    eventBus.emit(EVENTS.TAB_CLOSED, closedTab);
  }

  getActiveTab() {
    if (this.activeTabId === HOME_TAB_ID) {
      return { id: HOME_TAB_ID, isHome: true };
    }
    return this.tabs.find(t => t.id === this.activeTabId) || null;
  }

  getTabByPath(filePath) {
    return this.tabs.find(t => t.filePath === filePath);
  }

  isHome() {
    return this.activeTabId === HOME_TAB_ID;
  }

  getActiveTabId() {
    return this.activeTabId;
  }

  getAllTabs() {
    return [...this.tabs];
  }

  render() {
    if (!this.elements.tabsContainer) return;

    this.elements.tabsContainer.innerHTML = '';

    // 홈 탭
    const homeTabEl = createElement('div', {
      className: `tab ${this.activeTabId === HOME_TAB_ID ? 'active' : ''}`,
      html: `
        <svg class="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span class="tab-title">홈</span>
      `,
      events: {
        click: () => this.switchTo(HOME_TAB_ID)
      }
    });
    this.elements.tabsContainer.appendChild(homeTabEl);

    // 파일 탭들
    this.tabs.forEach(tab => {
      const tabEl = createElement('div', {
        className: `tab ${tab.id === this.activeTabId ? 'active' : ''}`,
        html: `
          <span class="tab-title" title="${tab.filePath || tab.name}">${tab.name}</span>
          <button class="tab-close" title="닫기">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        `
      });

      tabEl.querySelector('.tab-title').addEventListener('click', () => this.switchTo(tab.id));
      tabEl.querySelector('.tab-close').addEventListener('click', (e) => this.close(tab.id, e));

      this.elements.tabsContainer.appendChild(tabEl);
    });
  }

  updateVisibility() {
    if (this.elements.tabBar) {
      this.elements.tabBar.classList.remove('hidden');
    }
    if (this.elements.content) {
      this.elements.content.classList.remove('no-tabs');
    }
  }

  nextTab() {
    const allTabIds = [HOME_TAB_ID, ...this.tabs.map(t => t.id)];
    const currentIndex = allTabIds.indexOf(this.activeTabId);
    const nextIndex = (currentIndex + 1) % allTabIds.length;
    this.switchTo(allTabIds[nextIndex]);
  }

  prevTab() {
    const allTabIds = [HOME_TAB_ID, ...this.tabs.map(t => t.id)];
    const currentIndex = allTabIds.indexOf(this.activeTabId);
    const prevIndex = (currentIndex - 1 + allTabIds.length) % allTabIds.length;
    this.switchTo(allTabIds[prevIndex]);
  }
}

export const tabsManager = new TabsManager();
