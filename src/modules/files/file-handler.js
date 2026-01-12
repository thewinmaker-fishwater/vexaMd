/**
 * File Handler - 파일 열기/로드
 */

import { store } from '../../core/store.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { getFileName, isMarkdownFile } from '../../utils/helpers.js';
import { tabsManager } from '../tabs/tabs.js';
import { recentFilesManager } from './recent-files.js';

class FileHandler {
  constructor() {
    this.tauriApi = null;
    this.dialogOpen = null;
    this.dialogSave = null;
    this.fsWriteTextFile = null;
  }

  async init() {
    await this.initTauri();
    await this.handleCliArgs();
    this.setupTauriEvents();
  }

  async initTauri() {
    try {
      const [coreModule, dialogModule, fsModule] = await Promise.all([
        import('@tauri-apps/api/core'),
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/plugin-fs')
      ]);

      this.tauriApi = coreModule;
      this.dialogOpen = dialogModule.open;
      this.dialogSave = dialogModule.save;
      this.fsWriteTextFile = fsModule.writeTextFile;

      console.log('Tauri API initialized');
    } catch (e) {
      console.log('Running in browser mode', e);
    }
  }

  async openFile() {
    if (this.dialogOpen) {
      const selected = await this.dialogOpen({
        multiple: false,
        filters: [{
          name: 'Markdown',
          extensions: ['md', 'markdown', 'txt']
        }]
      });

      if (selected) {
        await this.loadFile(selected);
      }
    } else {
      // 브라우저 환경
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,.txt';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const text = await file.text();
          tabsManager.create(file.name, file.name, text);
          recentFilesManager.add(file.name, file.name);
          eventBus.emit(EVENTS.FILE_OPENED, { name: file.name, path: file.name });
        }
      };
      input.click();
    }
  }

  async loadFile(filePath) {
    try {
      if (this.tauriApi) {
        const text = await this.tauriApi.invoke('read_file', { path: filePath });
        const name = getFileName(filePath);

        // 이미 열린 파일인지 확인
        const existingTab = tabsManager.getTabByPath(filePath);
        if (existingTab) {
          tabsManager.switchTo(existingTab.id);
          return;
        }

        tabsManager.create(name, filePath, text);
        recentFilesManager.add(name, filePath);
        eventBus.emit(EVENTS.FILE_LOADED, { name, path: filePath });
      }
    } catch (error) {
      this.showError('파일 읽기 실패', error.toString());
      recentFilesManager.remove(filePath);
    }
  }

  async handleCliArgs() {
    if (this.tauriApi) {
      try {
        const args = await this.tauriApi.invoke('get_cli_args');
        if (args && args.length > 0) {
          await this.loadFile(args[0]);
        }
      } catch (e) {
        console.log('No CLI args');
      }
    }
  }

  async setupTauriEvents() {
    if (this.tauriApi) {
      try {
        const { listen } = await import('@tauri-apps/api/event');

        await listen('tauri://drag-drop', async (event) => {
          console.log('Drag drop event in file-handler:', event);
          const paths = event.payload?.paths || event.payload;
          if (paths && paths.length > 0) {
            const filePath = paths[0];
            if (filePath.match(/\.(md|markdown|txt)$/i)) {
              await this.loadFile(filePath);
            }
          }
        });
      } catch (e) {
        console.log('Tauri events not available');
      }
    }
  }

  async saveFile(filePath, content) {
    if (this.fsWriteTextFile) {
      try {
        await this.fsWriteTextFile(filePath, content);
        return true;
      } catch (error) {
        this.showError('저장 실패', error.toString());
        return false;
      }
    }
    return false;
  }

  async saveFileWithDialog(content, defaultFileName) {
    if (this.dialogSave && this.fsWriteTextFile) {
      try {
        const filePath = await this.dialogSave({
          defaultPath: defaultFileName,
          filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (filePath) {
          await this.fsWriteTextFile(filePath, content);
          return filePath;
        }
      } catch (error) {
        this.showError('저장 실패', error.toString());
      }
    }
    return null;
  }

  isTauriAvailable() {
    return !!this.tauriApi;
  }

  showError(title, message) {
    console.error(`${title}: ${message}`);
    eventBus.emit(EVENTS.NOTIFICATION_SHOWN, `${title}: ${message}`);
  }
}

export const fileHandler = new FileHandler();
