/**
 * Vexa MD - Plugin UI Module
 *
 * Provides UI for managing plugins: listing, enabling/disabling, settings
 */

import { pluginManager } from '../../core/plugin-manager.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { store } from '../../core/store.js';
import { i18n } from '../../i18n.js';
import { $id, createElement, show, hide } from '../../core/dom.js';

class PluginUI {
  constructor() {
    this.modal = null;
    this.initialized = false;
  }

  /**
   * Get current language translations
   */
  get lang() {
    return i18n[store.get('language') || 'ko'];
  }

  /**
   * Initialize the Plugin UI
   */
  init() {
    if (this.initialized) return;

    // Create modal if not exists
    this.createModal();

    // Setup event listeners
    this.setupEventListeners();

    this.initialized = true;
  }

  /**
   * Create the plugin management modal
   */
  createModal() {
    // Check if already exists
    if ($id('plugin-modal')) {
      this.modal = $id('plugin-modal');
      return;
    }

    this.modal = createElement('div', {
      id: 'plugin-modal',
      className: 'modal plugin-settings-modal hidden',
      html: `
        <div class="modal-backdrop"></div>
        <div class="modal-content plugin-settings-content">
          <div class="modal-header">
            <h2>${this.lang.pluginSettings || 'Plugins'}</h2>
            <button class="modal-close" id="plugin-modal-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="plugin-list-container">
            <div id="plugin-list" class="plugin-list"></div>
          </div>
          <div class="modal-footer">
            <button id="plugin-modal-ok" class="btn-primary">${this.lang.confirm || 'OK'}</button>
          </div>
        </div>
      `,
    });

    document.body.appendChild(this.modal);

    // Bind modal events
    this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.close());
    $id('plugin-modal-close')?.addEventListener('click', () => this.close());
    $id('plugin-modal-ok')?.addEventListener('click', () => this.close());
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Update plugin list when plugins change
    eventBus.on(EVENTS.PLUGIN_ENABLED, () => this.updatePluginList());
    eventBus.on(EVENTS.PLUGIN_DISABLED, () => this.updatePluginList());
    eventBus.on(EVENTS.PLUGINS_LOADED, () => this.updatePluginList());

