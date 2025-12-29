/**
 * Recent Files Manager - 최근 파일 관리
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id, createElement, positionBelow } from '../../core/dom.js';
import { fileHandler } from './file-handler.js';

const MAX_RECENT_FILES = 10;

class RecentFilesManager {
  constructor() {
    this.files = [];
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.loadFromStorage();
    this.setupEventListeners();
    this.render();
    this.renderHomeList();
  }

  cacheElements() {
    this.elements = {
      dropdown: $id('recent-dropdown'),
      list: $id('recent-list'),
      empty: $id('recent-empty'),
      clearBtn: $id('clear-recent'),
      btnRecent: $id('btn-recent'),
      homeList: $id('home-recent-list'),
      homeSection: $id('home-recent')
    };
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('recentFiles');
      this.files = saved ? JSON.parse(saved) : [];
    } catch {
      this.files = [];
    }
  }

  saveToStorage() {
    localStorage.setItem('recentFiles', JSON.stringify(this.files));
  }

  setupEventListeners() {
    this.elements.clearBtn?.addEventListener('click', () => this.clear());

    eventBus.on(EVENTS.TAB_SWITCHED, (data) => {
      if (data.isHome) {
        this.renderHomeList();
      }
    });

    eventBus.on(EVENTS.CONTENT_RENDERED, (data) => {
      if (data.isHome) {
        this.renderHomeList();
      }
    });
  }

  add(name, filePath) {
    this.files = this.files.filter(f => f.path !== filePath);

    this.files.unshift({
      name: name,
      path: filePath,
      openedAt: Date.now()
    });

    if (this.files.length > MAX_RECENT_FILES) {
      this.files = this.files.slice(0, MAX_RECENT_FILES);
    }

    this.saveToStorage();
    this.render();
    this.renderHomeList();

    eventBus.emit(EVENTS.RECENT_FILES_UPDATED, this.files);
  }

  remove(filePath) {
    this.files = this.files.filter(f => f.path !== filePath);
    this.saveToStorage();
    this.render();
    this.renderHomeList();
  }

  clear() {
    this.files = [];
    this.saveToStorage();
    this.render();
    this.renderHomeList();
    this.hideDropdown();
  }

  render() {
    const { list, empty, clearBtn } = this.elements;
    if (!list) return;

    list.innerHTML = '';

    if (this.files.length === 0) {
      if (empty) empty.style.display = 'block';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'block';

    this.files.forEach(file => {
      const item = createElement('div', {
        className: 'recent-item',
        html: `
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
        `
      });

      item.querySelector('.recent-item-content').addEventListener('click', () => {
        this.hideDropdown();
        fileHandler.loadFile(file.path);
      });

      item.querySelector('.recent-item-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        this.remove(file.path);
      });

      list.appendChild(item);
    });
  }

  renderHomeList() {
    const { homeList, homeSection } = this.elements;

    // 동적으로 다시 찾기 (홈 화면이 다시 렌더링될 수 있으므로)
    const actualHomeList = $id('home-recent-list');
    const actualHomeSection = $id('home-recent');

    if (!actualHomeList || !actualHomeSection) return;

    if (this.files.length === 0) {
      actualHomeSection.style.display = 'none';
      return;
    }

    actualHomeSection.style.display = 'block';
    actualHomeList.innerHTML = '';

    this.files.slice(0, 5).forEach(file => {
      const item = createElement('div', {
        className: 'home-recent-item',
        html: `
          <svg class="home-recent-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div class="home-recent-info">
            <div class="home-recent-name">${file.name}</div>
            <div class="home-recent-path">${file.path}</div>
          </div>
        `,
        events: {
          click: () => fileHandler.loadFile(file.path)
        }
      });

      actualHomeList.appendChild(item);
    });
  }

  toggleDropdown() {
    if (this.elements.dropdown?.classList.contains('hidden')) {
      this.showDropdown();
    } else {
      this.hideDropdown();
    }
  }

  showDropdown() {
    this.render();
    this.elements.dropdown?.classList.remove('hidden');

    if (this.elements.btnRecent && this.elements.dropdown) {
      positionBelow(this.elements.dropdown, this.elements.btnRecent);
    }

    eventBus.emit(EVENTS.DROPDOWN_OPENED, 'recent');
  }

  hideDropdown() {
    this.elements.dropdown?.classList.add('hidden');
    eventBus.emit(EVENTS.DROPDOWN_CLOSED, 'recent');
  }

  getFiles() {
    return [...this.files];
  }
}

export const recentFilesManager = new RecentFilesManager();
