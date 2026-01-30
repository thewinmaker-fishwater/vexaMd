/**
 * Session Save/Restore Module
 */

let isRestoringSession = false;

export function getIsRestoringSession() {
  return isRestoringSession;
}

export function saveSession(ctx) {
  if (isRestoringSession) return;
  const { tabs, activeTabId, HOME_TAB_ID } = ctx;
  const sessionTabs = tabs
    .filter(t => t.filePath && t.filePath !== t.name)
    .map(t => ({
      filePath: t.filePath,
      name: t.name,
      zoom: t.zoom || 100,
      readOnly: t.readOnly || false
    }));
  localStorage.setItem('openTabs', JSON.stringify(sessionTabs));
  localStorage.setItem('activeTabPath', activeTabId !== HOME_TAB_ID
    ? (tabs.find(t => t.id === activeTabId)?.filePath || '')
    : '');
}

export async function restoreSession(ctx) {
  const { tauriApi, generateTabId, pushTab, renderTabs, updateTabBarVisibility, switchToTab, startWatching, addToRecentFiles, HOME_TAB_ID } = ctx;
  const savedTabs = JSON.parse(localStorage.getItem('openTabs') || '[]');
  const activeTabPath = localStorage.getItem('activeTabPath') || '';
  if (savedTabs.length === 0) return;

  isRestoringSession = true;
  let activeRestored = null;
  const tabs = ctx.getTabs();

  for (const saved of savedTabs) {
    try {
      if (tauriApi) {
        const isVmd = saved.filePath.toLowerCase().endsWith('.vmd');
        if (isVmd) {
          const jsonStr = await tauriApi.invoke('read_vmd', { path: saved.filePath });
          const vmdData = JSON.parse(jsonStr);
          const displayName = vmdData.title || saved.filePath.split(/[/\\]/).pop();
          const tabId = generateTabId();
          const tab = {
            id: tabId, name: displayName, filePath: saved.filePath,
            content: vmdData.content, originalContent: vmdData.content,
            isDirty: false, editMode: 'view', tocVisible: false,
            zoom: saved.zoom || 100, readOnly: true
          };
          pushTab(tab);
          if (saved.filePath === activeTabPath) activeRestored = tabId;
        } else {
          const text = await tauriApi.invoke('read_file', { path: saved.filePath });
          const name = saved.filePath.split(/[/\\]/).pop();
          const tabId = generateTabId();
          const tab = {
            id: tabId, name, filePath: saved.filePath,
            content: text, originalContent: text,
            isDirty: false, editMode: 'view', tocVisible: false,
            zoom: saved.zoom || 100, readOnly: false
          };
          pushTab(tab);
          if (saved.filePath && saved.filePath !== name) {
            startWatching(saved.filePath, tabId);
          }
          if (saved.filePath === activeTabPath) activeRestored = tabId;
        }
      }
    } catch (e) {
      console.log('Session restore: skipping file', saved.filePath, e);
    }
  }

  isRestoringSession = false;

  if (tabs.length > 0) {
    renderTabs();
    updateTabBarVisibility();
    switchToTab(activeRestored || tabs[tabs.length - 1].id);
  }
}
