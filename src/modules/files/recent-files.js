/**
 * Recent Files Manager - 최근 파일 관리
 * Generates dropdown HTML dynamically with i18n support
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id, createElement, positionBelow } from '../../core/dom.js';
import { fileHandler } from './file-handler.js';
import { i18n } from '../../i18n.js';
import { ICONS } from '../../components/icons.js';

const MAX_RECENT_FILES = 10;

class RecentFilesManager {
  constructor() {
    this.files = [];
    this.elements = {};
  }

  get lang() {
    return i18n[store.get('language') || 'ko'];
  }

  init() {
    this.createDropdown();
    this.cacheElements();
    this.loadFromStorage();
    this.setupEventListeners();
    this.render();

    // Update on language change
    store.subscribe('language', () => this.updateTexts());
  }

  /**
   * Create dropdown HTML
   */
  createDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'recent-dropdown';
    dropdown.className = 'dropdown hidden';
    dropdown.innerHTML = this.getDropdownHTML();
    document.body.appendChild(dropdown);
  }

  /**
   * Get dropdown HTML
   */
  getDropdownHTML() {
    return `
      <div class="dropdown-header" data-i18n="recentFiles">${this.lang.recentFiles}</div>
      <div id="recent-list"></div>
      <div class="dropdown-empty" id="recent-empty" data-i18n="recentEmpty">${this.lang.recentEmpty}</div>
      <button id="clear-recent" class="dropdown-btn" data-i18n="clearList">${this.lang.clearList}</button>
    `;
  }

  /**
   * Update texts when language changes
   */
  updateTexts() {
    const dropdown = $id('recent-dropdown');
    if (dropdown) {
      const wasHidden = dropdown.classList.contains('hidden');
      dropdown.innerHTML = this.getDropdownHTML();
      this.cacheElements();
      this.setupEventListeners();
      this.render();
      if (wasHidden) {
        dropdown.classList.add('hidden');
      }
    }
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
          <button class="recent-item-remove" title="${this.lang.removeFromList}">
            ${ICONS.remove}
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
          ${ICONS.markdown}
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
