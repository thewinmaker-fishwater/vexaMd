/**
 * EventBus - 모듈 간 통신을 위한 이벤트 시스템
 */

class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
    return () => this.off(event, callback);
  }

  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  off(event, callback) {
    if (callback) {
      this.events.get(event)?.delete(callback);
    } else {
      this.events.delete(event);
    }
  }

  emit(event, data) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus error for event "${event}":`, error);
        }
      });
    }

    const namespace = event.split(':')[0];
    if (namespace !== event) {
      const wildcardEvent = `${namespace}:*`;
      const wildcardCallbacks = this.events.get(wildcardEvent);
      if (wildcardCallbacks) {
        wildcardCallbacks.forEach(callback => {
          try {
            callback({ event, data });
          } catch (error) {
            console.error(`EventBus wildcard error for "${wildcardEvent}":`, error);
          }
        });
      }
    }
  }

  clear() {
    this.events.clear();
  }

  listenerCount(event) {
    return this.events.get(event)?.size || 0;
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  THEME_CHANGED: 'theme:changed',
  COLOR_THEME_CHANGED: 'theme:color-changed',
  CUSTOM_THEME_APPLIED: 'theme:custom-applied',

  TAB_CREATED: 'tab:created',
  TAB_SWITCHED: 'tab:switched',
  TAB_CLOSED: 'tab:closed',

  FILE_OPENED: 'file:opened',
  FILE_LOADED: 'file:loaded',
  FILE_DROPPED: 'file:dropped',
  RECENT_FILES_UPDATED: 'file:recent-updated',

  CONTENT_RENDERED: 'viewer:rendered',
  PAGE_CHANGED: 'viewer:page-changed',
  VIEW_MODE_CHANGED: 'viewer:mode-changed',
  ZOOM_CHANGED: 'viewer:zoom-changed',

  SEARCH_OPENED: 'search:opened',
  SEARCH_CLOSED: 'search:closed',
  SEARCH_PERFORMED: 'search:performed',
  SEARCH_MATCH_CHANGED: 'search:match-changed',

  EDITOR_MODE_CHANGED: 'editor:mode-changed',
  EDITOR_CONTENT_CHANGED: 'editor:content-changed',
  FILE_SAVED: 'file:saved',
  FILE_DIRTY_CHANGED: 'file:dirty-changed',

  PRESENTATION_STARTED: 'presentation:started',
  PRESENTATION_ENDED: 'presentation:ended',
  PRESENTATION_SLIDE_CHANGED: 'presentation:slide-changed',

  MODAL_OPENED: 'ui:modal-opened',
  MODAL_CLOSED: 'ui:modal-closed',
  DROPDOWN_OPENED: 'ui:dropdown-opened',
  DROPDOWN_CLOSED: 'ui:dropdown-closed',
  NOTIFICATION_SHOWN: 'ui:notification-shown',

  LANGUAGE_CHANGED: 'i18n:language-changed',

  APP_INITIALIZED: 'app:initialized',
  APP_READY: 'app:ready'
};
