/**
 * File Operations Module
 * openFile, loadFile, dragDrop, fileWatcher, recentFiles
 */

import { showNotification, showError } from '../notification/notification.js';

// File watchers map
const fileWatchers = new Map();
const fileChangeDebounce = new Map();

// 저장 중인 파일 추적 (워처 알림 억제용)
const savingFiles = new Set();

// Recent files state
const MAX_RECENT_FILES = 10;
let recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');

// Favorites state
const MAX_FAVORITES = 20;
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

let tauriApi = null;
let dialogOpen = null;
let dialogSave = null;
let fsWriteTextFile = null;
let fsWatchImmediate = null;

let els = {};
let ctx = {};

export async function initTauri() {
  try {
    const [coreModule, dialogModule, fsModule] = await Promise.all([
      import('@tauri-apps/api/core'),
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs')
    ]);
    tauriApi = coreModule;
    dialogOpen = dialogModule.open;
    dialogSave = dialogModule.save;
    fsWriteTextFile = fsModule.writeTextFile;
    fsWatchImmediate = fsModule.watchImmediate;
  } catch (e) {
    console.log('Running in browser mode', e);
  }
}

export function getTauriApi() { return tauriApi; }
export function getDialogSave() { return dialogSave; }
export function getFsWriteTextFile() { return fsWriteTextFile; }

export function init(context) {
  els = {
    content: document.getElementById('content'),
    btnOpen: document.getElementById('btn-open'),
    btnRecent: document.getElementById('btn-recent'),
    recentDropdown: document.getElementById('recent-dropdown'),
    recentList: document.getElementById('recent-list'),
    recentEmpty: document.getElementById('recent-empty'),
    clearRecent: document.getElementById('clear-recent'),
    dropOverlay: document.getElementById('drop-overlay'),
    importInput: document.getElementById('import-input'),
    btnFavoriteToggle: document.getElementById('btn-favorite-toggle'),
    btnFavorites: document.getElementById('btn-favorites'),
    favoritesDropdown: document.getElementById('favorites-dropdown'),
    favoritesList: document.getElementById('favorites-list'),
    favoritesEmpty: document.getElementById('favorites-empty'),
    clearFavorites: document.getElementById('clear-favorites'),
  };
  ctx = context;

  els.btnOpen.addEventListener('click', openFile);
  els.btnRecent.addEventListener('click', toggleRecentDropdown);
  els.clearRecent.addEventListener('click', clearRecentFiles);
  els.btnFavoriteToggle.addEventListener('click', handleFavoriteToggle);
  els.btnFavorites.addEventListener('click', toggleFavoritesDropdown);
  els.clearFavorites.addEventListener('click', clearFavorites);

  els.importInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      ctx.importTheme?.(e.target.files[0]);
      e.target.value = '';
    }
  });
}

export function getRecentFiles() {
  return recentFiles;
}

// ========== File Watcher ==========
export async function startWatching(filePath, tabId) {
  if (!fsWatchImmediate || !filePath) return;
  try {
    if (fileWatchers.has(filePath)) {
      fileWatchers.get(filePath).tabIds.add(tabId);
      return;
    }
    const unwatch = await fsWatchImmediate(filePath, (event) => {
      handleFileChange(filePath, event);
    }, { recursive: false });
    fileWatchers.set(filePath, { unwatch, tabIds: new Set([tabId]) });
  } catch (error) {
    console.error('Failed to watch file:', filePath, error);
  }
}

export async function stopWatching(filePath, tabId) {
  if (!fileWatchers.has(filePath)) return;
  const watcher = fileWatchers.get(filePath);
  watcher.tabIds.delete(tabId);
  if (watcher.tabIds.size === 0) {
    try {
      if (typeof watcher.unwatch === 'function') await watcher.unwatch();
      fileWatchers.delete(filePath);
    } catch (error) {
      console.error(`Failed to stop watching: ${filePath}`, error);
    }
  }
}

