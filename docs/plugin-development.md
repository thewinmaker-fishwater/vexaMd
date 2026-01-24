# Vexa MD Plugin Development Guide

이 문서는 Vexa MD 플러그인 개발을 위한 가이드입니다.

## 목차

1. [플러그인 구조](#플러그인-구조)
2. [Plugin 기본 클래스](#plugin-기본-클래스)
3. [Plugin API](#plugin-api)
4. [마크다운 확장](#마크다운-확장)
5. [UI 확장](#ui-확장)
6. [설정 관리](#설정-관리)
7. [이벤트 시스템](#이벤트-시스템)
8. [예제: Mermaid 플러그인](#예제-mermaid-플러그인)
9. [베스트 프랙티스](#베스트-프랙티스)

---

## 플러그인 구조

```
src/plugins/
└── my-plugin/
    ├── index.js       # 플러그인 메인 파일 (필수)
    └── plugin.json    # 플러그인 메타데이터 (선택)
```

### plugin.json (선택)

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "플러그인 설명",
  "author": "개발자 이름",
  "homepage": "https://example.com",
  "capabilities": {
    "markdown": true,
    "ui": false,
    "toolbar": false,
    "settings": true
  },
  "defaultSettings": {
    "option1": "default-value"
  }
}
```

---

## Plugin 기본 클래스

모든 플러그인은 `Plugin` 기본 클래스를 확장해야 합니다.

```javascript
import { Plugin } from '../../core/plugin.js';

export default class MyPlugin extends Plugin {
  // 필수: 플러그인 식별자 (고유해야 함)
  static id = 'my-plugin';

  // 필수: 플러그인 이름
  static name = 'My Plugin';

  // 필수: 버전
  static version = '1.0.0';

  // 선택: 설명
  static description = '플러그인 설명';

  // 선택: 개발자
  static author = '개발자 이름';

  // 선택: 홈페이지
  static homepage = 'https://example.com';

  // 플러그인 기능 선언
  static capabilities = {
    markdown: false,  // 마크다운 확장 사용 여부
    ui: false,        // UI 확장 사용 여부
    toolbar: false,   // 툴바 버튼 추가 여부
    settings: false,  // 설정 패널 여부
  };

  // 기본 설정
  static defaultSettings = {
    option1: 'default-value',
  };

  constructor(api) {
    super(api);
    // 초기화 코드
  }

  /**
   * 플러그인 초기화 (필수)
   * 플러그인이 활성화될 때 호출됩니다.
   */
  async init() {
    // 이벤트 리스너 등록
    this._on('file:loaded', this.onFileLoaded.bind(this));

    // 스토어 구독
    this._subscribe('theme', this.onThemeChange.bind(this));

    console.log('[MyPlugin] Initialized');
  }

  /**
   * 플러그인 정리 (필수)
   * 플러그인이 비활성화될 때 호출됩니다.
   */
  async destroy() {
    // 부모 클래스의 destroy 호출 (자동 정리)
    await super.destroy();

    console.log('[MyPlugin] Destroyed');
  }

  /**
   * 설정 변경 시 호출
   */
  onSettingsChange(settings) {
    // 설정이 변경되면 재초기화
  }
}
```

### 라이프사이클 메서드

| 메서드 | 설명 |
|--------|------|
| `constructor(api)` | 인스턴스 생성, API 주입 |
| `async init()` | 플러그인 활성화 시 호출 |
| `async destroy()` | 플러그인 비활성화 시 호출 |
| `onSettingsChange(settings)` | 설정 변경 시 호출 |

### 유틸리티 메서드

| 메서드 | 설명 |
|--------|------|
| `this._on(event, callback)` | 이벤트 등록 (자동 정리) |
| `this._subscribe(key, callback)` | 스토어 구독 (자동 정리) |
| `this._trackElement(element)` | UI 요소 추적 (자동 정리) |
| `this.getSettings()` | 현재 설정 조회 |
| `this.updateSettings(settings)` | 설정 업데이트 |

---

## Plugin API

플러그인은 `this.api`를 통해 애플리케이션 기능에 접근합니다.

### Events API

```javascript
// 이벤트 구독
const unsubscribe = this.api.events.on('file:loaded', (data) => {
  console.log('파일 로드됨:', data);
});

// 일회성 구독
this.api.events.once('app:ready', () => {
  console.log('앱 준비됨');
});

// 구독 취소
unsubscribe();

// 플러그인 이벤트 발생 (자동 네임스페이스)
// 'plugin:my-plugin:custom-event'로 발생
this.api.events.emit('custom-event', { data: 'value' });

// 전역 이벤트 발생 (주의해서 사용)
this.api.events.emitGlobal('viewer:rendered', { container });
```

### Store API

```javascript
// 전역 상태 읽기
const theme = this.api.store.get('theme');
const language = this.api.store.get('language');

// 편의 메서드
const theme = this.api.store.getTheme();     // 'light' | 'dark'
const lang = this.api.store.getLanguage();   // 'ko' | 'en' | 'ja'

// 플러그인 데이터 저장 (자동 네임스페이스)
// 'plugin:my-plugin:key'로 저장
this.api.store.set('key', { value: 123 });

// 플러그인 데이터 읽기
const data = this.api.store.getPluginData('key');

// 상태 변경 구독
const unsubscribe = this.api.store.subscribe('theme', (newValue, oldValue) => {
  console.log(`테마 변경: ${oldValue} → ${newValue}`);
});
```

### DOM API

```javascript
// 쿼리 셀렉터
const element = this.api.dom.$('#my-id');
const elements = this.api.dom.$$('.my-class');
const byId = this.api.dom.$id('my-id');

// 요소 생성
const div = this.api.dom.createElement('div', {
  id: 'my-element',
  className: 'my-class',
  html: '<span>Hello</span>',
  attrs: { 'data-value': '123' },
  style: { color: 'red' },
  events: {
    click: () => console.log('clicked'),
  },
});

// HTML 문자열로 생성
const element = this.api.dom.createFromHTML('<div class="my-div">Content</div>');

// 클래스 토글
this.api.dom.toggleClass(element, 'active', true);

// 표시/숨김
this.api.dom.show(element);
this.api.dom.hide(element);
this.api.dom.toggle(element, isVisible);

// 컨테이너 참조
const content = this.api.dom.getContentContainer();  // #content
const toolbar = this.api.dom.getToolbarContainer();  // #toolbar
```

### Utils API

```javascript
// 고유 ID 생성
const id = this.api.utils.generateId('btn-'); // 'btn-my-plugin-1234567890-abc123'

// 디바운스
const debouncedFn = this.api.utils.debounce(() => {
  console.log('debounced');
}, 300);

// 쓰로틀
const throttledFn = this.api.utils.throttle(() => {
  console.log('throttled');
}, 100);
```

---

## 마크다운 확장

### marked Extension 추가

```javascript
async init() {
  // marked extension 추가
  this.api.markdown.addExtension({
    name: 'myExtension',
    level: 'block',
    start(src) {
      return src.match(/:::/)?.index;
    },
    tokenizer(src) {
      const match = src.match(/^:::\s*(\w+)\n([\s\S]*?)\n:::/);
      if (match) {
        return {
          type: 'myExtension',
          raw: match[0],
          name: match[1],
          content: match[2],
        };
      }
    },
    renderer(token) {
      return `<div class="custom-block custom-${token.name}">${token.content}</div>`;
    },
  });
}
```

### 커스텀 렌더러

```javascript
async init() {
  // blockquote 렌더러 커스터마이징
  this.api.markdown.addRenderer('blockquote', (token) => {
    return `<aside class="custom-quote">${token.text}</aside>`;
  });
}
```

### 렌더링 훅

```javascript
async init() {
  // 렌더링 전 훅 (마크다운 텍스트 변환)
  this.api.markdown.onBeforeRender((markdown) => {
    // 특정 패턴 변환
    return markdown.replace(/\[\[(\w+)\]\]/g, '**$1**');
  });

  // 렌더링 후 훅 (DOM 조작)
  this.api.markdown.onAfterRender((html, container) => {
    // 렌더링된 DOM에서 특정 요소 처리
    container.querySelectorAll('.code-block').forEach(block => {
      this.enhanceCodeBlock(block);
    });
  });
}
```

---

## UI 확장

### 툴바 버튼 추가

```javascript
async init() {
  // 단일 버튼 추가
  this.api.ui.addToolbarButton({
    id: 'my-action',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24">...</svg>`,
    title: '내 액션',
    onClick: () => this.doSomething(),
  });

  // 버튼 그룹 추가
  this.api.ui.addToolbarGroup({
    id: 'my-group',
    buttons: [
      { id: 'action1', icon: '...', title: '액션 1', onClick: () => {} },
      { id: 'action2', icon: '...', title: '액션 2', onClick: () => {} },
    ],
  });
}

async destroy() {
  // 버튼 제거
  this.api.ui.removeToolbarButton('my-action');

  await super.destroy();
}
```

### 알림 표시

```javascript
// 기본 알림
this.api.ui.showNotification('저장되었습니다');

// 옵션 지정
this.api.ui.showNotification('오류가 발생했습니다', {
  type: 'error',     // 'info' | 'success' | 'warning' | 'error'
  duration: 5000,    // 밀리초
});
```

### 모달 생성

```javascript
const modal = this.api.ui.createModal({
  title: '내 모달',
  content: `
    <div class="my-modal-content">
      <p>모달 내용</p>
      <input type="text" id="my-input" />
    </div>
  `,
  buttons: [
    {
      label: '취소',
      action: 'cancel',
      onClick: () => console.log('취소'),
    },
    {
      label: '확인',
      action: 'confirm',
      primary: true,
      onClick: () => {
        const value = modal.element.querySelector('#my-input').value;
        console.log('입력값:', value);
      },
    },
  ],
});

// 프로그래밍 방식으로 닫기
modal.close();

// 모달 요소 접근
modal.element.querySelector('.my-modal-content');
```

### 설정 섹션 추가

```javascript
async init() {
  this.api.ui.addSettingsSection({
    title: '내 플러그인 설정',
    fields: [
      { name: 'option1', type: 'text', label: '옵션 1' },
      { name: 'option2', type: 'checkbox', label: '옵션 2' },
      { name: 'option3', type: 'select', label: '옵션 3', options: ['a', 'b', 'c'] },
    ],
  });
}
```

---

## 설정 관리

### 기본 설정 정의

```javascript
export default class MyPlugin extends Plugin {
  static defaultSettings = {
    enabled: true,
    theme: 'auto',
    maxItems: 10,
  };

  // ...
}
```

### 설정 사용

```javascript
async init() {
  // 현재 설정 읽기
  const settings = this.getSettings();
  console.log('현재 설정:', settings);

  // 개별 설정값 사용
  if (settings.enabled) {
    this.enable();
  }
}

onSettingsChange(settings) {
  // 설정이 변경되면 호출됨
  console.log('새 설정:', settings);

  if (settings.theme !== this.lastTheme) {
    this.applyTheme(settings.theme);
    this.lastTheme = settings.theme;
  }
}
```

---

## 이벤트 시스템

### 사용 가능한 이벤트

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `theme:changed` | `{ theme }` | 라이트/다크 테마 변경 |
| `theme:color-changed` | `{ color }` | 컬러 테마 변경 |
| `tab:created` | `{ id, name }` | 새 탭 생성 |
| `tab:switched` | `{ id }` | 탭 전환 |
| `tab:closed` | `{ id }` | 탭 닫힘 |
| `file:opened` | `{ name, path }` | 파일 열기 시작 |
| `file:loaded` | `{ name, path, content }` | 파일 로드 완료 |
| `file:saved` | `{ path }` | 파일 저장 |
| `viewer:rendered` | `{ container }` | 마크다운 렌더링 완료 |
| `viewer:page-changed` | `{ page }` | 페이지 변경 |
| `viewer:zoom-changed` | `{ zoom }` | 줌 레벨 변경 |
| `search:opened` | - | 검색 바 열림 |
| `search:closed` | - | 검색 바 닫힘 |
| `editor:mode-changed` | `{ mode }` | 에디터 모드 변경 |
| `app:ready` | - | 앱 준비 완료 |
| `plugin:all-loaded` | `{ plugins }` | 플러그인 로드 완료 |

### 이벤트 사용 예시

```javascript
async init() {
  // 파일 로드 시 처리
  this._on('file:loaded', ({ name, content }) => {
    console.log(`파일 로드됨: ${name}`);
    this.analyzeContent(content);
  });

  // 테마 변경 시 처리
  this._on('theme:changed', ({ theme }) => {
    this.updateTheme(theme);
  });

  // 렌더링 완료 시 처리
  this._on('viewer:rendered', ({ container }) => {
    this.processRenderedContent(container);
  });
}
```

---

## 예제: Mermaid 플러그인

```javascript
import { Plugin } from '../../core/plugin.js';

export default class MermaidPlugin extends Plugin {
  static id = 'mermaid';
  static name = 'Mermaid Diagrams';
  static version = '1.0.0';
  static description = 'Render Mermaid diagrams in markdown';

  static capabilities = {
    markdown: true,
    settings: true,
  };

  static defaultSettings = {
    theme: 'auto',
  };

  constructor(api) {
    super(api);
    this.mermaid = null;
  }

  async init() {
    // Mermaid 라이브러리 로드
    await this.loadMermaid();

    // 설정 적용
    this.configureMermaid();

    // 렌더링 후 훅 등록
    this.api.markdown.onAfterRender((html, container) => {
      this.renderDiagrams(container);
    });

    // 테마 변경 감지
    this._subscribe('theme', () => {
      this.configureMermaid();
      this.reRender();
    });
  }

  async loadMermaid() {
    if (window.mermaid) {
      this.mermaid = window.mermaid;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.onload = () => {
        this.mermaid = window.mermaid;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  configureMermaid() {
    const appTheme = this.api.store.getTheme();
    const theme = this.settings.theme === 'auto'
      ? (appTheme === 'dark' ? 'dark' : 'default')
      : this.settings.theme;

    this.mermaid.initialize({
      startOnLoad: false,
      theme,
    });
  }

  async renderDiagrams(container) {
    const codeBlocks = container.querySelectorAll('code.language-mermaid');

    for (const code of codeBlocks) {
      const id = `mermaid-${Date.now()}`;
      const { svg } = await this.mermaid.render(id, code.textContent);

      const wrapper = code.closest('.code-block-wrapper');
      const diagram = document.createElement('div');
      diagram.className = 'mermaid-diagram';
      diagram.innerHTML = svg;

      wrapper.insertBefore(diagram, wrapper.firstChild);
    }
  }

  onSettingsChange(settings) {
    this.configureMermaid();
    this.reRender();
  }

  reRender() {
    const content = this.api.dom.getContentContainer();
    content.querySelectorAll('.mermaid-diagram').forEach(el => el.remove());
    this.renderDiagrams(content);
  }
}
```

---

## 베스트 프랙티스

### 1. 자동 정리 사용

```javascript
// Good: 자동 정리되는 헬퍼 메서드 사용
async init() {
  this._on('event', handler);           // 자동 정리
  this._subscribe('key', callback);     // 자동 정리
  this._trackElement(element);          // 자동 정리
}

// Bad: 수동 정리 필요
async init() {
  this.unsub = this.api.events.on('event', handler);
}

async destroy() {
  this.unsub();  // 수동 정리 필요
  await super.destroy();
}
```

### 2. 에러 핸들링

```javascript
async init() {
  try {
    await this.loadExternalLibrary();
  } catch (error) {
    console.error('[MyPlugin] 라이브러리 로드 실패:', error);
    this.api.ui.showNotification('플러그인 초기화 실패', { type: 'error' });
    return; // 초기화 중단
  }
}
```

### 3. 네임스페이스 사용

```javascript
// Good: 플러그인 ID를 접두사로 사용
const elementId = `plugin-${this.constructor.id}-element`;
const className = `plugin-${this.constructor.id}-style`;

// Bad: 충돌 가능한 일반 이름
const elementId = 'my-element';
```

### 4. 비동기 작업 처리

```javascript
async init() {
  // 비동기 라이브러리 로드
  await this.loadLibrary();

  // 렌더링 훅은 동기적으로 등록
  this.api.markdown.onAfterRender((html, container) => {
    // 비동기 작업은 내부에서 처리
    this.processAsync(container).catch(console.error);
  });
}
```

### 5. 설정 검증

```javascript
onSettingsChange(settings) {
  // 설정 검증
  if (settings.maxItems < 1) {
    settings.maxItems = 1;
    this.updateSettings({ maxItems: 1 });
    return;
  }

  // 설정 적용
  this.applySettings(settings);
}
```

---

## 문제 해결

### 플러그인이 로드되지 않음

1. `static id`가 고유한지 확인
2. `export default` 사용 확인
3. `Plugin` 클래스 확장 확인
4. 콘솔에서 에러 메시지 확인

### 이벤트가 발생하지 않음

1. 이벤트 이름이 정확한지 확인 (`EVENTS` 상수 참조)
2. `this._on()` 대신 `this.api.events.on()` 사용 시 수동 정리 필요

### UI 요소가 남아있음

1. `destroy()`에서 `await super.destroy()` 호출 확인
2. `this._trackElement()`로 요소 추적 확인

### 설정이 저장되지 않음

1. `static defaultSettings` 정의 확인
2. `capabilities.settings: true` 설정 확인

---

## API 참조

전체 API 타입 정의는 `src/core/plugin-api.js`를 참조하세요.
