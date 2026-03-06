/**
 * DOM 유틸리티
 */

export function $(selector, context = document) {
  return context.querySelector(selector);
}

export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

export function $id(id) {
  return document.getElementById(id);
}

export function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.className) element.className = options.className;
  if (options.id) element.id = options.id;
  if (options.text) element.textContent = options.text;
  if (options.html) element.innerHTML = options.html;

  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options.data) {
    Object.entries(options.data).forEach(([key, value]) => {
      element.dataset[key] = value;
    });
  }

  if (options.style) {
    Object.assign(element.style, options.style);
  }

  if (options.events) {
    Object.entries(options.events).forEach(([event, handler]) => {
      element.addEventListener(event, handler);
    });
  }

  if (options.children) {
    options.children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
  }

  return element;
}

export function createFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

export function toggleClass(element, className, force) {
  if (element) {
    return element.classList.toggle(className, force);
  }
  return false;
}

export function show(element) {
  if (element) element.classList.remove('hidden');
}

export function hide(element) {
  if (element) element.classList.add('hidden');
}

export function toggle(element, visible) {
  if (element) element.classList.toggle('hidden', !visible);
}

export function isVisible(element) {
  return element && !element.classList.contains('hidden');
}

export function delegate(container, eventType, selector, handler) {
  container.addEventListener(eventType, (event) => {
    const target = event.target.closest(selector);
    if (target && container.contains(target)) {
      handler.call(target, event, target);
    }
  });
}

export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function getRect(element) {
  return element?.getBoundingClientRect() || null;
}

export function positionBelow(dropdown, reference, options = {}) {
  const rect = getRect(reference);
  if (!rect) return;

  const { offsetX = 0, offsetY = 4 } = options;
  dropdown.style.top = `${rect.bottom + offsetY}px`;
  dropdown.style.left = `${rect.left + offsetX}px`;
}

export function scrollToElement(element, options = {}) {
  if (element) {
    element.scrollIntoView({
      behavior: options.smooth !== false ? 'smooth' : 'auto',
      block: options.block || 'center',
      inline: options.inline || 'nearest'
    });
  }
}

export function onClickOutside(element, callback) {
  const handler = (event) => {
    if (element && !element.contains(event.target)) {
      callback(event);
    }
  };
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
}

export function ready(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}
