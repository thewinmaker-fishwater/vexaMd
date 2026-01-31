/**
 * VMD Key Selection/Input UI
 */

import { i18n } from '../../i18n.js';

const STORAGE_KEY = 'vmd-keys';
const DEFAULT_KEY_STORAGE = 'vmd-default-key';
// 내장키 식별자
const BUILTIN_KEY_ID = '__builtin__';

/** Load saved keys from localStorage */
export function loadSavedKeys() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/** Save keys to localStorage */
function saveKeys(keys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

/** Get default key name (null = builtin) */
export function getDefaultKeyName() {
  return localStorage.getItem(DEFAULT_KEY_STORAGE) || BUILTIN_KEY_ID;
}

/** Set default key name */
export function setDefaultKeyName(name) {
  localStorage.setItem(DEFAULT_KEY_STORAGE, name);
}

/**
 * Resolve the "default" key selection to { keyHex, keyName }.
 * If default is builtin → empty hex. If default is a user key → that key's hex.
 */
export function resolveDefaultKey() {
  const defaultName = getDefaultKeyName();
  if (defaultName === BUILTIN_KEY_ID) {
    return { keyHex: '', keyName: 'default' };
  }
  const saved = findKeyByName(defaultName);
  if (saved) {
    return { keyHex: saved.hexKey, keyName: saved.name };
  }
  // fallback to builtin if saved key was deleted
  setDefaultKeyName(BUILTIN_KEY_ID);
  return { keyHex: '', keyName: 'default' };
}

/** Add a key to saved keys (dedup by name and hexKey) */
export function addSavedKey(name, hexKey) {
  const keys = loadSavedKeys();
  const byName = keys.findIndex(k => k.name === name);
  const byHex = keys.findIndex(k => k.hexKey === hexKey);
  if (byName >= 0) {
    keys[byName].hexKey = hexKey;
  } else if (byHex >= 0) {
    // same key value exists with different name — update name
    keys[byHex].name = name;
  } else {
    keys.push({ name, hexKey });
  }
  saveKeys(keys);
}

/** Find saved key by name */
export function findKeyByName(keyName) {
  return loadSavedKeys().find(k => k.name === keyName);
}

// ========== SVG Icons ==========
const SVG_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
const SVG_X_SM = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
const SVG_COPY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
const SVG_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>';
const SVG_STAR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
const SVG_STAR_EMPTY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
const SVG_EDIT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
const SVG_WARN = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

/**
 * Themed confirm dialog (replaces native confirm()).
 * Returns Promise<boolean>.
 */
function showConfirmDialog(message, t) {
  return new Promise((resolve) => {
    const dlg = document.createElement('div');
    dlg.className = 'modal vmd-confirm-modal';
    dlg.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content vmd-confirm-content">
        <div class="vmd-confirm-body">
          <div class="vmd-confirm-icon">${SVG_WARN}</div>
          <p class="vmd-confirm-msg">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary vmd-confirm-no">${t.cancel || '취소'}</button>
          <button class="btn-primary vmd-confirm-yes vmd-confirm-danger">${t.confirm || '확인'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);

    function close(result) {
      dlg.remove();
      resolve(result);
    }

    dlg.querySelector('.modal-backdrop').addEventListener('click', () => close(false));
    dlg.querySelector('.vmd-confirm-no').addEventListener('click', () => close(false));
    dlg.querySelector('.vmd-confirm-yes').addEventListener('click', () => close(true));
  });
}

/**
 * Show key selection modal for export.
 * Returns { keyHex: string, keyName: string } or null if cancelled.
 */
export function showKeySelectModal(ctx) {
  const { currentLanguage, tauriApi } = ctx;
  const t = i18n[currentLanguage] || i18n.ko;

  return new Promise((resolve) => {
    const savedKeys = loadSavedKeys();
    const defaultKeyName = getDefaultKeyName();

    // Resolve default display label
    const defaultLabel = defaultKeyName === BUILTIN_KEY_ID
      ? (t.vmdKeyBuiltin || '내장키')
      : defaultKeyName;

    const modal = document.createElement('div');
    modal.className = 'modal vmd-key-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content vmd-key-content">
        <div class="modal-header">
          <h2>${t.vmdKeySelect || '암호화 키 선택'}</h2>
          <button class="modal-close vmd-key-close">${SVG_CLOSE}</button>
        </div>
        <div class="vmd-key-body">
          <div class="vmd-key-options">
            <label class="vmd-key-option">
              <input type="radio" name="vmd-key-type" value="default" checked />
              <span>${t.vmdKeyDefault || '내장키'} <span class="vmd-key-default-label">(${defaultLabel})</span></span>
            </label>
            ${savedKeys.map((k, i) => `
              <label class="vmd-key-option">
                <input type="radio" name="vmd-key-type" value="saved-${i}" />
                <span>${k.name}</span>
                <button class="vmd-key-delete-btn" data-index="${i}" title="${t.close || '삭제'}">${SVG_X_SM}</button>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary vmd-key-cancel">${t.cancel || '취소'}</button>
          <button class="btn-primary vmd-key-confirm">${t.confirm || '확인'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    function close(result) {
      modal.remove();
      resolve(result);
    }

    // Delete saved key buttons
    modal.querySelectorAll('.vmd-key-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        const keys = loadSavedKeys();
        // If deleting the current default, reset to builtin
        if (getDefaultKeyName() === keys[idx]?.name) {
          setDefaultKeyName(BUILTIN_KEY_ID);
        }
        keys.splice(idx, 1);
        saveKeys(keys);
        close(null);
        showKeySelectModal(ctx).then(resolve);
      });
    });

    modal.querySelector('.modal-backdrop').addEventListener('click', () => close(null));
    modal.querySelector('.vmd-key-close').addEventListener('click', () => close(null));
    modal.querySelector('.vmd-key-cancel').addEventListener('click', () => close(null));

    modal.querySelector('.vmd-key-confirm').addEventListener('click', async () => {
      const selected = modal.querySelector('input[name="vmd-key-type"]:checked').value;

      if (selected === 'default') {
        close(resolveDefaultKey());
      } else if (selected.startsWith('saved-')) {
        const idx = parseInt(selected.replace('saved-', ''));
        const key = savedKeys[idx];
        close({ keyHex: key.hexKey, keyName: key.name });
      }
    });
  });
}

/**
 * Show key input modal for opening encrypted VMD.
 * Returns keyHex string or null if cancelled.
 */
export function showKeyInputModal(keyName, ctx) {
  const { currentLanguage } = ctx;
  const t = i18n[currentLanguage] || i18n.ko;

  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal vmd-key-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content vmd-key-content">
        <div class="modal-header">
          <h2>${t.vmdKeyRequired || '암호화 키 필요'}</h2>
          <button class="modal-close vmd-key-close">${SVG_CLOSE}</button>
        </div>
        <div class="vmd-key-body">
          <p class="vmd-key-info">${(t.vmdEncryptedWith || '이 파일은 <strong>{keyName}</strong> 키로 암호화되었습니다.').replace('{keyName}', keyName)}</p>
          <div class="vmd-key-field">
            <label>${t.vmdKeyValue || '키 값 (hex)'}</label>
            <input type="text" id="vmd-key-open-input" placeholder="64자 hex 문자열" />
          </div>
          <label class="vmd-key-save-check">
            <input type="checkbox" id="vmd-key-save-cb" checked />
            <span>${t.vmdKeySave || '키 저장'}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary vmd-key-cancel">${t.cancel || '취소'}</button>
          <button class="btn-primary vmd-key-confirm">${t.confirm || '확인'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    function close(result) {
      modal.remove();
      resolve(result);
    }

    modal.querySelector('.modal-backdrop').addEventListener('click', () => close(null));
    modal.querySelector('.vmd-key-close').addEventListener('click', () => close(null));
    modal.querySelector('.vmd-key-cancel').addEventListener('click', () => close(null));

    modal.querySelector('.vmd-key-confirm').addEventListener('click', () => {
      const hex = modal.querySelector('#vmd-key-open-input').value.trim();
      if (!hex || !/^[0-9a-fA-F]+$/.test(hex)) {
        modal.querySelector('#vmd-key-open-input').style.borderColor = 'var(--accent)';
        return;
      }
      // 64자 미만이면 앞에 0 패딩, 초과면 앞에서 64자만 사용
      const normalizedHex = hex.length < 64 ? hex.padStart(64, '0') : hex.substring(0, 64);
      if (modal.querySelector('#vmd-key-save-cb').checked) {
        addSavedKey(keyName, normalizedHex);
      }
      close(normalizedHex);
    });
  });
}

/**
 * Show key manager modal (standalone key management UI).
 */
export function showKeyManagerModal(ctx) {
  const { currentLanguage, tauriApi, dialogSave } = ctx;
  const t = i18n[currentLanguage] || i18n.ko;

  function render() {
    const keys = loadSavedKeys();
    const currentDefault = getDefaultKeyName();
    const isBuiltinDefault = currentDefault === BUILTIN_KEY_ID;

    const modal = document.createElement('div');
    modal.className = 'modal vmd-key-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content vmd-key-content vmd-key-manager-content">
        <div class="modal-header">
          <h2>${t.vmdKeyManager || '암호화 키 관리'}</h2>
          <button class="modal-close vmd-key-close">${SVG_CLOSE}</button>
        </div>
        <div class="vmd-key-body">
          <div class="vmd-key-manager-add">
            <div class="vmd-key-add-section">
              <div class="vmd-key-field">
                <label>${t.vmdKeyName || '키 이름'}</label>
                <input type="text" id="vmd-mgr-name" placeholder="${t.vmdKeyName || '키 이름'}" />
              </div>
              <div class="vmd-key-field">
                <label>${t.vmdKeyValue || '키 값 (hex)'}</label>
                <div class="vmd-key-value-row">
                  <input type="text" id="vmd-mgr-value" placeholder="${t.vmdKeyGenHint || '키생성 버튼을 눌러주세요'}" readonly />
                  <button class="vmd-key-gen-btn" id="vmd-mgr-gen">${t.vmdKeyGenerate || '키생성'}</button>
                </div>
              </div>
              <button class="vmd-key-add-btn" id="vmd-mgr-add">${t.vmdKeyAddBtn || '키 추가'}</button>
            </div>
            <div class="dropdown-divider"></div>
          </div>
          <div class="vmd-key-manager-list">
            <!-- 내장키 (삭제 불가) -->
            <div class="vmd-key-manager-item ${isBuiltinDefault ? 'is-default' : ''}">
              <div class="vmd-key-manager-info">
                <span class="vmd-key-manager-name">
                  ${t.vmdKeyBuiltin || '내장키'}
                  ${isBuiltinDefault ? `<span class="vmd-key-default-badge">${t.vmdKeyDefaultBadge || '기본'}</span>` : ''}
                </span>
                <span class="vmd-key-manager-hex">${t.vmdKeyBuiltinDesc || '앱에 내장된 암호화 키'}</span>
              </div>
              <div class="vmd-key-manager-actions">
                <button class="vmd-key-default-btn ${isBuiltinDefault ? 'active' : ''}" data-name="${BUILTIN_KEY_ID}" title="${t.vmdKeySetDefault || '기본키로 지정'}">
                  ${isBuiltinDefault ? SVG_STAR : SVG_STAR_EMPTY}
                </button>
              </div>
            </div>
            ${keys.map((k, i) => {
              const isDefault = currentDefault === k.name;
              return `
              <div class="vmd-key-manager-item ${isDefault ? 'is-default' : ''}" data-index="${i}">
                <div class="vmd-key-manager-info vmd-key-view-mode">
                  <span class="vmd-key-manager-name">
                    ${k.name}
                    ${isDefault ? `<span class="vmd-key-default-badge">${t.vmdKeyDefaultBadge || '기본'}</span>` : ''}
                  </span>
                  <span class="vmd-key-manager-hex">${k.hexKey.substring(0, 8)}...${k.hexKey.substring(56)}</span>
                </div>
                <div class="vmd-key-edit-form hidden">
                  <div class="vmd-key-field">
                    <label>${t.vmdKeyName || '키 이름'}</label>
                    <input type="text" class="vmd-key-edit-name" value="${k.name}" />
                  </div>
                  <div class="vmd-key-field">
                    <label>${t.vmdKeyValue || '키 값 (hex)'}</label>
                    <div class="vmd-key-value-row">
                      <input type="text" class="vmd-key-edit-hex" value="${k.hexKey}" readonly />
                      <button class="vmd-key-gen-btn vmd-key-edit-gen">${t.vmdKeyGenerate || '키생성'}</button>
                    </div>
                  </div>
                  <div class="vmd-key-edit-actions">
                    <button class="vmd-key-edit-save">${t.confirm || '확인'}</button>
                    <button class="vmd-key-edit-cancel">${t.cancel || '취소'}</button>
                  </div>
                </div>
                <div class="vmd-key-manager-actions vmd-key-view-mode">
                  <button class="vmd-key-default-btn ${isDefault ? 'active' : ''}" data-name="${k.name}" title="${t.vmdKeySetDefault || '기본키로 지정'}">
                    ${isDefault ? SVG_STAR : SVG_STAR_EMPTY}
                  </button>
                  <button class="vmd-key-edit-btn" data-index="${i}" title="${t.vmdKeyEdit || '편집'}">${SVG_EDIT}</button>
                  <button class="vmd-key-copy-btn" data-hex="${k.hexKey}" title="${t.copyCode || '복사'}">${SVG_COPY}</button>
                  <button class="vmd-key-delete-btn" data-index="${i}" title="${t.close || '삭제'}">${SVG_X_SM}</button>
                </div>
              </div>
            `}).join('')}
          </div>
          ${keys.length === 0 ? `<p class="vmd-key-empty">${t.vmdKeyEmpty || '사용자 키가 없습니다.'}</p>` : ''}
        </div>
        <div class="modal-footer">
          <div class="vmd-key-footer-left">
            <button class="vmd-key-export-btn" id="vmd-mgr-export" title="${t.vmdKeyExport || '키 내보내기'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>${t.vmdKeyExport || '내보내기'}</span>
            </button>
            <button class="vmd-key-export-btn" id="vmd-mgr-import" title="${t.vmdKeyImport || '키 가져오기'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>${t.vmdKeyImport || '가져오기'}</span>
            </button>
          </div>
          <button class="btn-primary vmd-key-close-btn">${t.close || '닫기'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    function close() {
      modal.remove();
    }

    function reopen() {
      close();
      render();
    }

    modal.querySelector('.modal-backdrop').addEventListener('click', close);
    modal.querySelector('.vmd-key-close').addEventListener('click', close);
    modal.querySelector('.vmd-key-close-btn').addEventListener('click', close);

    // Export keys
    modal.querySelector('#vmd-mgr-export')?.addEventListener('click', async () => {
      const keys = loadSavedKeys();
      if (keys.length === 0) return;
      const exportData = {
        format: 'vexa-md-keys',
        version: 1,
        exported: new Date().toISOString(),
        keys: keys.map(k => ({ name: k.name, hexKey: k.hexKey }))
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      if (dialogSave) {
        try {
          const savePath = await dialogSave({
            defaultPath: 'vmd-keys.json',
            filters: [{ name: 'JSON', extensions: ['json'] }]
          });
          if (savePath) {
            await tauriApi.invoke('write_file', { path: savePath, content: jsonStr });
          }
        } catch (e) {
          console.error('Key export failed:', e);
        }
      } else {
        // Fallback for browser
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vmd-keys.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    // Import keys
    modal.querySelector('#vmd-mgr-import')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.format !== 'vexa-md-keys' || !Array.isArray(data.keys)) {
            alert(t.vmdKeyImportError || '유효한 키 파일이 아닙니다.');
            return;
          }
          let imported = 0;
          for (const k of data.keys) {
            if (k.name && k.hexKey && k.hexKey.length === 64 && /^[0-9a-fA-F]+$/.test(k.hexKey)) {
              addSavedKey(k.name, k.hexKey);
              imported++;
            }
          }
          if (imported > 0) reopen();
        } catch {
          alert(t.vmdKeyImportError || '키 파일 읽기에 실패했습니다.');
        }
      });
      input.click();
    });

    // Set default buttons
    modal.querySelectorAll('.vmd-key-default-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setDefaultKeyName(btn.dataset.name);
        reopen();
      });
    });

    // Copy buttons
    modal.querySelectorAll('.vmd-key-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.hex);
        btn.innerHTML = SVG_CHECK;
        setTimeout(() => { btn.innerHTML = SVG_COPY; }, 1500);
      });
    });

    // Delete buttons
    modal.querySelectorAll('.vmd-key-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.index);
        const keys = loadSavedKeys();
        const keyName = keys[idx]?.name || '';
        const confirmed = await showConfirmDialog(
          (t.vmdKeyDeleteConfirm || '"{name}" 키를 삭제하시겠습니까?').replace('{name}', keyName), t
        );
        if (!confirmed) return;
        if (getDefaultKeyName() === keyName) {
          setDefaultKeyName(BUILTIN_KEY_ID);
        }
        keys.splice(idx, 1);
        saveKeys(keys);
        reopen();
      });
    });

    // Edit buttons — toggle inline edit form
    modal.querySelectorAll('.vmd-key-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.vmd-key-manager-item');
        item.querySelectorAll('.vmd-key-view-mode').forEach(el => el.classList.add('hidden'));
        item.querySelector('.vmd-key-edit-form').classList.remove('hidden');
      });
    });

    // Edit save
    modal.querySelectorAll('.vmd-key-edit-save').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.vmd-key-manager-item');
        const idx = parseInt(item.dataset.index);
        const newName = item.querySelector('.vmd-key-edit-name').value.trim();
        const newHex = item.querySelector('.vmd-key-edit-hex').value.trim();
        if (!newName) { item.querySelector('.vmd-key-edit-name').focus(); return; }
        if (!newHex || newHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(newHex)) {
          item.querySelector('.vmd-key-edit-hex').focus();
          item.querySelector('.vmd-key-edit-hex').style.borderColor = 'var(--accent)';
          return;
        }
        const keys = loadSavedKeys();
        const oldName = keys[idx].name;
        keys[idx].name = newName;
        keys[idx].hexKey = newHex;
        saveKeys(keys);
        // Update default key name if it was renamed
        if (getDefaultKeyName() === oldName && oldName !== newName) {
          setDefaultKeyName(newName);
        }
        reopen();
      });
    });

    // Edit random key
    modal.querySelectorAll('.vmd-key-edit-gen').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const hex = await tauriApi.invoke('generate_random_key');
          const item = btn.closest('.vmd-key-manager-item');
          item.querySelector('.vmd-key-edit-hex').value = hex;
        } catch (e) {
          console.error('Random key generation failed:', e);
        }
      });
    });

    // Edit cancel
    modal.querySelectorAll('.vmd-key-edit-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.vmd-key-manager-item');
        item.querySelectorAll('.vmd-key-view-mode').forEach(el => el.classList.remove('hidden'));
        item.querySelector('.vmd-key-edit-form').classList.add('hidden');
      });
    });

    // Generate random
    modal.querySelector('#vmd-mgr-gen')?.addEventListener('click', async () => {
      try {
        const hex = await tauriApi.invoke('generate_random_key');
        modal.querySelector('#vmd-mgr-value').value = hex;
      } catch (e) {
        console.error('Random key generation failed:', e);
      }
    });

    // Add key
    modal.querySelector('#vmd-mgr-add')?.addEventListener('click', () => {
      const name = modal.querySelector('#vmd-mgr-name').value.trim();
      const hex = modal.querySelector('#vmd-mgr-value').value.trim();
      if (!name) { modal.querySelector('#vmd-mgr-name').focus(); return; }
      if (!hex || hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
        modal.querySelector('#vmd-mgr-value').focus();
        modal.querySelector('#vmd-mgr-value').style.borderColor = 'var(--accent)';
        return;
      }
      addSavedKey(name, hex);
      reopen();
    });
  }

  render();
}