function handleFileChange(filePath, event) {
  if (fileChangeDebounce.has(filePath)) {
    clearTimeout(fileChangeDebounce.get(filePath));
  }
  fileChangeDebounce.set(filePath, setTimeout(async () => {
    fileChangeDebounce.delete(filePath);

    // 저장 중인 파일이면 알림 억제
    if (savingFiles.has(filePath)) {
      savingFiles.delete(filePath);
      return;
    }

    const eventType = event?.type;
    const isModify = eventType === 'modify' || eventType === 'any' ||
                     eventType?.modify || eventType?.Modify ||
                     (typeof eventType === 'object' && eventType !== null);
    const isRemove = eventType === 'remove' || eventType?.remove || eventType?.Remove;

    if (isRemove) {
      const tabsToClose = ctx.getTabs().filter(t => t.filePath === filePath);
      for (const tab of tabsToClose) {
        ctx.closeTab(tab.id);
      }
      showNotification('파일이 삭제되어 탭을 닫았습니다.');
      return;
    }

    if (isModify) {
      const tabsToReload = ctx.getTabs().filter(t => t.filePath === filePath);
      for (const tab of tabsToReload) {
        try {
          const text = await tauriApi.invoke('read_file', { path: filePath });
          tab.content = text;
          if (ctx.getActiveTabId() === tab.id) {
            ctx.renderMarkdown(text, false);
            showNotification(ctx.t('fileReloaded') || '파일이 새로고침되었습니다');
          }
        } catch (error) {
          console.error('Failed to reload file:', filePath, error);
        }
      }
    }
  }, 300));
}

// ========== Open / Load ==========
export async function openFile() {
  if (dialogOpen) {
    const selected = await dialogOpen({
      multiple: false,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt', 'vmd'] }]
    });
    if (selected) await loadFile(selected);
  } else {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        ctx.createTab(file.name, file.name, text);
        addToRecentFiles(file.name, file.name);
      }
    };
    input.click();
  }
}

export async function loadFile(filePath) {
  try {
    if (tauriApi) {
      const existingTab = ctx.getTabs().find(t => t.filePath === filePath);
      if (existingTab) {
        ctx.switchToTab(existingTab.id);
        return;
      }
      if (filePath.toLowerCase().endsWith('.vmd')) {
        await ctx.loadVmdFile(filePath);
        return;
      }
      const text = await tauriApi.invoke('read_file', { path: filePath });
      const name = filePath.split(/[/\\]/).pop();
      ctx.createTab(name, filePath, text);
      addToRecentFiles(name, filePath);
    }
  } catch (error) {
    showError('파일 읽기 실패', error.toString());
    removeFromRecentFiles(filePath);
  }
}

// ========== CLI Args ==========
export async function handleCliArgs() {
  if (tauriApi) {
    try {
      const args = await tauriApi.invoke('get_cli_args');
      if (args && args.length > 0) await loadFile(args[0]);
    } catch (e) {
      console.log('No CLI args');
    }
  }
}

// ========== Drag & Drop ==========
export function setupDragDrop() {
  let dragCounter = 0;

  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    els.dropOverlay.classList.add('active');
  });
  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) els.dropOverlay.classList.remove('active');
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    els.dropOverlay.classList.remove('active');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.match(/\.(md|markdown|txt)$/i)) {
        const text = await file.text();
        ctx.createTab(file.name, file.name, text);
        addToRecentFiles(file.name, file.name);
      } else if (file.name.toLowerCase().endsWith('.vmd')) {
        if (tauriApi && file.path) {
          await loadFile(file.path);
        } else {
          showError('VMD 오류', 'VMD 파일은 Tauri 환경에서만 열 수 있습니다.');
        }
      } else if (file.name.endsWith('.json')) {
        ctx.importTheme?.(file);
      } else {
        showError('지원하지 않는 형식', 'Markdown 파일(.md, .markdown, .txt) 또는 테마 파일(.json)만 지원합니다.');
      }
    }
  });
}

