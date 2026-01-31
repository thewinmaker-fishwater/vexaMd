/**
 * Vexa MD - Plugin Manager
 *
 * Manages plugin lifecycle: loading, enabling, disabling, and uninstalling.
 * Supports plugin.json manifests and external plugin installation.
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
     * @type {Map<string, Object>}
     */
    this.plugins = new Map();

    /**
     * Built-in plugin modules (lazy loaded)
     * @type {Map<string, () => Promise<typeof Plugin>>}
     */
    this.builtInPlugins = new Map();

    /**
     * Built-in plugin manifests (keyed by plugin id)
     * @type {Map<string, Object>}
     */
    this.builtInManifests = new Map();

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
        const manifest = this.builtInManifests.get(id) || null;
        await this.register(PluginClass, manifest);

        // Auto-enable if it was enabled before or is new
        if (enabledPlugins.includes(id) || !enabledPlugins.length) {
          await this.enable(id);
        }
      } catch (error) {
        console.error(`Failed to load built-in plugin "${id}":`, error);
        // Store error for UI display
        this.plugins.set(id, {
          PluginClass: null,
          instance: null,
          enabled: false,
          error: { message: error.message, stack: error.stack, timestamp: Date.now() },
          metadata: {
            id,
            name: id,
            version: '?',
            description: '',
            builtIn: true,
          },
        });
      }
    }

    // Scan external plugin directory
    await this.scanPluginDirectory();

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

    // Word Counter plugin (for testing all settings types)
    this.builtInPlugins.set('word-counter', async () => {
      const module = await import('../plugins/word-counter/index.js');
      return module.default;
    });

    // Load built-in manifests
    this.builtInManifests.set('mermaid', null); // Will be loaded from plugin.json
    this.loadBuiltInManifest('mermaid', '../plugins/mermaid/plugin.json');

    this.builtInManifests.set('word-counter', null);
    this.loadBuiltInManifest('word-counter', '../plugins/word-counter/plugin.json');
  }

  /**
   * Load a built-in plugin manifest
   * @private
   */
  async loadBuiltInManifest(id, path) {
    try {
      const response = await fetch(new URL(path, import.meta.url));
      if (response.ok) {
        const manifest = await response.json();
        const validated = this.validateManifest(manifest);
        if (validated) {
          this.builtInManifests.set(id, validated);
          // Update metadata if plugin already registered
          const entry = this.plugins.get(id);
          if (entry) {
            this.mergeManifestMetadata(entry, validated);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load manifest for built-in plugin "${id}":`, error);
    }
  }

  /**
   * Validate a plugin manifest object
   * @param {Object} manifest - Raw manifest object
   * @returns {Object|null} Validated manifest or null if invalid
   */
  validateManifest(manifest) {
    if (!manifest || typeof manifest !== 'object') return null;

    const required = ['id', 'name', 'version', 'main'];
    for (const field of required) {
      if (!manifest[field] || typeof manifest[field] !== 'string') {
        console.warn(`Invalid manifest: missing or invalid "${field}" field`);
        return null;
      }
    }

    // Validate id format (alphanumeric + hyphens)
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      console.warn(`Invalid manifest: id "${manifest.id}" must be lowercase alphanumeric with hyphens`);
      return null;
    }

    return manifest;
  }

  /**
   * Merge manifest metadata into a plugin entry
   * @private
   */
  mergeManifestMetadata(entry, manifest) {
    if (!manifest) return;
    entry.metadata = {
      ...entry.metadata,
      name: manifest.name || entry.metadata.name,
      version: manifest.version || entry.metadata.version,
      description: manifest.description || entry.metadata.description,
      author: manifest.author || entry.metadata.author,
      homepage: manifest.homepage || entry.metadata.homepage,
      capabilities: manifest.capabilities || entry.metadata.capabilities,
    };
    if (manifest.settings) {
      entry.settingsSchema = manifest.settings;
    }
  }

  /**
   * Register a plugin class
   * @param {typeof Plugin} PluginClass - Plugin class to register
   * @param {Object|null} manifest - Optional manifest from plugin.json
   */
  async register(PluginClass, manifest = null) {
    const { id, name } = PluginClass;

    if (this.plugins.has(id)) {
      console.warn(`Plugin "${id}" is already registered`);
      return;
    }

    const entry = {
      PluginClass,
      instance: null,
      enabled: false,
      error: null,
      settingsSchema: null,
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
    };

    // Merge manifest data if available
    if (manifest) {
      this.mergeManifestMetadata(entry, manifest);
    }

    this.plugins.set(id, entry);
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

    if (!entry.PluginClass) {
      entry.error = { message: 'Plugin class not loaded', timestamp: Date.now() };
      eventBus.emit(EVENTS.PLUGIN_ERROR, { id: pluginId, error: entry.error });
      return false;
    }

    try {
      // Clear previous error
      entry.error = null;

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
      entry.error = { message: error.message, stack: error.stack, timestamp: Date.now() };
      eventBus.emit(EVENTS.PLUGIN_ERROR, { id: pluginId, error: entry.error });
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
   * Retry enabling a failed plugin
   * @param {string} pluginId - Plugin ID to retry
   */
  async retry(pluginId) {
    const entry = this.plugins.get(pluginId);
    if (!entry) return false;

    entry.error = null;
    return this.enable(pluginId);
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

    // Try to remove plugin directory via Tauri FS
    try {
      const pluginDir = await this.getPluginDirectory();
      if (pluginDir && window.__TAURI__) {
        const { removeDir } = window.__TAURI__.fs;
        await removeDir(`${pluginDir}/${pluginId}`, { recursive: true });
      }
    } catch (error) {
      console.warn(`Failed to remove plugin directory for "${pluginId}":`, error);
    }

    // Remove from registry
    this.plugins.delete(pluginId);

    // Clear saved settings
    this.clearPluginSettings(pluginId);

    eventBus.emit(EVENTS.PLUGIN_UNINSTALLED, { id: pluginId });
    return true;
  }

  /**
   * Get the external plugins directory path
   * @returns {Promise<string|null>}
   */
  async getPluginDirectory() {
    try {
      if (window.__TAURI__) {
        const { appDataDir } = window.__TAURI__.path;
        const base = await appDataDir();
        return `${base}plugins`;
      }
    } catch {
      // Not in Tauri environment
    }
    return null;
  }

  /**
   * Scan external plugin directory for installed plugins
   */
  async scanPluginDirectory() {
    try {
      const pluginDir = await this.getPluginDirectory();
      if (!pluginDir || !window.__TAURI__) return;

      const { readDir, readTextFile, exists, createDir } = window.__TAURI__.fs;

      // Ensure plugin directory exists
      const dirExists = await exists(pluginDir);
      if (!dirExists) {
        await createDir(pluginDir, { recursive: true });
        eventBus.emit(EVENTS.PLUGIN_SCAN_COMPLETE, { found: 0 });
        return;
      }

      const entries = await readDir(pluginDir);
      const enabledPlugins = this.getEnabledPluginIds();
      let found = 0;

      for (const entry of entries) {
        if (!entry.children && !entry.name) continue;

        const pluginPath = `${pluginDir}/${entry.name}`;
        const manifestPath = `${pluginPath}/plugin.json`;

        try {
          const manifestExists = await exists(manifestPath);
          if (!manifestExists) continue;

          const manifestText = await readTextFile(manifestPath);
          const manifest = JSON.parse(manifestText);
          const validated = this.validateManifest(manifest);

          if (!validated) {
            console.warn(`Invalid manifest in ${entry.name}`);
            continue;
          }

          // Skip if already registered (built-in)
          if (this.plugins.has(validated.id)) continue;

          // Register as external plugin placeholder
          this.plugins.set(validated.id, {
            PluginClass: null,
            instance: null,
            enabled: false,
            error: null,
            settingsSchema: validated.settings || null,
            pluginPath,
            metadata: {
              id: validated.id,
              name: validated.name,
              version: validated.version,
              description: validated.description || '',
              author: validated.author || '',
              homepage: validated.homepage || '',
              capabilities: validated.capabilities || {},
              builtIn: false,
            },
          });

          // Try to dynamically load the plugin module
          try {
            const mainPath = `${pluginPath}/${validated.main}`;
            const moduleText = await readTextFile(mainPath);

            // Create a blob URL for dynamic import
            const blob = new Blob([moduleText], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const module = await import(/* @vite-ignore */ url);
            URL.revokeObjectURL(url);

            const PluginClass = module.default;
            const pluginEntry = this.plugins.get(validated.id);
            pluginEntry.PluginClass = PluginClass;

            // Auto-enable if it was previously enabled
            if (enabledPlugins.includes(validated.id)) {
              await this.enable(validated.id);
            }
          } catch (loadError) {
            console.warn(`Failed to load plugin module for "${validated.id}":`, loadError);
            const pluginEntry = this.plugins.get(validated.id);
            pluginEntry.error = { message: loadError.message, stack: loadError.stack, timestamp: Date.now() };
          }

          found++;
        } catch (error) {
          console.warn(`Failed to scan plugin "${entry.name}":`, error);
        }
      }

      eventBus.emit(EVENTS.PLUGIN_SCAN_COMPLETE, { found });
    } catch (error) {
      console.warn('Failed to scan plugin directory:', error);
    }
  }

  /**
   * Install a plugin from a folder (via Tauri dialog)
   * @param {string} sourcePath - Source folder path
   * @returns {Promise<boolean>}
   */
  async installFromFolder(sourcePath) {
    try {
      if (!window.__TAURI__) {
        console.warn('Plugin installation requires Tauri environment');
        return false;
      }

      const { readTextFile, readDir, copyFile, createDir, exists } = window.__TAURI__.fs;

      // Read and validate manifest
      const manifestPath = `${sourcePath}/plugin.json`;
      const manifestExists = await exists(manifestPath);
      if (!manifestExists) {
        throw new Error('No plugin.json found in selected folder');
      }

      const manifestText = await readTextFile(manifestPath);
      const manifest = JSON.parse(manifestText);
      const validated = this.validateManifest(manifest);
      if (!validated) {
        throw new Error('Invalid plugin.json manifest');
      }

      // Check if already installed
      if (this.plugins.has(validated.id) && this.plugins.get(validated.id).metadata.builtIn) {
        throw new Error(`Cannot overwrite built-in plugin "${validated.id}"`);
      }

      // Copy to plugin directory
      const pluginDir = await this.getPluginDirectory();
      if (!pluginDir) throw new Error('Plugin directory not available');

      const destPath = `${pluginDir}/${validated.id}`;
      await createDir(destPath, { recursive: true });

      // Copy all files from source to destination
      const sourceEntries = await readDir(sourcePath);
      for (const entry of sourceEntries) {
        if (entry.name) {
          await copyFile(`${sourcePath}/${entry.name}`, `${destPath}/${entry.name}`);
        }
      }

      // Uninstall existing version if present
      if (this.plugins.has(validated.id)) {
        await this.disable(validated.id);
        this.plugins.delete(validated.id);
      }

      // Re-scan to load the new plugin
      await this.scanPluginDirectory();

      eventBus.emit(EVENTS.PLUGIN_INSTALLED, { id: validated.id, name: validated.name });
      return true;
    } catch (error) {
      console.error('Failed to install plugin:', error);
      eventBus.emit(EVENTS.PLUGIN_ERROR, { id: 'install', error: { message: error.message } });
      return false;
    }
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
      error: entry.error,
      settingsSchema: entry.settingsSchema,
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
}

// Export singleton instance
export const pluginManager = new PluginManager();
export default pluginManager;
