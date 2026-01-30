/**
 * Print / PDF Export Module
 */

import { showNotification } from '../notification/notification.js';

export function printDocument(ctx) {
  if (ctx.getTabs().length === 0) {
    showNotification('인쇄할 문서가 없습니다.');
    return;
  }
  window.print();
}

export async function exportPdf(ctx) {
  const { tabs, activeTabId, HOME_TAB_ID, t } = ctx;

  if (tabs.length === 0 || activeTabId === HOME_TAB_ID) {
    showNotification(t('noPdfDoc'));
    return;
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (!activeTab) {
    showNotification(t('noPdfDoc'));
    return;
  }

  showNotification(t('exportingPdf'));

  try {
    const html2pdf = (await import('html2pdf.js')).default;
    const contentElement = document.querySelector('.markdown-body');
    if (!contentElement) {
      showNotification(t('pdfExportFailed'));
      return;
    }

    const fileName = activeTab.name.replace(/\.md$/i, '') + '.pdf';
    const opt = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(contentElement).save();
    showNotification(t('pdfExportSuccess'));
  } catch (error) {
    console.error('PDF export error:', error);
    showNotification(t('pdfExportFailed'));
  }
}
