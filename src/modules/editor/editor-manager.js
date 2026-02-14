/**
 * Editor Manager - editor mode, input handling, save
 * Extracted from main.js editor functions
 */

import * as tabManager from '../tabs/tab-manager.js';
import * as renderer from '../markdown/renderer.js';
import * as zoom from '../zoom/zoom-manager.js';
import * as imageModal from '../image-modal/image-modal.js';
import * as fileOps from '../files/file-ops.js';
import { showNotification, showError } from '../notification/notification.js';
import { markFileSaving } from '../files/file-ops.js';
import { eventBus, EVENTS } from '../../core/events.js';

let editorPane, editorTextarea, mainContainer, btnModeView, btnModeEdit, btnModeSplit, btnSave, contentEl;
let editorDebounceTimer = null;
const EDITOR_DEBOUNCE_DELAY = 300;
let _t = (k) => k;
let _doRenderMarkdown = null;

export function init({ t, doRenderMarkdown }) {
  editorPane = document.getElementById('editor-pane');
  editorTextarea = document.getElementById('markdown-editor');
  mainContainer = document.getElementById('main-container');
  btnModeView = document.getElementById('btn-mode-view');
  btnModeEdit = document.getElementById('btn-mode-edit');
  btnModeSplit = document.getElementById('btn-mode-split');
  btnSave = document.getElementById('btn-save');
  contentEl = document.getElementById('content');
  _t = t;
  _doRenderMarkdown = doRenderMarkdown;

  if (btnModeView) btnModeView.addEventListener('click', () => setEditorMode('view'));
  if (btnModeEdit) btnModeEdit.addEventListener('click', () => setEditorMode('edit'));
  if (btnModeSplit) btnModeSplit.addEventListener('click', () => setEditorMode('split'));
  if (btnSave) {
    btnSave.addEventListener('click', saveCurrentFile);
    btnSave.style.display = 'none';
  }
  if (editorTextarea) {
    editorTextarea.addEventListener('input', onEditorInput);
    editorTextarea.addEventListener('keydown', onEditorKeydown);
  }
}

function onEditorKeydown(e) {
  // Tab 키: 들여쓰기 (포커스 이동 방지)
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editorTextarea.selectionStart;
    const end = editorTextarea.selectionEnd;
    const value = editorTextarea.value;

    if (e.shiftKey) {
      // Shift+Tab: 내어쓰기
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineText = value.substring(lineStart, start);
      if (lineText.startsWith('\t') || lineText.startsWith('  ')) {
        const removeChars = lineText.startsWith('\t') ? 1 : 2;
        editorTextarea.value = value.substring(0, lineStart) + value.substring(lineStart + removeChars);
        editorTextarea.selectionStart = editorTextarea.selectionEnd = start - removeChars;
      }
    } else {
      // Tab: 들여쓰기 (2 spaces)
      editorTextarea.value = value.substring(0, start) + '  ' + value.substring(end);
      editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 2;
    }

    // input 이벤트 수동 트리거
    editorTextarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

export function loadEditorContent(content) {
  if (editorTextarea) editorTextarea.value = content || '';
}

export function setEditorMode(mode) {
  if (!mainContainer) return;
  if (tabManager.getActiveTabId() === tabManager.HOME_TAB_ID) mode = 'view';
  const activeTab = tabManager.getTabs().find(t => t.id === tabManager.getActiveTabId());
  if (activeTab) activeTab.editMode = mode;
  updateEditorModeButtons(mode);
  mainContainer.classList.remove('mode-view', 'mode-edit', 'mode-split');
  mainContainer.classList.add(`mode-${mode}`);
  if (editorPane) {
    if (mode === 'view') editorPane.classList.add('hidden');
    else editorPane.classList.remove('hidden');
  }
  if (btnSave) btnSave.style.display = mode === 'view' ? 'none' : '';
  if (mode === 'split') updateEditorPreview();
  eventBus.emit(EVENTS.EDITOR_MODE_CHANGED, { mode });
}

export function updateEditorModeButtons(mode) {
  if (btnModeView) btnModeView.classList.toggle('active', mode === 'view');
  if (btnModeEdit) btnModeEdit.classList.toggle('active', mode === 'edit');
  if (btnModeSplit) btnModeSplit.classList.toggle('active', mode === 'split');
}

export function updateEditModeButtonsDisabled(disabled) {
  if (btnModeEdit) btnModeEdit.disabled = disabled;
  if (btnModeSplit) btnModeSplit.disabled = disabled;
}

export function getCurrentEditorMode() {
  if (!mainContainer) return 'view';
  if (mainContainer.classList.contains('mode-split')) return 'split';
  if (mainContainer.classList.contains('mode-edit')) return 'edit';
  return 'view';
}

function onEditorInput() {
  const editorContent = editorTextarea?.value || '';
  const activeTab = tabManager.getTabs().find(t => t.id === tabManager.getActiveTabId());
  if (activeTab && tabManager.getActiveTabId() !== tabManager.HOME_TAB_ID) {
    activeTab.content = editorContent;
    const wasDirty = activeTab.isDirty;
    activeTab.isDirty = activeTab.content !== activeTab.originalContent;
    if (wasDirty !== activeTab.isDirty) tabManager.renderTabs();
    const currentMode = mainContainer?.classList.contains('mode-split') ? 'split' :
                        mainContainer?.classList.contains('mode-edit') ? 'edit' : 'view';
    if (currentMode === 'split') {
      if (editorDebounceTimer) clearTimeout(editorDebounceTimer);
      editorDebounceTimer = setTimeout(() => updateEditorPreview(), EDITOR_DEBOUNCE_DELAY);
    }
  }
}

function updateEditorPreview() {
  const editorContent = editorTextarea?.value || '';
  if (contentEl && _doRenderMarkdown) _doRenderMarkdown(editorContent, false);
}

export async function saveCurrentFile() {
  const activeTab = tabManager.getTabs().find(t => t.id === tabManager.getActiveTabId());
  if (!activeTab || tabManager.getActiveTabId() === tabManager.HOME_TAB_ID) return;
  const editorContent = editorTextarea?.value || activeTab.content;
  const fsWrite = fileOps.getFsWriteTextFile();
  if (activeTab.filePath && fsWrite) {
    try {
      // 저장 시작 마킹 (파일 워처 알림 억제)
      markFileSaving(activeTab.filePath);
      await fsWrite(activeTab.filePath, editorContent);
      activeTab.content = editorContent;
      activeTab.originalContent = editorContent;
      activeTab.isDirty = false;
      tabManager.renderTabs();
      showNotification(_t('saved') || '저장되었습니다');
    } catch (error) {
      showError('저장 실패', error.toString());
    }
  }
}
