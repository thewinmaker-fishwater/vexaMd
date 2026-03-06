# Vexa MD 플러그인 개발 가이드

## 목차

1. [빠른 시작 (5분 튜토리얼)](#빠른-시작)
2. [폴더 구조 & plugin.json](#폴더-구조--pluginjson-레퍼런스)
3. [Plugin 클래스 API](#plugin-클래스-api)
4. [Plugin API 7개 네임스페이스](#plugin-api-레퍼런스)
5. [이벤트 상수 목록](#이벤트-상수-목록)
6. [설정 스키마 7가지 타입](#설정-스키마)
7. [도움말 시스템](#도움말-시스템)
8. [레시피: 자주 쓰는 패턴](#레시피-자주-쓰는-패턴)
9. [설치 및 배포](#설치-및-배포)
10. [디버깅 팁](#디버깅-팁)
11. [체크리스트](#출시-전-체크리스트)

---

## 빠른 시작

### 1. 폴더 만들기

아무 위치에 폴더를 만듭니다:

```
my-plugin/
├── plugin.json
└── index.js
```

### 2. plugin.json 작성

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My first Vexa MD plugin",
  "author": "Your Name",
  "homepage": "https://github.com/you/my-plugin",
  "main": "index.js",
  "help": {
    "ko": "이 플러그인은 ...",
    "en": "This plugin ..."
  },
  "capabilities": { "toolbar": true, "settings": true },
  "settings": {
    "greeting": {
      "type": "string",
      "label": { "ko": "인사말", "en": "Greeting" },
      "default": "Hello!",
      "help": { "ko": "표시할 메시지", "en": "Message to display" }
    }
  }
}
```

### 3. index.js 작성

```javascript
// ⚠️ 외부 플러그인은 반드시 window.VexaMD.Plugin을 사용합니다.
//    import 구문은 사용할 수 없습니다 (blob URL로 로드되므로).
const Plugin = window.VexaMD.Plugin;

export default class MyPlugin extends Plugin {
  static id = 'my-plugin';       // plugin.json의 id와 반드시 일치
  static name = 'My Plugin';
  static version = '1.0.0';
  static description = 'My first Vexa MD plugin';

  static capabilities = { toolbar: true, settings: true };
  static defaultSettings = { greeting: 'Hello!' };

  async init() {
    // 툴바에 버튼 추가
    this.api.ui.addToolbarButton({
      id: 'greet-btn',
      icon: '👋',
      title: 'Say Hello',
      onClick: () => this.api.ui.showNotification(this.settings.greeting),
    });
  }

  async destroy() {
    this.api.ui.removeToolbarButton('greet-btn');
    await super.destroy();  // ⚠️ 반드시 호출 — 이벤트/DOM 자동 정리
  }

  onSettingsChange(settings) {
    console.log('Settings changed:', settings);
  }
}
```

### 4. 앱에서 설치

1. Vexa MD 실행
2. 도구 → 플러그인 설정
3. **"플러그인 설치"** 클릭 → `my-plugin` 폴더 선택
4. 목록에서 활성화 토글 ON → 툴바에 버튼이 나타남

---

## 폴더 구조 & plugin.json 레퍼런스

### 폴더 구조

```
my-plugin/
├── plugin.json    # 매니페스트 (필수)
├── index.js       # 메인 코드 (필수)
├── README.md      # 사용 설명서 (권장)
└── LICENSE        # 라이선스 (권장)
```

### 필수 필드

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | string | 고유 식별자 (소문자, 숫자, 하이픈만) | `"my-plugin"` |
| `name` | string | 표시 이름 | `"My Plugin"` |
| `version` | string | 버전 (semver 권장) | `"1.0.0"` |
| `main` | string | 메인 JS 파일 경로 | `"index.js"` |

### 선택 필드

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `description` | string | 플러그인 설명 | `"마크다운에 다이어그램 추가"` |
| `author` | string | 개발자 이름 | `"Your Name"` |
| `homepage` | string | 홈페이지/저장소 URL | `"https://github.com/..."` |
| `help` | string \| object | 도움말 텍스트 (i18n 지원, [상세](#도움말-시스템)) | `{ "ko": "...", "en": "..." }` |
| `capabilities` | object | 기능 선언 | 아래 참조 |
| `settings` | object | 설정 스키마 ([상세](#설정-스키마)) | 아래 참조 |

### capabilities 객체

| 키 | 타입 | 설명 |
|----|------|------|
| `markdown` | boolean | 마크다운 렌더링 확장 (Extension, Renderer, Hook) |
| `ui` | boolean | UI 요소 추가 (모달, 알림 등) |
| `toolbar` | boolean | 툴바 버튼 추가 |
| `settings` | boolean | 설정 패널 표시 (이 값이 `true`여야 ⚙ 버튼이 보임) |

```json
{
  "capabilities": {
    "markdown": true,
    "ui": true,
    "toolbar": true,
    "settings": true
  }
}
```

### 전체 plugin.json 예시

```json
{
  "id": "code-highlight",
  "name": "Code Highlight",
  "version": "2.1.0",
  "description": "Syntax highlighting for code blocks",
  "author": "Developer",
  "homepage": "https://github.com/dev/code-highlight",
  "main": "index.js",
  "help": {
    "ko": "코드 블록에 구문 강조를 추가합니다.\n\n지원 언어: JavaScript, Python, Rust 등 200개 이상.\n\n설정에서 테마와 줄 번호 표시를 조정할 수 있습니다.",
    "en": "Adds syntax highlighting to code blocks.\n\nSupports 200+ languages: JavaScript, Python, Rust, etc.\n\nAdjust theme and line numbers in settings."
  },
  "capabilities": {
    "markdown": true,
    "settings": true
  },
  "settings": {
    "theme": {
      "type": "select",
      "label": { "ko": "테마", "en": "Theme" },
      "default": "auto",
      "options": ["auto", "github", "monokai", "dracula"],
      "help": { "ko": "코드 블록 색상 테마", "en": "Code block color theme" }
    },
    "lineNumbers": {
      "type": "boolean",
      "label": { "ko": "줄 번호 표시", "en": "Show Line Numbers" },
      "default": true
    }
  }
}
```

---

## Plugin 클래스 API

모든 플러그인은 `window.VexaMD.Plugin`을 확장합니다.

### 기본 구조

```javascript
const Plugin = window.VexaMD.Plugin;

export default class MyPlugin extends Plugin {
  // ── 필수: 메타데이터 (plugin.json과 일치) ──
  static id = 'my-plugin';
  static name = 'My Plugin';
  static version = '1.0.0';
  static description = '';
  static author = '';

  // ── 기능 선언 ──
  static capabilities = { settings: true };

  // ── 기본 설정값 (plugin.json의 settings.*.default와 일치) ──
  static defaultSettings = { key: 'value' };

  // ── 라이프사이클 ──
  async init()    { /* 활성화 시 호출 */ }
  async destroy() { await super.destroy(); /* 비활성화 시 호출 */ }

  // ── 설정 변경 콜백 ──
  onSettingsChange(settings) { /* 설정 변경 시 호출 */ }
}
```

### 라이프사이클

```
┌─────────────────────────────────────────────────────────┐
│  register → constructor(api) → init() → [동작 중] → destroy()  │
│                 ↑                           │              │
│                 │         onSettingsChange() │              │
│                 │           (설정 변경 시)    │              │
└─────────────────────────────────────────────────────────┘
```

| 메서드 | 시점 | 해야 할 일 |
|--------|------|-----------|
| `constructor(api)` | 인스턴스 생성 | (자동 호출) API 주입, 기본 설정 적용 |
| `async init()` | 사용자가 플러그인 활성화 | 이벤트 구독, UI 요소 추가, 초기화 |
| `async destroy()` | 사용자가 플러그인 비활성화 | 정리 후 **반드시** `await super.destroy()` 호출 |
| `onSettingsChange(settings)` | 사용자가 설정 변경 | UI 업데이트, 동작 변경 등 |

### 헬퍼 메서드 (자동 정리)

`destroy()` 호출 시 자동으로 해제/제거됩니다.

| 메서드 | 설명 | 예시 |
|--------|------|------|
| `this._on(event, callback)` | 이벤트 구독 | `this._on('file:loaded', (d) => ...)` |
| `this._subscribe(key, callback)` | 스토어 구독 | `this._subscribe('theme', (v) => ...)` |
| `this._trackElement(element)` | DOM 요소 추적 | `this._trackElement(myDiv)` |
| `this.getSettings()` | 현재 설정 반환 | `const s = this.getSettings()` |
| `this.updateSettings(obj)` | 설정 업데이트 | `this.updateSettings({ key: 'new' })` |

> **중요**: `this._on()`과 `this._subscribe()`로 등록한 구독은 `super.destroy()`에서 자동 해제됩니다. `this.api.events.on()`을 직접 사용하면 `destroy()`에서 수동으로 해제해야 합니다.

---

## Plugin API 레퍼런스

플러그인은 `this.api`를 통해 앱 기능에 접근합니다. 7개 네임스페이스가 있습니다.

### 1. Events API — `this.api.events`

```javascript
// 구독
this._on('file:loaded', ({ name, path, content }) => {
  console.log(`파일 열림: ${name}`);
});

// 일회성 구독
this.api.events.once('app:ready', () => { });

// 플러그인 이벤트 발행 → 이벤트 이름이 'plugin:{id}:custom-event'로 변환됨
this.api.events.emit('custom-event', { data: 'value' });

// 전역 이벤트 발행 (주의: 다른 모듈에 영향)
this.api.events.emitGlobal('viewer:rendered', { });

// 와일드카드 구독 (네임스페이스 단위)
this._on('file:*', ({ event, data }) => {
  console.log(`file 네임스페이스 이벤트: ${event}`);
});

// 이벤트 상수 접근
const { EVENTS } = this.api.events;
this._on(EVENTS.CONTENT_RENDERED, ({ container }) => { });
```

### 2. Store API — `this.api.store`

```javascript
// 앱 상태 읽기
const theme = this.api.store.get('theme');        // 'light' | 'dark'
const lang  = this.api.store.getLanguage();       // 'ko' | 'en' | 'ja'
const theme2 = this.api.store.getTheme();         // 편의 메서드

// 플러그인 전용 데이터 (네임스페이스 자동: 'plugin:{id}:key')
this.api.store.set('lastUsed', Date.now());
const val = this.api.store.getPluginData('lastUsed');

// 상태 변경 구독 (this._subscribe 사용 권장 — 자동 정리)
this._subscribe('theme', (newTheme) => {
  console.log(`테마 변경: ${newTheme}`);
});
```

### 3. Markdown API — `this.api.markdown`

```javascript
// marked Extension 추가 (블록/인라인 확장)
this.api.markdown.addExtension({
  name: 'myBlock',
  level: 'block',
  start(src) { return src.match(/:::myblock/)?.index; },
  tokenizer(src) {
    const match = src.match(/^:::myblock\n([\s\S]+?)\n:::/);
    if (match) return { type: 'myBlock', raw: match[0], text: match[1] };
  },
  renderer(token) { return `<div class="my-block">${token.text}</div>`; },
});

// 기존 요소 렌더러 교체
this.api.markdown.addRenderer('blockquote', (token) => {
  return `<aside class="custom-quote">${token.text}</aside>`;
});

// 렌더링 전 훅 (마크다운 텍스트 변환)
this.api.markdown.onBeforeRender((markdown) => {
  return markdown.replace(/::warning::/g, '> ⚠️ **주의:**');
});

// 렌더링 후 훅 (DOM 조작)
this.api.markdown.onAfterRender((html, container) => {
  container.querySelectorAll('pre code').forEach(el => highlight(el));
});
```

### 4. UI API — `this.api.ui`

```javascript
// ── 툴바 버튼 ──
this.api.ui.addToolbarButton({
  id: 'my-action',               // 실제 ID: 'plugin-{pluginId}-my-action'
  icon: '<svg ...>...</svg>',     // SVG 문자열 또는 이모지
  title: 'My Action',            // 툴팁
  onClick: () => this.doSomething(),
});
this.api.ui.removeToolbarButton('my-action');

// ── 툴바 버튼 그룹 ──
this.api.ui.addToolbarGroup({
  id: 'my-group',
  buttons: [
    { id: 'btn-a', icon: 'A', title: 'Action A', onClick: () => {} },
    { id: 'btn-b', icon: 'B', title: 'Action B', onClick: () => {} },
  ],
});

// ── 알림 토스트 ──
this.api.ui.showNotification('저장 완료!', {
  type: 'success',    // 'info' | 'success' | 'warning' | 'error'
  duration: 3000,     // 밀리초
});

// ── 모달 다이얼로그 ──
const modal = this.api.ui.createModal({
  title: '확인',
  content: '<p>정말 삭제하시겠습니까?</p>',
  buttons: [
    { label: '취소', action: 'cancel', onClick: () => {} },
    { label: '삭제', action: 'delete', primary: true, onClick: () => this.delete() },
  ],
});
// 나중에 닫기: modal.close();
```

### 5. DOM API — `this.api.dom`

```javascript
this.api.dom.$('#my-element');           // querySelector
this.api.dom.$$('.items');               // querySelectorAll → Array
this.api.dom.$id('my-element');          // getElementById

const el = this.api.dom.createElement('div', {
  className: 'my-widget',
  html: '<span>Hello</span>',
});
this._trackElement(el);                  // destroy 시 자동 제거

this.api.dom.getContentContainer();      // #content 요소
this.api.dom.getToolbarContainer();      // #toolbar 요소

this.api.dom.show(el);
this.api.dom.hide(el);
this.api.dom.toggle(el);
this.api.dom.toggleClass(el, 'active');
```

### 6. Utils API — `this.api.utils`

```javascript
const id = this.api.utils.generateId('item-');   // 'item-my-plugin-1706...-a3f...'

const debouncedSave = this.api.utils.debounce(() => {
  this.save();
}, 300);

const throttledUpdate = this.api.utils.throttle(() => {
  this.updateUI();
}, 100);
```

### 7. EVENTS 상수 — `this.api.events.EVENTS`

```javascript
const { EVENTS } = this.api.events;
this._on(EVENTS.CONTENT_RENDERED, ({ container }) => { });
this._on(EVENTS.THEME_CHANGED, ({ theme }) => { });
```

전체 목록은 [이벤트 상수 목록](#이벤트-상수-목록) 참조.

---

## 이벤트 상수 목록

### 앱 & 테마

| 상수 | 이벤트 이름 | 데이터 | 설명 |
|------|------------|--------|------|
| `APP_INITIALIZED` | `app:initialized` | — | 앱 초기화 완료 |
| `APP_READY` | `app:ready` | — | 앱 사용 준비 완료 |
| `THEME_CHANGED` | `theme:changed` | `{ theme }` | 라이트/다크 변경 |
| `COLOR_THEME_CHANGED` | `theme:color-changed` | — | 색상 테마 변경 |
| `LANGUAGE_CHANGED` | `i18n:language-changed` | — | 언어 변경 |

### 파일

| 상수 | 이벤트 이름 | 데이터 | 설명 |
|------|------------|--------|------|
| `FILE_OPENED` | `file:opened` | `{ name, path }` | 파일 열기 시작 |
| `FILE_LOADED` | `file:loaded` | `{ name, path, content }` | 파일 로드 완료 |
| `FILE_SAVED` | `file:saved` | — | 파일 저장 완료 |
| `FILE_DROPPED` | `file:dropped` | — | 파일 드래그앤드롭 |
| `FILE_DIRTY_CHANGED` | `file:dirty-changed` | — | 편집 상태 변경 |

### 뷰어 & 에디터

| 상수 | 이벤트 이름 | 데이터 | 설명 |
|------|------------|--------|------|
| `CONTENT_RENDERED` | `viewer:rendered` | `{ container }` | 마크다운 렌더링 완료 |
| `PAGE_CHANGED` | `viewer:page-changed` | — | 페이지 변경 |
| `VIEW_MODE_CHANGED` | `viewer:mode-changed` | — | 뷰 모드 변경 |
| `EDITOR_MODE_CHANGED` | `editor:mode-changed` | `{ mode }` | 에디터 모드 변경 |
| `EDITOR_CONTENT_CHANGED` | `editor:content-changed` | — | 에디터 내용 변경 |

### 탭

| 상수 | 이벤트 이름 | 데이터 | 설명 |
|------|------------|--------|------|
| `TAB_CREATED` | `tab:created` | — | 새 탭 생성 |
| `TAB_SWITCHED` | `tab:switched` | — | 탭 전환 |
| `TAB_CLOSED` | `tab:closed` | — | 탭 닫기 |

### 검색

| 상수 | 이벤트 이름 | 데이터 | 설명 |
|------|------------|--------|------|
| `SEARCH_OPENED` | `search:opened` | — | 검색 열기 |
| `SEARCH_CLOSED` | `search:closed` | — | 검색 닫기 |
| `SEARCH_PERFORMED` | `search:performed` | — | 검색 실행 |

### UI

| 상수 | 이벤트 이름 | 데이터 | 설명 |
|------|------------|--------|------|
| `MODAL_OPENED` | `ui:modal-opened` | `{ type }` | 모달 열림 |
| `MODAL_CLOSED` | `ui:modal-closed` | `{ type }` | 모달 닫힘 |
| `NOTIFICATION_SHOWN` | `ui:notification-shown` | `{ message, type }` | 알림 표시 |

### 플러그인

| 상수 | 이벤트 이름 | 데이터 | 설명 |
|------|------------|--------|------|
| `PLUGINS_LOADED` | `plugin:all-loaded` | `{ plugins }` | 모든 플러그인 로드 완료 |
| `PLUGIN_ENABLED` | `plugin:enabled` | `{ id }` | 플러그인 활성화 |
| `PLUGIN_DISABLED` | `plugin:disabled` | `{ id }` | 플러그인 비활성화 |
| `PLUGIN_INSTALLED` | `plugin:installed` | `{ id, name }` | 플러그인 설치 |
| `PLUGIN_UNINSTALLED` | `plugin:uninstalled` | `{ id }` | 플러그인 삭제 |
| `PLUGIN_ERROR` | `plugin:error` | `{ id, error }` | 플러그인 오류 |
| `PLUGIN_SETTINGS_CHANGED` | `plugin:settings-changed` | `{ id, settings }` | 설정 변경 |
| `PLUGIN_MARKDOWN_CHANGED` | `plugin:markdown-changed` | `{ pluginId }` | 마크다운 확장 변경 |
| `PLUGIN_UI_CHANGED` | `plugin:ui-changed` | `{ type, pluginId }` | UI 확장 변경 |

---

## 설정 스키마

plugin.json의 `settings` 필드에서 7가지 타입을 정의할 수 있습니다.

### 지원 타입

| 타입 | HTML 요소 | 추가 속성 |
|------|-----------|-----------|
| `string` | `<input type="text">` | — |
| `boolean` | `<input type="checkbox">` | — |
| `number` | `<input type="number">` | `min`, `max`, `step` |
| `select` | `<select>` | `options` (문자열 배열, 필수) |
| `color` | `<input type="color">` | — |
| `textarea` | `<textarea>` | `rows` |
| `range` | `<input type="range">` | `min`, `max`, `step` |

### 공통 속성

| 속성 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `type` | string | ✅ | 필드 타입 |
| `label` | string \| `{ ko, en, ja }` | 권장 | 라벨 (i18n 지원) |
| `default` | any | 권장 | 기본값 |
| `help` | string \| `{ ko, en, ja }` | 선택 | 필드 아래 도움말 텍스트 |

### 예시: 모든 타입

```json
{
  "settings": {
    "enabled": {
      "type": "boolean",
      "label": { "ko": "활성화", "en": "Enabled" },
      "default": true
    },
    "name": {
      "type": "string",
      "label": { "ko": "이름", "en": "Name" },
      "default": "World"
    },
    "fontSize": {
      "type": "number",
      "label": { "ko": "글자 크기", "en": "Font Size" },
      "default": 14,
      "min": 8, "max": 32, "step": 1,
      "help": { "ko": "px 단위", "en": "In pixels" }
    },
    "theme": {
      "type": "select",
      "label": { "ko": "테마", "en": "Theme" },
      "default": "auto",
      "options": ["auto", "light", "dark"]
    },
    "primaryColor": {
      "type": "color",
      "label": { "ko": "주요 색상", "en": "Primary Color" },
      "default": "#6366f1"
    },
    "opacity": {
      "type": "range",
      "label": { "ko": "투명도", "en": "Opacity" },
      "default": 80,
      "min": 0, "max": 100, "step": 5
    },
    "customCSS": {
      "type": "textarea",
      "label": { "ko": "커스텀 CSS", "en": "Custom CSS" },
      "default": "",
      "rows": 6
    }
  }
}
```

### i18n 규칙

`label`과 `help`는 문자열 또는 객체를 지원합니다:

```json
"label": "Theme"
"label": { "ko": "테마", "en": "Theme", "ja": "テーマ" }
```

앱의 현재 언어 → 영어(`en`) 폴백 → 첫 번째 값 폴백 순서로 해석됩니다.

---

## 도움말 시스템

플러그인 카드에 **Help** 버튼을 표시하는 시스템입니다.

### 동작 방식

| 조건 | 동작 |
|------|------|
| `help` 필드 있음 | 현재 언어에 맞는 텍스트를 **앱 내 모달**로 표시 |
| `help` 없고 `homepage` 있음 | 해당 URL을 **브라우저에서 열기** |
| 둘 다 없음 | Help 버튼이 **표시되지 않음** |

### plugin.json에 help 추가

```json
{
  "help": {
    "ko": "이 플러그인은 마크다운에 다이어그램을 추가합니다.\n\n사용법:\n- ```mermaid 코드 블록을 작성하세요.\n- 지원 타입: flowchart, sequence, gantt 등\n\n설정에서 테마를 변경할 수 있습니다.",
    "en": "This plugin adds diagrams to markdown.\n\nUsage:\n- Write a ```mermaid code block.\n- Supported types: flowchart, sequence, gantt, etc.\n\nChange the theme in settings."
  },
  "homepage": "https://github.com/..."
}
```

### 작성 팁

- `\n`으로 줄바꿈, `\n\n`으로 단락 구분
- **사용법**, **설정 설명**, **주의사항** 순서로 구성하면 좋습니다
- `help`와 `homepage`를 모두 설정하면 `help` 모달이 우선 표시됩니다

---

## 레시피: 자주 쓰는 패턴

### 테마 변경에 반응하기

```javascript
async init() {
  this._subscribe('theme', (theme) => {
    this.widget.classList.toggle('dark', theme === 'dark');
  });

  // 초기 테마 적용
  const theme = this.api.store.getTheme();
  this.widget.classList.toggle('dark', theme === 'dark');
}
```

### 파일 로드 시 처리하기

```javascript
async init() {
  this._on('file:loaded', ({ name, content }) => {
    this.analyze(content);
  });
}
```

### 마크다운 렌더링 후 DOM 조작

```javascript
async init() {
  this._on(this.api.events.EVENTS.CONTENT_RENDERED, ({ container }) => {
    container.querySelectorAll('img').forEach(img => {
      img.addEventListener('click', () => this.openLightbox(img.src));
    });
  });
}
```

### 설정 변경에 반응하여 UI 업데이트

```javascript
onSettingsChange(settings) {
  if (this.badge) {
    this.badge.style.backgroundColor = settings.badgeColor;
    this.badge.style.opacity = settings.opacity / 100;
  }
}
```

### 커스텀 모달 표시

```javascript
showHelp() {
  this.api.ui.createModal({
    title: '사용 가이드',
    content: `
      <div style="padding: 16px;">
        <h3>기본 사용법</h3>
        <p>1. 먼저 파일을 열어주세요.</p>
        <p>2. 툴바의 버튼을 클릭하세요.</p>
      </div>
    `,
    buttons: [
      { label: '확인', action: 'ok', primary: true, onClick: () => {} },
    ],
  });
}
```

### 디바운스로 성능 최적화

```javascript
async init() {
  const debouncedAnalyze = this.api.utils.debounce((content) => {
    this.analyze(content);
  }, 500);

  this._on('editor:content-changed', ({ content }) => {
    debouncedAnalyze(content);
  });
}
```

### DOM 요소 추적 (자동 정리)

```javascript
async init() {
  const container = this.api.dom.getContentContainer();
  const widget = this.api.dom.createElement('div', {
    className: 'my-widget',
    html: '<span>Widget</span>',
  });
  container.appendChild(widget);
  this._trackElement(widget);  // destroy 시 자동 제거
}
```

---

## 설치 및 배포

### 사용자 설치 방법

1. 도구 메뉴 → **플러그인 설정**
2. **"플러그인 설치"** 버튼 클릭
3. 플러그인 폴더 선택 (`plugin.json`이 있는 폴더)
4. 목록에 표시되면 토글로 활성화

### 수동 설치

플러그인 폴더를 `{appDataDir}/plugins/` 경로에 복사합니다. 앱 재시작 시 자동 인식됩니다.

### 배포 방법

1. 플러그인 폴더를 ZIP으로 압축
2. GitHub 릴리스, 웹사이트 등으로 배포
3. 사용자가 압축 해제 후 앱에서 설치

### 주의사항

- `id`는 전역적으로 고유해야 합니다
- `id`는 소문자, 숫자, 하이픈만 허용 (정규식: `/^[a-z0-9-]+$/`)
- **외부 플러그인은 `import` 구문 사용 불가** — 반드시 `window.VexaMD.Plugin` 사용
- `static id`와 `plugin.json`의 `id`는 **반드시 일치**해야 합니다
- 내장 플러그인과 동일한 `id`는 사용할 수 없습니다

---

## 디버깅 팁

### 개발자 도구 활용

- `F12` → Console에서 플러그인 로그 확인
- `window.VexaMD` 입력하여 SDK 로드 확인
- `window.VexaMD.version`으로 버전 확인

### 플러그인 상태 확인

- 플러그인 카드가 **빨간색**이면 오류 발생 → 카드에 에러 메시지 표시됨
- **Retry** 버튼으로 재시도 가능
- 에러 카드의 "Error Details"를 펼쳐 스택 트레이스 확인

### 흔한 문제와 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 플러그인이 목록에 안 뜸 | `plugin.json` 누락 또는 형식 오류 | `id`, `name`, `version`, `main` 필드 확인 |
| `Plugin is not a constructor` | `window.VexaMD` 미로드 | `const Plugin = window.VexaMD.Plugin;` 확인 |
| `import` 에러 | ES import 사용 | `import { ... }` 대신 `window.VexaMD.Plugin` 사용 |
| 설정 ⚙ 버튼이 안 뜸 | `capabilities.settings` 누락 | plugin.json에 `"settings": true` 추가 |
| 에러 카드 표시 | `init()`에서 예외 발생 | 콘솔에서 스택 트레이스 확인 |
| UI 요소 잔류 | `destroy()`에서 정리 누락 | `await super.destroy()` 호출 또는 `_trackElement` 사용 |
| 이벤트 수신 안됨 | 이벤트 이름 오타 | `this.api.events.EVENTS` 상수 사용 |
| 도움말 버튼 안 뜸 | `help`과 `homepage` 모두 없음 | plugin.json에 `help` 또는 `homepage` 추가 |
| 설정 저장 안됨 | `static defaultSettings`에 키 없음 | 모든 설정 키를 `defaultSettings`에 선언 |

### 테스트 플러그인

`test-plugins/hello-world/` 폴더에 동작하는 예제가 있습니다. 이 플러그인을 복사하여 시작하세요.

---

## 출시 전 체크리스트

### 필수

- [ ] `plugin.json`의 필수 필드 작성 (`id`, `name`, `version`, `main`)
- [ ] `static id`와 `plugin.json`의 `id`가 일치
- [ ] `static defaultSettings`의 키가 `plugin.json`의 `settings`와 일치
- [ ] `import` 구문 없이 `window.VexaMD.Plugin` 사용
- [ ] `destroy()`에서 `await super.destroy()` 호출
- [ ] 앱에서 설치 → 활성화 → 비활성화 → 재활성화 정상 동작

### 권장

- [ ] `help` 필드 추가 (한국어/영어)
- [ ] `description` 작성
- [ ] `author`와 `homepage` 작성
- [ ] 테마 변경(라이트↔다크) 시 UI 정상 동작
- [ ] 언어 변경(한국어↔영어) 시 정상 동작
- [ ] 설정 변경 후 즉시 반영 확인
- [ ] 콘솔에 에러 없음

---

## API 참조

전체 API 소스 코드:

- 기본 클래스: `src/core/plugin.js`
- API 팩토리: `src/core/plugin-api.js`
- 플러그인 매니저: `src/core/plugin-manager.js`
- 이벤트 상수: `src/core/events.js`