    // Update texts on language change
    store.subscribe('language', () => {
      this.updateTexts();
      this.updatePluginList();
    });
  }

  /**
   * Open the plugin management modal
   */
  open() {
    if (!this.modal) this.createModal();

    this.updatePluginList();
    this.modal.classList.remove('hidden');
    eventBus.emit(EVENTS.MODAL_OPENED, { type: 'plugins' });
  }

  /**
   * Close the plugin management modal
   */
  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      eventBus.emit(EVENTS.MODAL_CLOSED, { type: 'plugins' });
    }
  }

  /**
   * Toggle the modal
   */
  toggle() {
    if (this.modal?.classList.contains('hidden')) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
   * Update the plugin list display
   */
  updatePluginList() {
    const listContainer = $id('plugin-list');
    if (!listContainer) return;

    const plugins = pluginManager.getPluginList();

    if (plugins.length === 0) {
      listContainer.innerHTML = `
        <div class="plugin-empty">
          ${this.lang.noPlugins || 'No plugins available'}
        </div>
      `;
      return;
    }

    listContainer.innerHTML = plugins.map(plugin => this.renderPluginCard(plugin)).join('');

    // Bind toggle events
    listContainer.querySelectorAll('.plugin-toggle').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const pluginId = e.target.dataset.pluginId;
        if (e.target.checked) {
          await pluginManager.enable(pluginId);
        } else {
          await pluginManager.disable(pluginId);
        }
      });
    });

    // Bind settings button events
    listContainer.querySelectorAll('.plugin-settings-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pluginId = btn.dataset.pluginId;
        this.openPluginSettings(pluginId);
      });
    });
  }

  /**
   * Render a plugin card
   * @param {Object} plugin - Plugin metadata
   * @returns {string} HTML string
   */
  renderPluginCard(plugin) {
    const hasSettings = plugin.capabilities?.settings;

    return `
      <div class="plugin-card ${plugin.enabled ? 'enabled' : 'disabled'}" data-plugin-id="${plugin.id}">
        <div class="plugin-card-header">
          <div class="plugin-info">
            <h3 class="plugin-name">${plugin.name}</h3>
            <span class="plugin-version">v${plugin.version}</span>
            ${plugin.builtIn ? `<span class="plugin-badge built-in">${this.lang.builtIn || 'Built-in'}</span>` : ''}
          </div>
          <label class="plugin-toggle-switch">
            <input type="checkbox" class="plugin-toggle" data-plugin-id="${plugin.id}" ${plugin.enabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p class="plugin-description">${plugin.description || ''}</p>
        ${plugin.author ? `<p class="plugin-author">${this.lang.author || 'Author'}: ${plugin.author}</p>` : ''}
        <div class="plugin-card-footer">
          ${hasSettings ? `
            <button class="plugin-settings-btn btn-secondary" data-plugin-id="${plugin.id}" ${!plugin.enabled ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              ${this.lang.settings || 'Settings'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Open plugin settings panel
   * @param {string} pluginId - Plugin ID
   */
  openPluginSettings(pluginId) {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin?.instance) return;

    const settings = plugin.instance.getSettings();
    const defaultSettings = plugin.PluginClass.defaultSettings || {};

    // Create settings modal
    const settingsModal = createElement('div', {
      id: `plugin-settings-${pluginId}`,
      className: 'modal plugin-settings-detail-modal',
      html: `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2>${plugin.metadata.name} ${this.lang.settings || 'Settings'}</h2>
            <button class="modal-close plugin-settings-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="plugin-settings-form">
            ${this.renderSettingsForm(settings, defaultSettings)}
          </div>
          <div class="modal-footer">
            <button class="btn-secondary plugin-settings-reset">${this.lang.reset || 'Reset'}</button>
            <button class="btn-primary plugin-settings-save">${this.lang.apply || 'Apply'}</button>
          </div>
        </div>
      `,
    });

    document.body.appendChild(settingsModal);

    // Bind events
    const closeSettings = () => {
      settingsModal.remove();
    };

    settingsModal.querySelector('.modal-backdrop').addEventListener('click', closeSettings);
    settingsModal.querySelector('.plugin-settings-close').addEventListener('click', closeSettings);

    settingsModal.querySelector('.plugin-settings-reset').addEventListener('click', () => {
      plugin.instance.updateSettings(defaultSettings);
      pluginManager.savePluginSettings(pluginId, defaultSettings);
      closeSettings();
    });

    settingsModal.querySelector('.plugin-settings-save').addEventListener('click', () => {
      const formData = this.getSettingsFormData(settingsModal.querySelector('.plugin-settings-form'));
      plugin.instance.updateSettings(formData);
      pluginManager.savePluginSettings(pluginId, formData);
      closeSettings();
    });
  }

  /**
   * Render settings form fields
   * @param {Object} settings - Current settings
   * @param {Object} defaultSettings - Default settings schema
   * @returns {string} HTML string
   */
  renderSettingsForm(settings, defaultSettings) {
    const fields = Object.entries(defaultSettings).map(([key, defaultValue]) => {
      const value = settings[key] ?? defaultValue;
      const type = typeof defaultValue;

      if (type === 'boolean') {
        return `
          <div class="settings-field">
            <label>
              <input type="checkbox" name="${key}" ${value ? 'checked' : ''}>
              <span>${this.formatSettingLabel(key)}</span>
            </label>
          </div>
        `;
      }

      if (type === 'number') {
        return `
          <div class="settings-field">
            <label>${this.formatSettingLabel(key)}</label>
            <input type="number" name="${key}" value="${value}">
          </div>
        `;
      }

      if (Array.isArray(defaultValue)) {
        return `
          <div class="settings-field">
            <label>${this.formatSettingLabel(key)}</label>
            <select name="${key}">
              ${defaultValue.map(opt => `
                <option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>
              `).join('')}
            </select>
          </div>
        `;
      }

      // String (check for predefined options)
      if (key === 'theme') {
        return `
          <div class="settings-field">
            <label>${this.formatSettingLabel(key)}</label>
            <select name="${key}">
              <option value="auto" ${value === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="default" ${value === 'default' ? 'selected' : ''}>Default</option>
              <option value="dark" ${value === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="forest" ${value === 'forest' ? 'selected' : ''}>Forest</option>
              <option value="neutral" ${value === 'neutral' ? 'selected' : ''}>Neutral</option>
            </select>
          </div>
        `;
      }

      return `
        <div class="settings-field">
          <label>${this.formatSettingLabel(key)}</label>
          <input type="text" name="${key}" value="${value}">
        </div>
      `;
    });

    return fields.length > 0 ? fields.join('') : `<p class="no-settings">${this.lang.noSettings || 'No settings available'}</p>`;
  }

  /**
   * Format setting key to readable label
   * @param {string} key - Setting key
   * @returns {string} Formatted label
   */
  formatSettingLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Get form data from settings form
   * @param {HTMLElement} form - Form element
   * @returns {Object} Settings object
   */
  getSettingsFormData(form) {
    const data = {};
    form.querySelectorAll('input, select').forEach(input => {
      if (input.type === 'checkbox') {
        data[input.name] = input.checked;
      } else if (input.type === 'number') {
        data[input.name] = parseFloat(input.value);
      } else {
        data[input.name] = input.value;
      }
    });
    return data;
  }

  /**
   * Update texts when language changes
   */
  updateTexts() {
    if (!this.modal) return;

    const header = this.modal.querySelector('.modal-header h2');
    if (header) header.textContent = this.lang.pluginSettings || 'Plugins';

    const okBtn = $id('plugin-modal-ok');
    if (okBtn) okBtn.textContent = this.lang.confirm || 'OK';
  }
}

// Export singleton instance
export const pluginUI = new PluginUI();
export default pluginUI;
