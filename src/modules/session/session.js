/**
 * Session Save/Restore Module
 */

import { findKeyByName } from '../vmd/vmd-key-ui.js';

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
          // Resolve key for VMD file
          let keyHex = '';
          try {
            const infoStr = await tauriApi.invoke('read_vmd_info', { path: saved.filePath });
            const info = JSON.parse(infoStr);
            if (info.version === 2 && info.keyName !== 'default') {
              const savedKey = findKeyByName(info.keyName);
              if (!savedKey) {
                console.log('Session restore: no saved key for VMD', saved.filePath, info.keyName);
                continue;
              }
              keyHex = savedKey.hexKey;
            }
          } catch (e) {
            console.log('Session restore: read_vmd_info failed', saved.filePath, e);
            continue;
          }
          const jsonStr = await tauriApi.invoke('read_vmd', { path: saved.filePath, keyHex });
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
    switchToTab(activeRestored || (activeTabPath === '' ? HOME_TAB_ID : tabs[tabs.length - 1].id));
  }
}
