/**
 * VMD (Read-Only Export) Module
 */

import { showNotification, showError } from '../notification/notification.js';
import { i18n } from '../../i18n.js';

export async function exportVmd(ctx) {
  const { tabs, activeTabId, currentLanguage, tauriApi, dialogSave } = ctx;
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab) {
    const t = i18n[currentLanguage];
    showNotification(t.noPrintDoc || '내보낼 문서가 없습니다.');
    return;
  }

  const vmdData = {
    format: 'vexa-md',
    version: 1,
    title: activeTab.name.replace(/\.(md|markdown|txt)$/i, ''),
    created: new Date().toISOString(),
    content: activeTab.content
  };

  if (dialogSave) {
    const savePath = await dialogSave({
      defaultPath: vmdData.title + '.vmd',
      filters: [{ name: 'Vexa MD', extensions: ['vmd'] }]
    });
    if (savePath) {
      try {
        await tauriApi.invoke('write_vmd', {
          path: savePath,
          jsonContent: JSON.stringify(vmdData)
        });
        const t = i18n[currentLanguage];
        showNotification(t.exportVmd || '읽기전용 파일로 내보냈습니다.');
      } catch (e) {
        showError('내보내기 실패', e.toString());
      }
    }
  }
}

export async function exportVmdToMd(ctx) {
  const { tabs, activeTabId, currentLanguage, tauriApi, dialogSave } = ctx;
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab || !activeTab.readOnly) {
    showNotification(i18n[currentLanguage].noPrintDoc || '내보낼 VMD 문서가 없습니다.');
    return;
  }

  const defaultName = activeTab.name.replace(/\.vmd$/i, '') + '.md';
  if (dialogSave) {
    const savePath = await dialogSave({
      defaultPath: defaultName,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    });
    if (savePath) {
      try {
        await tauriApi.invoke('write_file', { path: savePath, content: activeTab.content });
        const t = i18n[currentLanguage];
        showNotification(t.exportVmdToMd || 'Markdown 파일로 내보냈습니다.');
      } catch (e) {
        showError('내보내기 실패', e.toString());
      }
    }
  }
}

export async function loadVmdFile(filePath, ctx) {
  const { tauriApi, generateTabId, pushTab, renderTabs, switchToTab, updateTabBarVisibility, addToRecentFiles, saveSession } = ctx;
  try {
    const jsonStr = await tauriApi.invoke('read_vmd', { path: filePath });
    const vmdData = JSON.parse(jsonStr);
    if (vmdData.format !== 'vexa-md') {
      showError('VMD 오류', '유효한 VMD 파일이 아닙니다.');
      return;
    }
    const displayName = vmdData.title || filePath.split(/[/\\]/).pop();
    const tabId = generateTabId();
    const tab = {
      id: tabId, name: displayName, filePath: filePath,
      content: vmdData.content, originalContent: vmdData.content,
      isDirty: false, editMode: 'view', tocVisible: false,
      zoom: 100, readOnly: true
    };
    pushTab(tab);
    renderTabs();
    switchToTab(tabId);
    updateTabBarVisibility();
    addToRecentFiles(displayName, filePath);
    saveSession();
  } catch (e) {
    showError('VMD 오류', e.toString());
  }
}
