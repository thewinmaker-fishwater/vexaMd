/**
 * Vexa MD - Plugin Manager
 *
 * Manages plugin lifecycle: loading, enabling, disabling, and uninstalling.
 */

import { eventBus, EVENTS } from './events.js';
import { store } from './store.js';
import { createPluginAPI, clearPluginExtensions } from './plugin-api.js';

// Plugin storage key
const PLUGIN_SETTINGS_KEY = 'pluginSettings';
const ENABLED_PLUGINS_KEY = 'enabledPlugins';

class PluginManager {
  constructor() {
    /**
     * Registered plugins
     * @type {Map<string, { plugin: Plugin, instance: Plugin, enabled: boolean }>}
     */
    this.plugins = new Map();

    /**
     * Built-in plugin modules (lazy loaded)
     * @type {Map<string, () => Promise<typeof Plugin>>}
     */
    this.builtInPlugins = new Map();

    this.initialized = false;
  }

  /**
   * Initialize the plugin manager
   */
  async init() {
    if (this.initialized) return;

    // Register built-in plugins
    this.registerBuiltIn();

    // Load enabled plugins from storage
    const enabledPlugins = this.getEnabledPluginIds();

    // Load and enable built-in plugins
    for (const [id, loader] of this.builtInPlugins) {
      try {
        const PluginClass = await loader();
        await this.register(PluginClass);

        // Auto-enable if it was enabled before or is new
        if (enabledPlugins.includes(id) || !enabledPlugins.length) {
          await this.enable(id);
        }
      } catch (error) {
        console.error(`Failed to load built-in plugin "${id}":`, error);
      }
    }

    this.initialized = true;
    eventBus.emit(EVENTS.PLUGINS_LOADED, { plugins: this.getPluginList() });
  }

  /**
   * Register built-in plugin loaders
   * @private
   */
  registerBuiltIn() {
    // Mermaid plugin (lazy loaded)
    this.builtInPlugins.set('mermaid', async () => {
      const module = await import('../plugins/mermaid/index.js');
      return module.default;
    });

    // Add more built-in plugins here
    // this.builtInPlugins.set('another-plugin', async () => { ... });
  }

  /**
   * Register a plugin class
   * @param {typeof Plugin} PluginClass - Plugin class to register
   */
  async register(PluginClass) {
    const { id, name } = PluginClass;

    if (this.plugins.has(id)) {
      console.warn(`Plugin "${id}" is already registered`);
      return;
    }

    this.plugins.set(id, {
      PluginClass,
      instance: null,
      enabled: false,
      metadata: {
        id,
        name,
        version: PluginClass.version,
        description: PluginClass.description,
        author: PluginClass.author,
        homepage: PluginClass.homepage,
        capabilities: PluginClass.capabilities,
        builtIn: this.builtInPlugins.has(id),
      },
    });

    eventBus.emit(EVENTS.PLUGIN_REGISTERED, { id, name });
  }

  /**
   * Enable a plugin
   * @param {string} pluginId - Plugin ID to enable
   */
  async enable(pluginId) {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      console.error(`Plugin "${pluginId}" not found`);
      return false;
    }

    if (entry.enabled) {
      return true; // Already enabled
    }

