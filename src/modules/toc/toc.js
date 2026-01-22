// TOC (Table of Contents) Module
// 마크다운 헤딩 기반 목차 사이드바

import { i18n } from '../../i18n.js';

// DOM Elements
const tocSidebar = document.getElementById('toc-sidebar');
const tocList = document.getElementById('toc-list');
const tocCloseBtn = document.getElementById('toc-close');
const tocTitle = document.querySelector('.toc-title');
const btnToc = document.getElementById('btn-toc');
const content = document.getElementById('content');

// State
let tocVisible = localStorage.getItem('tocVisible') === 'true';
let currentHeadings = [];
let activeHeadingId = null;

/**
 * 현재 언어의 번역 텍스트 가져오기
 */
function t(key) {
  const lang = localStorage.getItem('language') || 'ko';
  return i18n[lang]?.[key] || i18n.ko[key] || key;
}

/**
 * TOC 사이드바 토글
 */
export function toggleToc() {
  tocVisible = !tocVisible;
  updateTocVisibility();
  localStorage.setItem('tocVisible', tocVisible);
}

/**
 * TOC 사이드바 표시
 */
export function showToc() {
  tocVisible = true;
  updateTocVisibility();
  localStorage.setItem('tocVisible', tocVisible);
}

/**
 * TOC 사이드바 숨기기
 */
export function hideToc() {
  tocVisible = false;
  updateTocVisibility();
  localStorage.setItem('tocVisible', tocVisible);
}

/**
 * TOC 상태 가져오기 (탭별 상태 관리용)
 */
export function getTocVisible() {
  return tocVisible;
}

/**
 * TOC 상태 설정 (탭별 상태 관리용, localStorage 저장 안함)
 */
export function setTocVisible(visible) {
  tocVisible = visible;
  updateTocVisibility();
}

/**
 * TOC 가시성 업데이트
 */
function updateTocVisibility() {
  if (tocVisible && currentHeadings.length > 0) {
    tocSidebar.classList.remove('hidden');
    btnToc.classList.add('active');
  } else {
    tocSidebar.classList.add('hidden');
    btnToc.classList.remove('active');
  }
}

/**
 * 마크다운 콘텐츠에서 헤딩 추출 및 TOC 생성
 */
export function generateToc() {
  // 콘텐츠 영역에서 헤딩 요소 찾기
  const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
  currentHeadings = [];

  // 헤딩이 없으면 TOC 숨기기
  if (headings.length === 0) {
    tocList.innerHTML = `<li class="toc-empty">${t('tocEmpty')}</li>`;
    if (tocVisible) {
      tocSidebar.classList.add('hidden');
    }
    return;
  }

  // 헤딩에 ID 부여 및 목록 생성
  headings.forEach((heading, index) => {
    // ID가 없으면 생성
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }

    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent.trim();

    currentHeadings.push({
      id: heading.id,
      level,
      text,
      element: heading
    });
  });

  // TOC 목록 렌더링
  renderTocList();

  // TOC 가시성 업데이트
  updateTocVisibility();

  // 스크롤 이벤트로 현재 섹션 하이라이트
  setupScrollSpy();
}

/**
 * TOC 목록 렌더링
 */
function renderTocList() {
  if (currentHeadings.length === 0) {
    tocList.innerHTML = `<li class="toc-empty">${t('tocEmpty')}</li>`;
    return;
  }

  // 최소 레벨 찾기 (들여쓰기 기준)
  const minLevel = Math.min(...currentHeadings.map(h => h.level));

  const html = currentHeadings.map(heading => {
    const indent = heading.level - minLevel;
    const activeClass = heading.id === activeHeadingId ? 'active' : '';

    return `
      <li class="toc-item toc-level-${indent} ${activeClass}" data-id="${heading.id}">
        <a href="#${heading.id}" class="toc-link" title="${heading.text}">
          ${escapeHtml(heading.text)}
        </a>
      </li>
    `;
  }).join('');

  tocList.innerHTML = html;

  // 클릭 이벤트 바인딩
  tocList.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', handleTocClick);
  });
}

/**
 * TOC 항목 클릭 핸들러
 */
function handleTocClick(e) {
  e.preventDefault();

  const id = e.currentTarget.getAttribute('href').slice(1);
  const heading = document.getElementById(id);

  if (heading) {
    // 부드러운 스크롤
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 활성 상태 업데이트
    setActiveHeading(id);
  }
}

/**
 * 활성 헤딩 설정
 */
function setActiveHeading(id) {
  activeHeadingId = id;

  // 모든 항목에서 active 클래스 제거
  tocList.querySelectorAll('.toc-item').forEach(item => {
    item.classList.remove('active');
  });

  // 현재 항목에 active 클래스 추가
  const activeItem = tocList.querySelector(`[data-id="${id}"]`);
  if (activeItem) {
    activeItem.classList.add('active');

    // 활성 항목이 보이도록 스크롤
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * 스크롤 스파이 설정 (현재 보고 있는 섹션 하이라이트)
 */
function setupScrollSpy() {
  // 이전 observer 정리
  if (window.tocObserver) {
    window.tocObserver.disconnect();
  }

  // Intersection Observer 설정
  const options = {
    root: content,
    rootMargin: '-10% 0px -80% 0px',
    threshold: 0
  };

  window.tocObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveHeading(entry.target.id);
      }
    });
  }, options);

  // 모든 헤딩 관찰
  currentHeadings.forEach(heading => {
    if (heading.element) {
      window.tocObserver.observe(heading.element);
    }
  });
}

/**
 * TOC 초기화 (파일 닫을 때)
 */
export function clearToc() {
  currentHeadings = [];
  activeHeadingId = null;
  tocList.innerHTML = '';

  if (window.tocObserver) {
    window.tocObserver.disconnect();
  }

  tocSidebar.classList.add('hidden');
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * TOC UI 텍스트 업데이트 (언어 변경 시)
 */
export function updateTocTexts() {
  if (tocTitle) {
    tocTitle.textContent = t('tocTitle');
  }
  if (btnToc) {
    btnToc.title = t('toc');
  }
  // 목록이 비어있으면 empty 메시지 업데이트
  const emptyItem = tocList?.querySelector('.toc-empty');
  if (emptyItem) {
    emptyItem.textContent = t('tocEmpty');
  }
}

/**
 * TOC 초기화
 */
export function initToc() {
  // 닫기 버튼 이벤트
  tocCloseBtn?.addEventListener('click', hideToc);

  // 툴바 버튼 이벤트
  btnToc?.addEventListener('click', toggleToc);

  // 초기 상태 (저장된 상태 복원하지 않고 숨김 상태로 시작)
  // 파일을 열어야 TOC가 의미있으므로
  tocSidebar.classList.add('hidden');

  // 초기 텍스트 설정
  updateTocTexts();
}

// 모듈 로드 시 초기화
initToc();
