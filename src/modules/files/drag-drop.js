/**
 * Drag & Drop Handler - 드래그 앤 드롭 처리
 */

import { $id } from '../../core/dom.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { isMarkdownFile } from '../../utils/helpers.js';
import { tabsManager } from '../tabs/tabs.js';
import { recentFilesManager } from './recent-files.js';
import { themeEditor } from '../theme/theme-editor.js';

class DragDropHandler {
  constructor() {
    this.dragCounter = 0;
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setup();
  }

  cacheElements() {
    this.elements = {
      dropOverlay: $id('drop-overlay')
    };
  }

  setup() {
    document.addEventListener('dragenter', (e) => {
      e.preventDefault();
      this.dragCounter++;
      this.elements.dropOverlay?.classList.add('active');
    });

    document.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.dragCounter--;
      if (this.dragCounter === 0) {
        this.elements.dropOverlay?.classList.remove('active');
      }
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    document.addEventListener('drop', async (e) => {
      e.preventDefault();
      this.dragCounter = 0;
      this.elements.dropOverlay?.classList.remove('active');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await this.handleFileDrop(files[0]);
      }
    });
  }

  async handleFileDrop(file) {
    if (file.name.match(/\.(md|markdown|txt)$/i)) {
      // 마크다운 파일
      const text = await file.text();
      tabsManager.create(file.name, file.name, text);
      recentFilesManager.add(file.name, file.name);
      eventBus.emit(EVENTS.FILE_DROPPED, { name: file.name, type: 'markdown' });
    } else if (file.name.endsWith('.json')) {
      // 테마 파일
      themeEditor.importTheme(file);
      eventBus.emit(EVENTS.FILE_DROPPED, { name: file.name, type: 'theme' });
    } else {
      this.showError('지원하지 않는 형식', 'Markdown 파일(.md, .markdown, .txt) 또는 테마 파일(.json)만 지원합니다.');
    }
  }

  showError(title, message) {
    eventBus.emit(EVENTS.NOTIFICATION_SHOWN, `${title}: ${message}`);
  }
}

export const dragDropHandler = new DragDropHandler();
