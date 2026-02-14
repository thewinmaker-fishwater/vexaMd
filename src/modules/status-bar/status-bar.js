/**
 * Status Bar Module
 * VS Code 스타일 하단 상태바 - 파일명, 통계, 줌 비율 표시
 */

import { eventBus, EVENTS } from '../../core/events.js';
import { i18n } from '../../i18n.js';
import { countWords, countChars, calcReadingTime } from '../../core/text-utils.js';

const STORAGE_KEY = 'statusBarVisible';

let ctx = {};
let els = {};
let zoomObserver = null;
let editorListenersAttached = false;
let visible = true;

export function init(context) {
  ctx = context;
  els = {
    statusBar: document.getElementById('status-bar'),
    fileName: document.getElementById('status-file-name'),
    stats: document.getElementById('status-stats'),
    zoom: document.getElementById('status-zoom'),
    cursor: document.getElementById('status-cursor'),
    content: document.getElementById('content'),
    zoomLevel: document.getElementById('zoom-level'),
    editor: document.getElementById('markdown-editor'),
    mainContainer: document.getElementById('main-container'),
    editorPane: document.getElementById('editor-pane'),
    checkbox: document.getElementById('statusbar-checkbox'),
  };

  // localStorage에서 상태 복원
  const saved = localStorage.getItem(STORAGE_KEY);
  visible = saved === null ? true : saved === 'true';
  applyVisibility();

  // 체크박스 이벤트
  els.checkbox?.addEventListener('change', () => {
    visible = els.checkbox.checked;
    localStorage.setItem(STORAGE_KEY, String(visible));
    applyVisibility();
  });

  // 이벤트 구독
  eventBus.on(EVENTS.TAB_SWITCHED, update);
  eventBus.on(EVENTS.FILE_LOADED, update);
  eventBus.on(EVENTS.CONTENT_RENDERED, update);
  eventBus.on(EVENTS.EDITOR_CONTENT_CHANGED, update);
  eventBus.on(EVENTS.EDITOR_MODE_CHANGED, onEditorModeChanged);
  eventBus.on(EVENTS.PRESENTATION_STARTED, () => {
    if (els.statusBar) els.statusBar.style.display = 'none';
  });
  eventBus.on(EVENTS.PRESENTATION_ENDED, () => {
    if (els.statusBar) els.statusBar.style.display = visible ? '' : 'none';
  });

  // 줌 변경 감지: zoom-level 요소의 텍스트 변경 관찰
  if (els.zoomLevel) {
    zoomObserver = new MutationObserver(() => updateZoom());
    zoomObserver.observe(els.zoomLevel, { childList: true, characterData: true, subtree: true });
  }

  // 에디터 커서 위치 추적
  attachEditorListeners();

  // 초기 업데이트
  update();
}

// ========== 토글 ==========
export function toggle() {
  visible = !visible;
  localStorage.setItem(STORAGE_KEY, String(visible));
  applyVisibility();
  if (visible) update();
}

export function isVisible() {
  return visible;
}

function applyVisibility() {
  if (!els.statusBar) return;

  const barHeight = visible ? '28px' : '0px';

  els.statusBar.style.display = visible ? '' : 'none';

  // 레이아웃 조정
  if (els.mainContainer) els.mainContainer.style.bottom = barHeight;
  if (els.editorPane) els.editorPane.style.bottom = barHeight;

  // 체크박스 동기화
  if (els.checkbox) els.checkbox.checked = visible;
}

function update() {
  if (!visible) return;
  updateFileName();
  updateStats();
  updateZoom();
  updateCursor();
}

// ========== 파일명 ==========
function updateFileName() {
  if (!els.fileName) return;

  const activeTabId = ctx.getActiveTabId?.();
  const HOME_TAB_ID = ctx.HOME_TAB_ID;

  if (activeTabId === HOME_TAB_ID || !activeTabId) {
    els.fileName.textContent = `Vexa MD v${window.VexaMD?.version || '1.5.0'}`;
    return;
  }

  const tabs = ctx.getTabs?.() || [];
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    els.fileName.textContent = tab.name || '';
    els.fileName.title = tab.filePath || tab.name || '';
  }
}

// ========== 통계 (글자 수, 단어 수, 읽기 시간) ==========
function updateStats() {
  if (!els.stats) return;

  const activeTabId = ctx.getActiveTabId?.();
  const HOME_TAB_ID = ctx.HOME_TAB_ID;

  if (activeTabId === HOME_TAB_ID || !activeTabId) {
    els.stats.textContent = '';
    return;
  }

  const text = els.content?.innerText || '';
  if (!text.trim()) {
    els.stats.textContent = '';
    return;
  }

  const chars = countChars(text);
  const words = countWords(text);
  const readMinutes = calcReadingTime(text);

  const lang = ctx.getCurrentLanguage?.() || 'ko';
  const t = i18n[lang] || i18n.ko;

  const charsLabel = t.statusChars || '자';
  const wordsLabel = t.statusWords || '단어';
  const readLabel = t.statusReadTime || '분';

  const readDisplay = readMinutes < 1
    ? `< 1${readLabel}`
    : `${Math.ceil(readMinutes)}${readLabel}`;

  els.stats.textContent = `${chars.toLocaleString()}${charsLabel} · ${words.toLocaleString()}${wordsLabel} · ${readDisplay}`;
}

// ========== 줌 비율 ==========
function updateZoom() {
  if (!els.zoom) return;

  const activeTabId = ctx.getActiveTabId?.();
  const HOME_TAB_ID = ctx.HOME_TAB_ID;

  if (activeTabId === HOME_TAB_ID || !activeTabId) {
    els.zoom.textContent = '';
    return;
  }

  els.zoom.textContent = els.zoomLevel?.textContent || '100%';
}

// ========== 커서 위치 (에디터 모드) ==========
function updateCursor() {
  if (!els.cursor) return;

  const activeTabId = ctx.getActiveTabId?.();
  const HOME_TAB_ID = ctx.HOME_TAB_ID;
  const editorMode = ctx.getCurrentEditorMode?.();

  if (activeTabId === HOME_TAB_ID || !activeTabId || editorMode === 'view') {
    els.cursor.textContent = '';
    return;
  }

  if (!els.editor) return;

  const pos = els.editor.selectionStart || 0;
  const text = els.editor.value.substring(0, pos);
  const lines = text.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;

  els.cursor.textContent = `Ln ${line}, Col ${col}`;
}

function onEditorModeChanged() {
  attachEditorListeners();
  updateCursor();
}

function attachEditorListeners() {
  if (!els.editor || editorListenersAttached) return;

  const onCursorChange = () => updateCursor();
  els.editor.addEventListener('keyup', onCursorChange);
  els.editor.addEventListener('click', onCursorChange);
  els.editor.addEventListener('select', onCursorChange);
  editorListenersAttached = true;
}
