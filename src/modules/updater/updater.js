/**
 * Vexa MD - Auto Update Module
 * Uses tauri-plugin-updater for GitHub Releases based updates
 */

import { i18n } from '../../i18n.js';

let currentLanguage = 'ko';
let updateObj = null;

function t(key) {
  return (i18n[currentLanguage] && i18n[currentLanguage][key]) || key;
}

/**
 * Initialize updater module
 * @param {object} opts - { getCurrentLanguage }
 */
export function initUpdater(opts = {}) {
  if (opts.getCurrentLanguage) {
    currentLanguage = opts.getCurrentLanguage();
  }
}

/**
 * Check for updates
 * @param {boolean} silent - true: suppress "up to date" and error messages
 */
export async function checkForUpdate(silent = false) {
  try {
    await loadAppVersion();
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();

    if (update) {
      updateObj = update;
      showUpdateModal(update.version, update.body || '');
    } else if (!silent) {
      showUpToDateNotice();
    }
  } catch (err) {
    console.warn('[Updater] Check failed:', err);
    if (!silent) {
      // No published release or network error → show "up to date"
      showUpToDateNotice();
    }
  }
}

/**
 * Show update available modal
 */
function showUpdateModal(newVersion, releaseNotes) {
  const modal = document.getElementById('update-modal');
  if (!modal) return;

  const lang = currentLanguage;
  const tr = i18n[lang] || i18n.ko;

  modal.querySelector('.update-title').textContent = tr.updateAvailable || 'Update Available';
  modal.querySelector('.update-current').textContent = `${tr.updateCurrentVersion || 'Current version'}: ${getAppVersion()}`;
  modal.querySelector('.update-new').textContent = `${tr.updateNewVersion || 'New version'}: ${newVersion}`;

  const notesEl = modal.querySelector('.update-notes-content');
  if (notesEl) {
    notesEl.textContent = releaseNotes || '';
    modal.querySelector('.update-notes-section').classList.toggle('hidden', !releaseNotes);
  }

  const progressSection = modal.querySelector('.update-progress-section');
  progressSection.classList.add('hidden');

  const btnUpdate = modal.querySelector('#update-btn-now');
  const btnLater = modal.querySelector('#update-btn-later');
  const btnRestart = modal.querySelector('#update-btn-restart');

  btnUpdate.textContent = tr.updateNow || 'Update Now';
  btnLater.textContent = tr.updateLater || 'Later';
  btnRestart.textContent = tr.updateRestart || 'Restart';

  btnUpdate.classList.remove('hidden');
  btnLater.classList.remove('hidden');
  btnRestart.classList.add('hidden');

  // Remove old listeners by replacing elements
  const newBtnUpdate = btnUpdate.cloneNode(true);
  const newBtnLater = btnLater.cloneNode(true);
  const newBtnRestart = btnRestart.cloneNode(true);
  btnUpdate.replaceWith(newBtnUpdate);
  btnLater.replaceWith(newBtnLater);
  btnRestart.replaceWith(newBtnRestart);

  newBtnLater.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  newBtnUpdate.addEventListener('click', () => {
    startDownload(modal);
  });

  newBtnRestart.addEventListener('click', async () => {
    try {
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('[Updater] Relaunch failed:', err);
    }
  });

  modal.classList.remove('hidden');
}

/**
 * Start downloading and installing update
 */
async function startDownload(modal) {
  if (!updateObj) return;

  const tr = i18n[currentLanguage] || i18n.ko;
  const progressSection = modal.querySelector('.update-progress-section');
  const progressBar = modal.querySelector('.update-progress-bar');
  const progressText = modal.querySelector('.update-progress-text');
  const btnUpdate = modal.querySelector('#update-btn-now');
  const btnLater = modal.querySelector('#update-btn-later');
  const btnRestart = modal.querySelector('#update-btn-restart');

  progressSection.classList.remove('hidden');
  btnUpdate.classList.add('hidden');
  btnLater.classList.add('hidden');
  progressText.textContent = tr.updateDownloading || 'Downloading...';

  let downloaded = 0;
  let contentLength = 0;

  try {
    await updateObj.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength || 0;
          break;
        case 'Progress':
          downloaded += event.data.chunkLength || 0;
          if (contentLength > 0) {
            const pct = Math.round((downloaded / contentLength) * 100);
            progressBar.style.width = pct + '%';
            progressText.textContent = `${pct}%`;
          }
          break;
        case 'Finished':
          progressBar.style.width = '100%';
          progressText.textContent = tr.updateRestartMsg || 'Restarting...';
          btnRestart.classList.remove('hidden');
          break;
      }
    });
  } catch (err) {
    console.error('[Updater] Download failed:', err);
    progressText.textContent = tr.updateFailed || 'Update failed';
    btnLater.classList.remove('hidden');
    btnLater.textContent = t('close') || 'Close';
  }
}

/**
 * Show "up to date" notification
 */
function showUpToDateNotice() {
  const tr = i18n[currentLanguage] || i18n.ko;
  showSimpleNotice(tr.updateLatest || 'You are on the latest version.');
}

/**
 * Show error notification
 */
function showErrorNotice() {
  const tr = i18n[currentLanguage] || i18n.ko;
  showSimpleNotice(tr.updateFailed || 'Update check failed');
}

/**
 * Show a simple notification that auto-dismisses
 */
function showSimpleNotice(message) {
  const existing = document.querySelector('.update-notice');
  if (existing) existing.remove();

  const notice = document.createElement('div');
  notice.className = 'update-notice';
  notice.textContent = message;
  document.body.appendChild(notice);

  setTimeout(() => {
    notice.classList.add('fade-out');
    setTimeout(() => notice.remove(), 300);
  }, 3000);
}

/** Cached app version */
let appVersion = '1.5.1';

/**
 * Load app version from Tauri API
 */
async function loadAppVersion() {
  try {
    const { getVersion } = await import('@tauri-apps/api/app');
    appVersion = await getVersion();
  } catch {
    // fallback
  }
}

/**
 * Get current app version
 */
function getAppVersion() {
  return appVersion;
}
