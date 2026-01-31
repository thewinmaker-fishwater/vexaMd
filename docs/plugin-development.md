# Vexa MD 플러그인 개발 가이드

## 목차

1. [시작하기](#시작하기)
2. [plugin.json 레퍼런스](#pluginjson-레퍼런스)
3. [Plugin 기본 클래스](#plugin-기본-클래스)
4. [Plugin API 레퍼런스](#plugin-api-레퍼런스)
5. [설정 스키마](#설정-스키마)
6. [테스트](#테스트)
7. [배포](#배포)

---

## 시작하기

### 1단계: 플러그인 폴더 생성

```
my-plugin/
├── plugin.json    # 매니페스트 (필수)
└── index.js       # 메인 코드 (필수)
```

### 2단계: plugin.json 작성

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A sample Vexa MD plugin",
  "author": "Your Name",
  "homepage": "https://example.com",
  "main": "index.js",
  "capabilities": {
    "markdown": false,
    "ui": false,
    "toolbar": false,
    "settings": true
  },
  "settings": {
    "greeting": {
      "type": "string",
      "label": { "ko": "인사말", "en": "Greeting", "ja": "挨拶" },
      "default": "Hello",
      "help": { "ko": "표시할 인사말", "en": "Greeting to display" }
    }
  }
}
```

### 3단계: index.js 작성

```javascript
import { Plugin } from '../../core/plugin.js';

export default class MyPlugin extends Plugin {
  static id = 'my-plugin';
  static name = 'My Plugin';
  static version = '1.0.0';
  static description = 'A sample Vexa MD plugin';
  static author = 'Your Name';

  static capabilities = { settings: true };
  static defaultSettings = { greeting: 'Hello' };

  async init() {
    console.log(`[MyPlugin] ${this.settings.greeting}!`);
  }

  async destroy() {
    await super.destroy();
  }

  onSettingsChange(settings) {
    console.log('[MyPlugin] Settings changed:', settings);
  }
}
```

### 4단계: 설치 및 테스트

- **내장 플러그인**: `src/plugins/` 폴더에 넣고 `plugin-manager.js`의 `registerBuiltIn()`에 등록
- **외부 플러그인**: 플러그인 관리 UI에서 "플러그인 설치" 버튼으로 폴더 선택

---

## plugin.json 레퍼런스

### 필수 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 고유 식별자 (소문자, 숫자, 하이픈만 허용) |
| `name` | string | 표시 이름 |
| `version` | string | 버전 (semver 권장) |
| `main` | string | 메인 JS 파일 경로 |

### 선택 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `description` | string | 플러그인 설명 |
| `author` | string | 개발자 이름 |
| `homepage` | string | 홈페이지 URL |
| `capabilities` | object | 기능 선언 (아래 참조) |
| `settings` | object | 설정 스키마 (아래 참조) |

### capabilities 객체

```json
{
  "markdown": true,   // 마크다운 확장 API 사용
  "ui": true,         // UI 확장 API 사용
  "toolbar": true,    // 툴바 버튼 추가
  "settings": true    // 설정 패널 표시
}
```

---

## Plugin 기본 클래스

모든 플러그인은 `Plugin` 클래스를 확장합니다.

### 라이프사이클

| 메서드 | 설명 |
|--------|------|
| `constructor(api)` | 인스턴스 생성, API 주입 |
| `async init()` | 활성화 시 호출 - 이벤트/훅 등록 |
| `async destroy()` | 비활성화 시 호출 - 정리 |
| `onSettingsChange(settings)` | 설정 변경 시 호출 |

### 헬퍼 메서드 (자동 정리)

| 메서드 | 설명 |
|--------|------|
| `this._on(event, callback)` | 이벤트 등록 (destroy 시 자동 해제) |
| `this._subscribe(key, callback)` | 스토어 구독 (자동 해제) |
| `this._trackElement(element)` | DOM 요소 추적 (자동 제거) |
| `this.getSettings()` | 현재 설정 반환 |
| `this.updateSettings(settings)` | 설정 업데이트 |

---

## Plugin API 레퍼런스

플러그인은 `this.api`를 통해 앱 기능에 접근합니다.

### 1. Events API (`this.api.events`)

```javascript
// 이벤트 구독
this.api.events.on('file:loaded', (data) => { /* ... */ });

// 일회성 구독
this.api.events.once('app:ready', () => { /* ... */ });

// 플러그인 이벤트 발생 → 'plugin:{id}:custom-event'
this.api.events.emit('custom-event', { data: 'value' });

// 전역 이벤트 발생
this.api.events.emitGlobal('viewer:rendered', { container });
```

**주요 이벤트**:

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `theme:changed` | `{ theme }` | 라이트/다크 변경 |
| `file:loaded` | `{ name, path, content }` | 파일 로드 완료 |
| `viewer:rendered` | `{ container }` | 마크다운 렌더링 완료 |
| `editor:mode-changed` | `{ mode }` | 에디터 모드 변경 |
| `plugin:all-loaded` | `{ plugins }` | 플러그인 로드 완료 |

### 2. Store API (`this.api.store`)

```javascript
// 상태 읽기
this.api.store.get('theme');         // 'light' | 'dark'
this.api.store.getTheme();           // 편의 메서드
this.api.store.getLanguage();        // 'ko' | 'en' | 'ja'

// 플러그인 데이터 저장/읽기 (네임스페이스 자동 적용)
this.api.store.set('key', value);
this.api.store.getPluginData('key');

// 상태 변경 구독
this.api.store.subscribe('theme', (newValue) => { /* ... */ });
```

### 3. Markdown API (`this.api.markdown`)

```javascript
// marked extension 추가
this.api.markdown.addExtension({ name, level, tokenizer, renderer });

// 커스텀 렌더러
this.api.markdown.addRenderer('blockquote', (token) => '<aside>...</aside>');

// 렌더링 전 훅 (마크다운 텍스트 변환)
this.api.markdown.onBeforeRender((markdown) => {
  return markdown.replace(/\[\[(\w+)\]\]/g, '**$1**');
});

// 렌더링 후 훅 (DOM 조작)
this.api.markdown.onAfterRender((html, container) => {
  container.querySelectorAll('.code-block').forEach(block => { /* ... */ });
});
```

### 4. UI API (`this.api.ui`)

```javascript
// 툴바 버튼
this.api.ui.addToolbarButton({
  id: 'my-action',
  icon: '<svg>...</svg>',
  title: 'My Action',
  onClick: () => this.doSomething(),
});
this.api.ui.removeToolbarButton('my-action');

// 알림
this.api.ui.showNotification('Message', { type: 'success', duration: 3000 });

// 모달
const modal = this.api.ui.createModal({
  title: 'My Modal',
  content: '<div>...</div>',
  buttons: [{ label: 'OK', primary: true, onClick: () => {} }],
});
modal.close();
```

### 5. DOM API (`this.api.dom`)

```javascript
this.api.dom.$('#id');           // querySelector
this.api.dom.$$('.class');       // querySelectorAll → Array
this.api.dom.$id('id');          // getElementById
this.api.dom.createElement(tag, options);
this.api.dom.getContentContainer();
this.api.dom.getToolbarContainer();
this.api.dom.show(el); this.api.dom.hide(el);
```

### 6. Utils API (`this.api.utils`)

```javascript
this.api.utils.generateId('prefix-');     // 고유 ID 생성
this.api.utils.debounce(fn, 300);         // 디바운스
this.api.utils.throttle(fn, 100);         // 쓰로틀
```

### 7. EVENTS 상수 (`this.api.events.EVENTS`)

이벤트 이름 상수에 직접 접근 가능합니다.

```javascript
this._on(this.api.events.EVENTS.CONTENT_RENDERED, ({ container }) => {
  // ...
});
```

---

## 설정 스키마

plugin.json의 `settings` 필드에서 폼 타입을 정의합니다.

### 지원 타입

| 타입 | HTML 요소 | 추가 속성 |
|------|-----------|-----------|
| `string` | `<input type="text">` | - |
| `boolean` | `<input type="checkbox">` | - |
| `number` | `<input type="number">` | `min`, `max`, `step` |
| `select` | `<select>` | `options` (배열, 필수) |
| `color` | `<input type="color">` | - |
| `textarea` | `<textarea>` | `rows` |
| `range` | `<input type="range">` | `min`, `max`, `step` |

### 공통 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `type` | string | 필드 타입 (필수) |
| `label` | string \| object | 라벨. i18n 객체 지원: `{ "ko": "...", "en": "..." }` |
| `default` | any | 기본값 |
| `help` | string \| object | 도움말 텍스트. i18n 지원 |

### 예시

```json
{
  "settings": {
    "theme": {
      "type": "select",
      "label": { "ko": "테마", "en": "Theme" },
      "default": "auto",
      "options": ["auto", "light", "dark"]
    },
    "fontSize": {
      "type": "range",
      "label": { "ko": "글자 크기", "en": "Font Size" },
      "default": 14,
      "min": 10,
      "max": 24,
      "step": 1
    },
    "primaryColor": {
      "type": "color",
      "label": { "ko": "주요 색상", "en": "Primary Color" },
      "default": "#6366f1"
    },
    "customCSS": {
      "type": "textarea",
      "label": { "ko": "커스텀 CSS", "en": "Custom CSS" },
      "default": "",
      "rows": 6
    },
    "enabled": {
      "type": "boolean",
      "label": { "ko": "활성화", "en": "Enabled" },
      "default": true
    }
  }
}
```

---

## 테스트

### 내장 플러그인 테스트

1. `src/plugins/my-plugin/` 폴더 생성
2. `plugin-manager.js`의 `registerBuiltIn()`에 등록:
   ```javascript
   this.builtInPlugins.set('my-plugin', async () => {
     const module = await import('../plugins/my-plugin/index.js');
     return module.default;
   });
   this.loadBuiltInManifest('my-plugin', '../plugins/my-plugin/plugin.json');
   ```
3. `npm run tauri dev` 실행
4. 플러그인 설정 모달에서 확인

### 외부 플러그인 테스트

1. 프로젝트 외부에 플러그인 폴더 생성
2. `plugin.json` + `index.js` 작성
3. 앱 실행 → 플러그인 설정 → "플러그인 설치" → 폴더 선택
4. 플러그인 목록에 표시되는지 확인

### 에러 테스트

`init()`에서 의도적으로 에러를 발생시켜 에러 UI를 확인:

```javascript
async init() {
  throw new Error('Test error for error UI');
}
```

---

## 배포

### 배포 구조

```
my-plugin/
├── plugin.json    # 매니페스트
├── index.js       # 메인 코드
├── README.md      # 사용 설명서 (권장)
└── LICENSE        # 라이선스 (권장)
```

### 설치 방법

1. 플러그인 폴더를 ZIP으로 압축하여 배포
2. 사용자가 압축 해제 후 앱의 "플러그인 설치" 기능으로 설치
3. 또는 수동으로 `{appDataDir}/plugins/` 폴더에 복사

### 주의사항

- `plugin.json`의 `id`는 전역적으로 고유해야 합니다
- `id`는 소문자, 숫자, 하이픈만 허용됩니다
- 외부 플러그인은 `import` 구문으로 Vexa MD 내부 모듈을 참조할 수 없습니다
- 외부 플러그인은 blob URL로 로드되므로 상대 경로 import가 동작하지 않습니다

---

## 베스트 프랙티스

### 자동 정리 사용

```javascript
// Good: 자동 정리
this._on('event', handler);
this._subscribe('key', callback);
this._trackElement(element);

// Bad: 수동 정리 필요
this.unsub = this.api.events.on('event', handler);
```

### 네임스페이스 사용

```javascript
// Good
const id = `plugin-${this.constructor.id}-element`;

// Bad
const id = 'my-element';  // 충돌 위험
```

### 에러 핸들링

```javascript
async init() {
  try {
    await this.loadLibrary();
  } catch (error) {
    console.error('[MyPlugin] Failed:', error);
    this.api.ui.showNotification('Plugin init failed', { type: 'error' });
    return;
  }
}
```

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 플러그인이 목록에 안 뜸 | plugin.json 누락 또는 잘못된 형식 | id, name, version, main 필드 확인 |
| 설정 폼이 안 뜸 | `capabilities.settings: true` 누락 | plugin.json에 capabilities 추가 |
| 에러 카드 표시 | init()에서 예외 발생 | 콘솔에서 스택 트레이스 확인 |
| 이벤트 수신 안됨 | 이벤트 이름 오타 | EVENTS 상수 참조 |
| UI 요소 잔류 | destroy()에서 super.destroy() 미호출 | await super.destroy() 추가 |

---

## API 참조

전체 API 타입 정의는 `src/core/plugin-api.js`를 참조하세요.