// ========== Tauri Events ==========
export async function setupTauriEvents() {
  if (tauriApi) {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      await listen('tauri://drag-drop', async (event) => {
        const paths = event.payload?.paths || event.payload;
        if (paths && paths.length > 0) {
          for (const filePath of paths) {
            if (filePath.match(/\.(md|markdown|txt|vmd)$/i)) {
              await loadFile(filePath);
            } else if (filePath.match(/\.json$/i)) {
              try {
                const text = await tauriApi.invoke('read_file', { path: filePath });
                const data = JSON.parse(text);
                if (data.customStyles) {
                  ctx.importThemeData?.(data);
                }
              } catch (e) {
                console.error('Failed to import theme:', e);
              }
            }
          }
        }
      });
      await listen('open-files-from-instance', async (event) => {
        const filePaths = event.payload;
        if (filePaths && filePaths.length > 0) {
          for (const filePath of filePaths) {
            await loadFile(filePath);
          }
        }
      });
    } catch (e) {
      console.log('Tauri events not available');
    }
  }
}

// ========== Recent Files ==========
export function addToRecentFiles(name, filePath) {
  recentFiles = recentFiles.filter(f => f.path !== filePath);
  recentFiles.unshift({ name, path: filePath, openedAt: Date.now() });
  if (recentFiles.length > MAX_RECENT_FILES) recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
  renderRecentFiles();
  renderHomeRecentFiles();
}

function removeFromRecentFiles(filePath) {
  recentFiles = recentFiles.filter(f => f.path !== filePath);
  localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
  renderRecentFiles();
  renderHomeRecentFiles();
}

function clearRecentFiles() {
  recentFiles = [];
  localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
  renderRecentFiles();
  renderHomeRecentFiles();
  hideRecentDropdown();
}

