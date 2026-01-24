/**
 * Markdown Editor - 마크다운 편집 기능
 */

import { eventBus, EVENTS } from '../../core/events.js';
import { tabsManager } from '../tabs/tabs.js';
import { fileHandler } from '../files/file-handler.js';
import { marked } from 'marked';

class MarkdownEditor {
  constructor() {
    this.elements = {};
    this.currentMode = 'view';
    this.debounceTimer = null;
    this.DEBOUNCE_DELAY = 300;
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.setupEventListeners();
  }

  cacheElements() {
    this.elements = {
      editorPane: document.getElementById('editor-pane'),
      editorTextarea: document.getElementById('markdown-editor'),
      content: document.getElementById('content'),
      mainContainer: document.getElementById('main-container'),
      btnView: document.getElementById('btn-mode-view'),
      btnEdit: document.getElementById('btn-mode-edit'),
      btnSplit: document.getElementById('btn-mode-split'),
      btnSave: document.getElementById('btn-save')
    };
  }

  bindEvents() {
    // 에디터 입력 이벤트
    if (this.elements.editorTextarea) {
      this.elements.editorTextarea.addEventListener('input', () => this.onEditorInput());
    }

    // 모드 버튼 이벤트
    if (this.elements.btnView) {
      this.elements.btnView.addEventListener('click', () => this.setMode('view'));
    }
    if (this.elements.btnEdit) {
      this.elements.btnEdit.addEventListener('click', () => this.setMode('edit'));
    }
    if (this.elements.btnSplit) {
      this.elements.btnSplit.addEventListener('click', () => this.setMode('split'));
    }
    if (this.elements.btnSave) {
      this.elements.btnSave.addEventListener('click', () => this.save());
    }
  }

  setupEventListeners() {
    // 탭 전환 시 에디터 상태 복원
    eventBus.on(EVENTS.TAB_SWITCHED, ({ tabId, tab, isHome }) => {
      if (isHome) {
        this.setMode('view');
        this.hideEditor();
        return;
      }

      if (tab) {
        this.loadContent(tab.content);
        this.setMode(tab.editMode || 'view');
      }
    });

    // 파일 로드 시 에디터 초기화
    eventBus.on(EVENTS.FILE_LOADED, () => {
      const tab = tabsManager.getActiveTab();
      if (tab && !tab.isHome) {
        this.loadContent(tab.content);
      }
    });
  }

  setMode(mode) {
    if (!this.elements.editorPane || !this.elements.content) return;

    this.currentMode = mode;
    const activeTab = tabsManager.getActiveTab();

    // 홈 탭이면 항상 view 모드
    if (activeTab?.isHome) {
      mode = 'view';
    }

    // 탭의 editMode 업데이트
    if (activeTab && !activeTab.isHome) {
      tabsManager.setEditMode(activeTab.id, mode);
    }

    // UI 업데이트
    this.updateModeButtons(mode);

    // 메인 컨테이너 모드 클래스 설정
    this.elements.mainContainer?.classList.remove('mode-view', 'mode-edit', 'mode-split');
    this.elements.mainContainer?.classList.add(`mode-${mode}`);

    switch (mode) {
      case 'view':
        this.hideEditor();
        this.elements.content.classList.remove('hidden');
        break;

      case 'edit':
        this.showEditor();
        this.elements.content.classList.add('hidden');
        break;

      case 'split':
        this.showEditor();
        this.elements.content.classList.remove('hidden');
        // 분할 모드에서 즉시 미리보기 업데이트
        this.updatePreview();
        break;
    }

    eventBus.emit(EVENTS.EDITOR_MODE_CHANGED, { mode });
  }

  showEditor() {
    if (this.elements.editorPane) {
      this.elements.editorPane.classList.remove('hidden');
    }
  }

  hideEditor() {
    if (this.elements.editorPane) {
      this.elements.editorPane.classList.add('hidden');
    }
  }

  updateModeButtons(mode) {
    const buttons = {
      view: this.elements.btnView,
      edit: this.elements.btnEdit,
      split: this.elements.btnSplit
    };

    Object.entries(buttons).forEach(([btnMode, btn]) => {
      if (btn) {
        btn.classList.toggle('active', btnMode === mode);
      }
    });
  }

  loadContent(content) {
    if (this.elements.editorTextarea) {
      this.elements.editorTextarea.value = content || '';
    }
  }

  onEditorInput() {
    const content = this.elements.editorTextarea?.value || '';
    const activeTab = tabsManager.getActiveTab();

    if (activeTab && !activeTab.isHome) {
      // 탭 콘텐츠 업데이트 (dirty 상태도 자동 계산됨)
      tabsManager.updateContent(activeTab.id, content);

      // 분할 모드에서 디바운스된 미리보기 업데이트
      if (this.currentMode === 'split') {
        this.debouncedUpdatePreview();
      }

      eventBus.emit(EVENTS.EDITOR_CONTENT_CHANGED, { tabId: activeTab.id, content });
    }
  }

  debouncedUpdatePreview() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.updatePreview();
    }, this.DEBOUNCE_DELAY);
  }

  updatePreview() {
    const content = this.elements.editorTextarea?.value || '';
    if (this.elements.content) {
      const html = marked.parse(content);
      this.elements.content.innerHTML = html;
    }
  }

  async save() {
    const activeTab = tabsManager.getActiveTab();
    if (!activeTab || activeTab.isHome) return;

    const content = this.elements.editorTextarea?.value || '';

    if (activeTab.filePath) {
      const success = await fileHandler.saveFile(activeTab.filePath, content);
      if (success) {
        tabsManager.markAsSaved(activeTab.id);
        this.showNotification('저장되었습니다');
      }
    } else {
      // 파일 경로가 없으면 다이얼로그로 저장
      const savedPath = await fileHandler.saveFileWithDialog(content, activeTab.name);
      if (savedPath) {
        tabsManager.markAsSaved(activeTab.id);
        this.showNotification('저장되었습니다');
      }
    }
  }

  showNotification(message) {
    eventBus.emit(EVENTS.NOTIFICATION_SHOWN, message);
  }

  getContent() {
    return this.elements.editorTextarea?.value || '';
  }

  getCurrentMode() {
    return this.currentMode;
  }
}

export const markdownEditor = new MarkdownEditor();
