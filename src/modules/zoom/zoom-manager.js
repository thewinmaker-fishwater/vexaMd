/**
 * Zoom Manager Module
 * setViewMode, setZoom, zoomIn/Out/Reset, pan, cursor mode
 */

const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

let currentViewMode = localStorage.getItem('viewMode') || 'single';
let currentZoom = parseInt(localStorage.getItem('zoom') || '100');

// Pan state
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panScrollLeft = 0;
let panScrollTop = 0;

// Hand mode
let isHandMode = false;

let els = {};
let ctx = {};

export function init(context) {
  els = {
    content: document.getElementById('content'),
    btnViewSingle: document.getElementById('btn-view-single'),
    btnViewDouble: document.getElementById('btn-view-double'),
    btnViewPaging: document.getElementById('btn-view-paging'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    zoomLevelDisplay: document.getElementById('zoom-level'),
    btnCursorMode: document.getElementById('btn-cursor-mode'),
    iconCursor: document.getElementById('icon-cursor'),
    iconHand: document.getElementById('icon-hand'),
  };
  ctx = context;

  els.btnViewSingle.addEventListener('click', () => setViewMode('single'));
  els.btnViewDouble.addEventListener('click', () => setViewMode('double'));
  els.btnViewPaging.addEventListener('click', () => setViewMode('paging'));
  els.btnZoomIn.addEventListener('click', zoomIn);
  els.btnZoomOut.addEventListener('click', zoomOut);
  els.btnZoomReset.addEventListener('click', zoomReset);

  // Pan events
  els.content.addEventListener('mousedown', onPanMouseDown);
  els.content.addEventListener('mousemove', onPanMouseMove);
  els.content.addEventListener('mouseup', onPanMouseUp);
  els.content.addEventListener('mouseleave', onPanMouseLeave);

  els.btnCursorMode?.addEventListener('click', toggleCursorMode);

  // Ctrl+wheel zoom
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) { zoomIn(); } else { zoomOut(); }
    }
  }, { passive: false });
}

export function getCurrentViewMode() {
  return currentViewMode;
}

export function setViewMode(mode) {
  currentViewMode = mode;
  localStorage.setItem('viewMode', mode);

  els.btnViewSingle.classList.remove('active');
  els.btnViewDouble.classList.remove('active');
  els.btnViewPaging.classList.remove('active');

  if (mode === 'single') els.btnViewSingle.classList.add('active');
  else if (mode === 'double') els.btnViewDouble.classList.add('active');
  else if (mode === 'paging') els.btnViewPaging.classList.add('active');

  ctx.onViewModeChange?.(mode);
}

export function setZoom(level) {
  const { getActiveTabId, HOME_TAB_ID, getTabs } = ctx;
  if (getActiveTabId() === HOME_TAB_ID) return;

  level = Math.max(ZOOM_LEVELS[0], Math.min(ZOOM_LEVELS[ZOOM_LEVELS.length - 1], level));
  let nearest = ZOOM_LEVELS.reduce((prev, curr) =>
    Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev
  );

  currentZoom = nearest;
  const currentTab = getTabs().find(t => t.id === getActiveTabId());
  if (currentTab) currentTab.zoom = nearest;

  els.content.setAttribute('data-zoom', nearest.toString());
  els.zoomLevelDisplay.textContent = `${nearest}%`;
  updatePanMode();
}

export function applyTabZoom(tabId) {
  const { HOME_TAB_ID, getTabs } = ctx;
  let zoom = 100;
  if (tabId !== HOME_TAB_ID) {
    const tab = getTabs().find(t => t.id === tabId);
    if (tab) zoom = tab.zoom || 100;
  }
  currentZoom = zoom;
  els.content.setAttribute('data-zoom', zoom.toString());
  els.zoomLevelDisplay.textContent = `${zoom}%`;
  updatePanMode();
}

export function zoomIn() {
  if (ctx.getActiveTabId() === ctx.HOME_TAB_ID) return;
  const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
  if (currentIndex < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[currentIndex + 1]);
}

export function zoomOut() {
  if (ctx.getActiveTabId() === ctx.HOME_TAB_ID) return;
  const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
  if (currentIndex > 0) setZoom(ZOOM_LEVELS[currentIndex - 1]);
}

export function zoomReset() {
  if (ctx.getActiveTabId() === ctx.HOME_TAB_ID) return;
  setZoom(100);
}

// ========== Pan ==========
function updatePanMode() {
  if (isHandMode) {
    els.content.classList.add('pan-enabled');
  } else {
    els.content.classList.remove('pan-enabled');
    els.content.classList.remove('panning');
    isPanning = false;
  }
}

function toggleCursorMode() {
  isHandMode = !isHandMode;
  els.iconCursor.style.display = isHandMode ? 'none' : '';
  els.iconHand.style.display = isHandMode ? '' : 'none';
  els.btnCursorMode.classList.toggle('active', isHandMode);
  updatePanMode();
}

function isInteractivePanElement(element) {
  const interactiveTags = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL'];
  const interactiveClasses = ['tab', 'tab-close', 'page-nav-btn', 'search-nav', 'search-box'];
  let current = element;
  while (current && current !== els.content) {
    if (interactiveTags.includes(current.tagName)) return true;
    if (interactiveClasses.some(cls => current.classList?.contains(cls))) return true;
    current = current.parentElement;
  }
  return false;
}

function onPanMouseDown(e) {
  if (!isHandMode) return;
  if (e.button !== 0) return;
  if (isInteractivePanElement(e.target)) return;
  isPanning = true;
  panStartX = e.pageX;
  panStartY = e.pageY;
  panScrollLeft = els.content.scrollLeft;
  panScrollTop = els.content.scrollTop;
  els.content.classList.add('panning');
  e.preventDefault();
}

function onPanMouseMove(e) {
  if (!isPanning) return;
  e.preventDefault();
  els.content.scrollLeft = panScrollLeft - (e.pageX - panStartX);
  els.content.scrollTop = panScrollTop - (e.pageY - panStartY);
}

function onPanMouseUp() {
  if (!isPanning) return;
  isPanning = false;
  els.content.classList.remove('panning');
}

function onPanMouseLeave() {
  if (!isPanning) return;
  isPanning = false;
  els.content.classList.remove('panning');
}
