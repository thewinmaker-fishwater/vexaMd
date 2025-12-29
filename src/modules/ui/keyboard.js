/**
 * Keyboard Handler - 키보드 단축키 처리
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { $id, hide } from '../../core/dom.js';
import { themeManager } from '../theme/theme-manager.js';
import { themeEditor } from '../theme/theme-editor.js';
import { tabsManager } from '../tabs/tabs.js';
import { searchManager } from '../search/search.js';
import { markdownViewer } from '../viewer/markdown.js';
import { presentationMode } from '../viewer/presentation.js';
import { fileHandler } from '../files/file-handler.js';
import { recentFilesManager } from '../files/recent-files.js';
import { viewModeManager } from './view-mode.js';
import { zoomManager } from './zoom.js';
import { helpMenu } from './help-menu.js';

class KeyboardHandler {
  constructor() {
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupKeyboard();
    this.setupWheelZoom();
    this.setupClickOutside();
  }

  cacheElements() {
    this.elements = {
      aboutModal: $id('about-modal'),
      shortcutsModal: $id('shortcuts-modal')
    };
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  handleKeydown(e) {
    // 프레젠테이션 모드 키보드 처리
    if (presentationMode.handleKeydown(e)) {
      return;
    }

    // F5: 프레젠테이션 시작
    if (e.key === 'F5') {
      e.preventDefault();
      presentationMode.start();
      return;
    }

    // Ctrl+O: 파일 열기
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      fileHandler.openFile();
      return;
    }

    // Ctrl+D: 테마 토글
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      themeManager.toggle();
      return;
    }

    // Ctrl+E: 테마 내보내기
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      themeEditor.export();
      return;
    }

    // Ctrl+P: 인쇄
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      this.print();
      return;
    }

    // Ctrl++: 줌 인
    if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      zoomManager.zoomIn();
      return;
    }

    // Ctrl+-: 줌 아웃
    if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      zoomManager.zoomOut();
      return;
    }

    // Ctrl+0: 줌 리셋
    if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      zoomManager.reset();
      return;
    }

    // Ctrl+F: 검색 토글
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      searchManager.toggle();
      return;
    }

    // Ctrl+W: 현재 탭 닫기
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      const activeId = tabsManager.getActiveTabId();
      if (activeId) {
        tabsManager.close(activeId);
      }
      return;
    }

    // Escape: 모달/드롭다운 닫기 또는 홈으로
    if (e.key === 'Escape') {
      e.preventDefault();
      this.handleEscape();
      return;
    }

    // Ctrl+Tab: 다음 탭
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      tabsManager.nextTab();
      return;
    }

    // 방향키로 페이지 이동 (페이징 모드에서만)
    if (!searchManager.isSearchVisible() &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA') {
      const viewMode = store.get('viewMode');
      if (viewMode === 'paging' && markdownViewer.getPageCount() > 1) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          markdownViewer.goToPage(markdownViewer.getCurrentPage() - 1);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          markdownViewer.goToPage(markdownViewer.getCurrentPage() + 1);
          return;
        }
      }
    }
  }

  handleEscape() {
    recentFilesManager.hideDropdown();
    helpMenu.hideDropdown();

    if (this.elements.aboutModal && !this.elements.aboutModal.classList.contains('hidden')) {
      helpMenu.closeAboutModal();
    } else if (this.elements.shortcutsModal && !this.elements.shortcutsModal.classList.contains('hidden')) {
      helpMenu.closeShortcutsModal();
    } else if (searchManager.isSearchVisible()) {
      searchManager.hide();
    } else {
      tabsManager.switchTo('home');
    }
  }

  setupWheelZoom() {
    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomManager.zoomIn();
        } else {
          zoomManager.zoomOut();
        }
      }
    }, { passive: false });
  }

  setupClickOutside() {
    document.addEventListener('click', (e) => {
      const recentDropdown = $id('recent-dropdown');
      const btnRecent = $id('btn-recent');
      const helpDropdown = $id('help-dropdown');
      const btnHelp = $id('btn-help');

      if (recentDropdown && btnRecent) {
        if (!recentDropdown.contains(e.target) && !btnRecent.contains(e.target)) {
          recentFilesManager.hideDropdown();
        }
      }

      if (helpDropdown && btnHelp) {
        if (!helpDropdown.contains(e.target) && !btnHelp.contains(e.target)) {
          helpMenu.hideDropdown();
        }
      }
    });
  }

  print() {
    if (tabsManager.getAllTabs().length === 0) {
      eventBus.emit(EVENTS.NOTIFICATION_SHOWN, '인쇄할 문서가 없습니다.');
      return;
    }
    window.print();
  }
}

export const keyboardHandler = new KeyboardHandler();