function renderRecentFiles() {
  els.recentList.innerHTML = '';
  if (recentFiles.length === 0) {
    els.recentEmpty.style.display = 'block';
    els.clearRecent.style.display = 'none';
    return;
  }
  els.recentEmpty.style.display = 'none';
  els.clearRecent.style.display = 'block';

  recentFiles.forEach(file => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
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
    `;
    item.querySelector('.recent-item-content').addEventListener('click', () => {
      hideRecentDropdown();
      loadFile(file.path);
    });
    item.querySelector('.recent-item-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromRecentFiles(file.path);
    });
    els.recentList.appendChild(item);
  });
}

export function renderHomeRecentFiles() {
  const homeList = document.getElementById('home-recent-list');
  const homeRecentSection = document.getElementById('home-recent');
  if (!homeList || !homeRecentSection) return;

  if (recentFiles.length === 0) {
    homeRecentSection.style.display = 'none';
    return;
  }

  homeRecentSection.style.display = 'block';
  homeList.innerHTML = '';
  recentFiles.slice(0, 5).forEach(file => {
    const item = document.createElement('div');
    item.className = 'home-recent-item';
    item.innerHTML = `
      <svg class="home-recent-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <div class="home-recent-info">
        <div class="home-recent-name">${file.name}</div>
        <div class="home-recent-path">${file.path}</div>
      </div>
    `;
    item.addEventListener('click', () => loadFile(file.path));
    homeList.appendChild(item);
  });
}

function toggleRecentDropdown() {
  if (els.recentDropdown.classList.contains('hidden')) {
    showRecentDropdown();
  } else {
    hideRecentDropdown();
  }
}

function showRecentDropdown() {
  renderRecentFiles();
  els.recentDropdown.classList.remove('hidden');
  const btnRect = els.btnRecent.getBoundingClientRect();
  els.recentDropdown.style.top = (btnRect.bottom + 4) + 'px';
  els.recentDropdown.style.left = btnRect.left + 'px';
}

export function hideRecentDropdown() {
  els.recentDropdown.classList.add('hidden');
}

// ========== Favorites ==========
export function addToFavorites(name, filePath) {
  favorites = favorites.filter(f => f.path !== filePath);
  favorites.unshift({ name, path: filePath, addedAt: Date.now() });
  if (favorites.length > MAX_FAVORITES) favorites = favorites.slice(0, MAX_FAVORITES);
  saveFavorites();
  renderFavoritesDropdown();
  renderHomeFavorites();
}

export function removeFromFavorites(filePath) {
  favorites = favorites.filter(f => f.path !== filePath);
  saveFavorites();
  renderFavoritesDropdown();
  renderHomeFavorites();
}

export function isFavorite(filePath) {
  return favorites.some(f => f.path === filePath);
}

export function toggleFavorite(name, filePath) {
  if (isFavorite(filePath)) {
    removeFromFavorites(filePath);
  } else {
    addToFavorites(name, filePath);
  }
}

export function getFavorites() {
  return favorites;
}

function clearFavorites() {
  favorites = [];
  saveFavorites();
  renderFavoritesDropdown();
  renderHomeFavorites();
  hideFavoritesDropdown();
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function handleFavoriteToggle() {
  const activeTab = ctx.getTabs().find(t => t.id === ctx.getActiveTabId());
  if (!activeTab || ctx.getActiveTabId() === 'home') return;
  toggleFavorite(activeTab.name, activeTab.filePath);
  updateFavoriteButton(activeTab.filePath);
}

export function updateFavoriteButton(filePath) {
  if (!els.btnFavoriteToggle) return;
  const isFav = filePath && isFavorite(filePath);
  els.btnFavoriteToggle.classList.toggle('favorited', isFav);
  els.btnFavoriteToggle.title = isFav
    ? (ctx.t?.('removeFavorite') || '즐겨찾기 제거')
    : (ctx.t?.('addFavorite') || '즐겨찾기 추가');
}

function renderFavoritesDropdown() {
  if (!els.favoritesList) return;
  els.favoritesList.innerHTML = '';
  if (favorites.length === 0) {
    els.favoritesEmpty.style.display = 'block';
    els.clearFavorites.style.display = 'none';
    return;
  }
  els.favoritesEmpty.style.display = 'none';
  els.clearFavorites.style.display = 'block';

  favorites.forEach(file => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
      <div class="recent-item-content">
        <div class="recent-item-name">${file.name}</div>
        <div class="recent-item-path">${file.path}</div>
      </div>
      <button class="recent-item-remove" title="${ctx.t?.('removeFromList') || '목록에서 제거'}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    item.querySelector('.recent-item-content').addEventListener('click', () => {
      hideFavoritesDropdown();
      loadFile(file.path);
    });
    item.querySelector('.recent-item-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromFavorites(file.path);
      updateFavoriteButton(ctx.getTabs().find(t => t.id === ctx.getActiveTabId())?.filePath);
    });
    els.favoritesList.appendChild(item);
  });
}

export function renderHomeFavorites() {
  const homeList = document.getElementById('home-favorites-list');
  const homeFavSection = document.getElementById('home-favorites');
  if (!homeList || !homeFavSection) return;

  if (favorites.length === 0) {
    homeFavSection.style.display = 'none';
    return;
  }

  homeFavSection.style.display = 'block';
  homeList.innerHTML = '';
  favorites.forEach(file => {
    const item = document.createElement('div');
    item.className = 'home-recent-item';
    item.innerHTML = `
      <svg class="home-recent-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <div class="home-recent-info">
        <div class="home-recent-name">${file.name}</div>
        <div class="home-recent-path">${file.path}</div>
      </div>
    `;
    item.addEventListener('click', () => loadFile(file.path));
    homeList.appendChild(item);
  });
}

function toggleFavoritesDropdown() {
  if (els.favoritesDropdown.classList.contains('hidden')) {
    showFavoritesDropdown();
  } else {
    hideFavoritesDropdown();
  }
}

function showFavoritesDropdown() {
  renderFavoritesDropdown();
  els.favoritesDropdown.classList.remove('hidden');
  const btnRect = els.btnFavorites.getBoundingClientRect();
  els.favoritesDropdown.style.top = (btnRect.bottom + 4) + 'px';
  els.favoritesDropdown.style.left = btnRect.left + 'px';
}

export function hideFavoritesDropdown() {
  if (els.favoritesDropdown) els.favoritesDropdown.classList.add('hidden');
}

// 저장 시작/종료 마커 (워처 알림 억제용)
export function markFileSaving(filePath) {
  savingFiles.add(filePath);
  // 1초 후 자동 해제 (안전장치)
  setTimeout(() => savingFiles.delete(filePath), 1000);
}

export function unmarkFileSaving(filePath) {
  savingFiles.delete(filePath);
}

export function isFileSaving(filePath) {
  return savingFiles.has(filePath);
}