    try {
      // Create plugin API
      const api = createPluginAPI(pluginId);

      // Create plugin instance
      const instance = new entry.PluginClass(api);

      // Load saved settings
      const savedSettings = this.getPluginSettings(pluginId);
      if (savedSettings) {
        instance.updateSettings(savedSettings);
      }

      // Initialize plugin
      await instance.init();

      // Update state
      entry.instance = instance;
      entry.enabled = true;

      // Save enabled state
      this.saveEnabledState(pluginId, true);

      eventBus.emit(EVENTS.PLUGIN_ENABLED, { id: pluginId });
      return true;
    } catch (error) {
      console.error(`Failed to enable plugin "${pluginId}":`, error);
      eventBus.emit(EVENTS.PLUGIN_ERROR, { id: pluginId, error });
      return false;
    }
  }

  /**
   * Disable a plugin
   * @param {string} pluginId - Plugin ID to disable
   */
  async disable(pluginId) {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      console.error(`Plugin "${pluginId}" not found`);
      return false;
    }

    if (!entry.enabled) {
      return true; // Already disabled
    }

    try {
      // Destroy plugin instance
      if (entry.instance) {
        await entry.instance.destroy();
      }

      // Clear plugin extensions
      clearPluginExtensions(pluginId);

      // Update state
      entry.instance = null;
      entry.enabled = false;

      // Save enabled state
      this.saveEnabledState(pluginId, false);

      eventBus.emit(EVENTS.PLUGIN_DISABLED, { id: pluginId });
      return true;
    } catch (error) {
      console.error(`Failed to disable plugin "${pluginId}":`, error);
      eventBus.emit(EVENTS.PLUGIN_ERROR, { id: pluginId, error });
      return false;
    }
  }

  /**
   * Toggle plugin enabled state
   * @param {string} pluginId - Plugin ID to toggle
   */
  async toggle(pluginId) {
    const entry = this.plugins.get(pluginId);
    if (!entry) return false;

    return entry.enabled ? this.disable(pluginId) : this.enable(pluginId);
  }

  /**
   * Uninstall a plugin (only for non-built-in plugins)
   * @param {string} pluginId - Plugin ID to uninstall
   */
  async uninstall(pluginId) {
    const entry = this.plugins.get(pluginId);
    if (!entry) return false;

    if (entry.metadata.builtIn) {
      console.warn(`Cannot uninstall built-in plugin "${pluginId}"`);
      return false;
    }

    // Disable first
    await this.disable(pluginId);

    // Remove from registry
    this.plugins.delete(pluginId);

    // Clear saved settings
    this.clearPluginSettings(pluginId);

    eventBus.emit(EVENTS.PLUGIN_UNINSTALLED, { id: pluginId });
    return true;
  }

  /**
   * Get a plugin by ID
   * @param {string} pluginId - Plugin ID
   * @returns {Object|null} Plugin entry or null
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Get plugin instance by ID
   * @param {string} pluginId - Plugin ID
   * @returns {Plugin|null} Plugin instance or null
   */
  getPluginInstance(pluginId) {
    const entry = this.plugins.get(pluginId);
    return entry?.instance || null;
  }

  /**
   * Get list of all plugins with their metadata
   * @returns {Array<Object>}
   */
  getPluginList() {
    return Array.from(this.plugins.values()).map(entry => ({
      ...entry.metadata,
      enabled: entry.enabled,
    }));
  }

  /**
   * Get list of enabled plugins
   * @returns {Array<Object>}
   */
  getEnabledPlugins() {
    return this.getPluginList().filter(p => p.enabled);
  }

  /**
   * Get enabled plugin IDs from storage
   * @private
   */
  getEnabledPluginIds() {
    try {
      const saved = localStorage.getItem(ENABLED_PLUGINS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save enabled state to storage
   * @private
   */
  saveEnabledState(pluginId, enabled) {
    const enabledPlugins = this.getEnabledPluginIds();

    if (enabled && !enabledPlugins.includes(pluginId)) {
      enabledPlugins.push(pluginId);
    } else if (!enabled) {
      const index = enabledPlugins.indexOf(pluginId);
      if (index > -1) enabledPlugins.splice(index, 1);
    }

    localStorage.setItem(ENABLED_PLUGINS_KEY, JSON.stringify(enabledPlugins));
  }

  /**
   * Get plugin settings from storage
   * @param {string} pluginId - Plugin ID
   * @returns {Object|null}
   */
  getPluginSettings(pluginId) {
    try {
      const allSettings = JSON.parse(localStorage.getItem(PLUGIN_SETTINGS_KEY) || '{}');
      return allSettings[pluginId] || null;
    } catch {
      return null;
    }
  }

  /**
   * Save plugin settings to storage
   * @param {string} pluginId - Plugin ID
   * @param {Object} settings - Settings to save
   */
  savePluginSettings(pluginId, settings) {
    try {
      const allSettings = JSON.parse(localStorage.getItem(PLUGIN_SETTINGS_KEY) || '{}');
      allSettings[pluginId] = settings;
      localStorage.setItem(PLUGIN_SETTINGS_KEY, JSON.stringify(allSettings));

      // Update instance if running
      const entry = this.plugins.get(pluginId);
      if (entry?.instance) {
        entry.instance.updateSettings(settings);
      }

      eventBus.emit(EVENTS.PLUGIN_SETTINGS_CHANGED, { id: pluginId, settings });
    } catch (error) {
      console.error(`Failed to save settings for plugin "${pluginId}":`, error);
    }
  }

  /**
   * Clear plugin settings from storage
   * @private
   */
  clearPluginSettings(pluginId) {
    try {
      const allSettings = JSON.parse(localStorage.getItem(PLUGIN_SETTINGS_KEY) || '{}');
      delete allSettings[pluginId];
      localStorage.setItem(PLUGIN_SETTINGS_KEY, JSON.stringify(allSettings));
    } catch {
      // Ignore errors
    }
  }

  /**
   * Install a plugin from URL (for future use)
   * @param {string} url - Plugin URL
   */
  async installFromUrl(url) {
    // Future implementation for online plugin marketplace
    console.warn('Online plugin installation not yet implemented');
    return false;
  }
}

// Export singleton instance
export const pluginManager = new PluginManager();
export default pluginManager;
