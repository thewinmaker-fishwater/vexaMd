/**
 * SP MD Viewer - Ultra Lightweight Markdown Viewer
 * Seven Peaks Software
 * Main Entry Point
 */

// Styles
import './style.css';
import './modules/theme/theme.css';
import './modules/tabs/tabs.css';
import './modules/search/search.css';
import './modules/viewer/viewer.css';
import './modules/files/files.css';
import './modules/ui/ui.css';

// Core
import { store, DEFAULT_STATE } from './core/store.js';
import { eventBus, EVENTS } from './core/events.js';
import { $id } from './core/dom.js';
import { i18n } from './i18n.js';

// Components
import { toolbar } from './components/toolbar.js';

// Theme
import { themeManager } from './modules/theme/theme-manager.js';
import { themeEditor } from './modules/theme/theme-editor.js';

// Tabs
import { tabsManager } from './modules/tabs/tabs.js';

// Search
import { searchManager } from './modules/search/search.js';

// Viewer
import { markdownViewer } from './modules/viewer/markdown.js';
import { presentationMode } from './modules/viewer/presentation.js';

// Files
import { fileHandler } from './modules/files/file-handler.js';
import { recentFilesManager } from './modules/files/recent-files.js';
import { dragDropHandler } from './modules/files/drag-drop.js';

// UI
import { viewModeManager } from './modules/ui/view-mode.js';
import { zoomManager } from './modules/ui/zoom.js';
import { helpMenu } from './modules/ui/help-menu.js';
import { settingsManager } from './modules/ui/settings.js';
import { keyboardHandler } from './modules/ui/keyboard.js';

/**
 * Get current language translations
 */
function getLang() {
  return i18n[store.get('language') || 'ko'];
}

/**
 * 애플리케이션 초기화
 */
async function init() {
  console.log('[SP MD Viewer] Initializing...');
  const startTime = performance.now();

  // 1. Store 초기화
  store.init(DEFAULT_STATE);

  // 2. 툴바 초기화 (먼저 렌더링)
  toolbar.init();

  // 3. UI 모듈 초기화 (순서 중요)
  themeManager.init();
  tabsManager.init();
  markdownViewer.init();
  searchManager.init();
  presentationMode.init();
  recentFilesManager.init();
  viewModeManager.init();
  zoomManager.init();
  helpMenu.init();
  settingsManager.init();
  themeEditor.init();

  // 4. 입력 핸들러 초기화
  dragDropHandler.init();
  keyboardHandler.init();

  // 5. 툴바 버튼 이벤트 연결
  setupToolbarEvents();

  // 6. Drop message 초기화
  updateDropMessage();

  // 7. 애니메이션 CSS 추가
  addAnimationStyles();

  // 8. Tauri 초기화 (백그라운드)
  fileHandler.init().then(() => {
    console.log('[SP MD Viewer] Tauri initialized');
  });

  // 언어 변경 시 drop message 업데이트
  store.subscribe('language', updateDropMessage);

  // 툴바 업데이트 시 이벤트 재연결
  eventBus.on(EVENTS.TOOLBAR_UPDATED, () => {
    setupToolbarEvents();
  });

  const elapsed = (performance.now() - startTime).toFixed(1);
  console.log(`[SP MD Viewer] Initialized in ${elapsed}ms`);

  eventBus.emit(EVENTS.APP_INITIALIZED);
}

/**
 * Drop message 업데이트
 */
function updateDropMessage() {
  const dropMessage = $id('drop-message');
  if (dropMessage) {
    dropMessage.textContent = getLang().dropMessage;
  }
}

/**
 * 툴바 버튼 이벤트 연결
 */
function setupToolbarEvents() {
  // 홈/파일 버튼
  $id('btn-home')?.addEventListener('click', () => tabsManager.switchTo('home'));
  $id('btn-open')?.addEventListener('click', () => fileHandler.openFile());
  $id('btn-recent')?.addEventListener('click', () => recentFilesManager.toggleDropdown());

  // 테마 버튼
  $id('btn-theme')?.addEventListener('click', () => themeManager.toggle());
  $id('btn-customize')?.addEventListener('click', () => themeEditor.open());

  // 인쇄
  $id('btn-print')?.addEventListener('click', () => {
    if (tabsManager.getAllTabs().length === 0) {
      showNotification(getLang().noPrintDoc);
      return;
    }
    window.print();
  });

  // 검색
  $id('btn-search')?.addEventListener('click', () => searchManager.toggle());

  // 프레젠테이션
  $id('btn-presentation')?.addEventListener('click', () => presentationMode.start());

  // 컬러 테마 셀렉트
  $id('color-theme')?.addEventListener('change', (e) => {
    themeManager.applyColorTheme(e.target.value);
  });

  // 파일 임포트 인풋
  $id('import-input')?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      themeEditor.importTheme(e.target.files[0]);
      e.target.value = '';
    }
  });
}

/**
 * 알림 표시
 */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: var(--accent);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1001;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

/**
 * 애니메이션 CSS 추가
 */
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// 알림 이벤트 핸들러
eventBus.on(EVENTS.NOTIFICATION_SHOWN, showNotification);

// 애플리케이션 시작
init();
