# Vexa MD - 기술 아키텍처

## 기술 스택

### Frontend
- **Vite**: 빌드 도구
- **Vanilla JavaScript (ES Modules)**: UI 및 로직
- **marked.js**: 마크다운 파싱
- **highlight.js**: 코드 문법 하이라이트
- **html2pdf.js**: PDF 내보내기

### Backend
- **Tauri 2.0**: 데스크톱 앱 프레임워크
- **Rust**: 네이티브 기능 (파일 읽기/쓰기, AES-256 암호화)

---

## 프로젝트 구조

```
workspace-mdView/
├── src/                          # 프론트엔드 소스 (웹: JS, CSS)
│   ├── main.js                   # 오케스트레이터 (~626줄) - 모듈 조립/초기화
│   ├── i18n.js                   # 다국어 지원 (한국어/영어/일본어)
│   │
│   ├── styles/                   # CSS 모듈 시스템
│   │   ├── index.css             # CSS 진입점 (@import)
│   │   └── base.css              # 전역 리셋, 기본 레이아웃
│   │
│   ├── core/                     # 핵심 인프라
│   │   ├── store.js              # 중앙 상태 관리 (Observer 패턴)
│   │   ├── events.js             # 이벤트 버스 (모듈 간 통신)
│   │   ├── dom.js                # DOM 유틸리티
│   │   ├── plugin.js             # Plugin 기본 클래스
│   │   ├── plugin-manager.js     # 플러그인 로딩/관리
│   │   └── plugin-api.js         # 플러그인에 노출되는 API
│   │
│   ├── modules/                  # 기능별 모듈
│   │   ├── notification/         # 알림 시스템
│   │   │   └── notification.js   # showNotification, showError
│   │   │
│   │   ├── image-modal/          # 이미지 확대 모달
│   │   │   └── image-modal.js    # 이미지 열기/닫기/줌/드래그
│   │   │
│   │   ├── print/                # 인쇄/PDF
│   │   │   └── print.js          # printDocument, exportPdf
│   │   │
│   │   ├── presentation/         # 프레젠테이션
│   │   │   └── presentation-mode.js  # 시작/종료/네비게이션
│   │   │
│   │   ├── markdown/             # 마크다운 렌더링
│   │   │   └── renderer.js       # marked 설정, renderMarkdown, renderPages
│   │   │
│   │   ├── search/               # 검색 기능
│   │   │   ├── search-manager.js # 검색 수행/하이라이트/네비게이션
│   │   │   └── search.css        # 검색 바 스타일
│   │   │
│   │   ├── tabs/                 # 탭 관리
│   │   │   ├── tab-manager.js    # createTab, switchToTab, closeTab, renderTabs
│   │   │   └── tabs.css          # 탭 바 스타일
│   │   │
│   │   ├── zoom/                 # 줌/뷰모드
│   │   │   └── zoom-manager.js   # setViewMode, setZoom, zoomIn/Out/Reset, pan
│   │   │
│   │   ├── files/                # 파일 처리
│   │   │   ├── file-ops.js       # openFile, loadFile, dragDrop, fileWatcher, recentFiles
│   │   │   └── files.css         # 파일 관련 스타일
│   │   │
│   │   ├── session/              # 세션 관리
│   │   │   └── session.js        # saveSession, restoreSession
│   │   │
│   │   ├── vmd/                  # 읽기전용 포맷
│   │   │   └── vmd.js            # exportVmd, exportVmdToMd, loadVmdFile
│   │   │
│   │   ├── theme/                # 테마 시스템
│   │   │   ├── theme-system.js   # 테마 적용/에디터/임포트/내보내기
│   │   │   └── theme.css         # 테마 CSS 변수
│   │   │
│   │   ├── shortcuts/            # 키보드 단축키
│   │   │   └── shortcuts.js      # 키보드 핸들러, 링크 핸들러, 코드 복사
│   │   │
│   │   ├── toc/                  # TOC 사이드바
│   │   │   ├── toc.js            # 목차 생성/스크롤 스파이
│   │   │   └── toc.css           # 목차 스타일
│   │   │
│   │   ├── editor/               # 마크다운 편집기
│   │   │   ├── editor.js         # stub (편집 로직은 main.js에 인라인)
│   │   │   └── editor.css        # 편집기 스타일
│   │   │
│   │   └── plugins/              # 플러그인 UI
│   │       ├── plugin-ui.js      # 플러그인 관리 UI
│   │       └── plugin-ui.css     # 플러그인 스타일
│   │
│   ├── plugins/                  # 내장 플러그인
│   │   └── mermaid/
│   │       └── index.js          # Mermaid 다이어그램 플러그인
│   │
│   ├── components/               # 재사용 컴포넌트
│   │   ├── icons.js              # SVG 아이콘 모음
│   │   └── toolbar.js            # 툴바 컴포넌트
│   │
│   └── utils/                    # 공통 유틸리티
│       └── helpers.js            # 헬퍼 함수
│
├── src-tauri/                    # Tauri 백엔드 소스 (Rust)
│   ├── src/
│   │   ├── lib.rs                # Tauri 커맨드 정의
│   │   └── main.rs               # 앱 엔트리포인트
│   ├── capabilities/
│   │   └── default.json          # 권한 설정
│   ├── icons/                    # 앱 아이콘
│   ├── Cargo.toml                # Rust 의존성
│   └── tauri.conf.json           # Tauri 설정
├── public/                       # 정적 파일
│   └── logo.jpg                  # 로고
├── docs/                         # 문서
├── index.html                    # 메인 HTML
├── package.json                  # npm 의존성
└── vite.config.js                # Vite 설정
```

### 폴더 역할 설명

| 폴더 | 역할 | 실행 환경 |
|------|------|----------|
| `src/` | 프론트엔드 웹 코드 | 브라우저/WebView |
| `src-tauri/` | 네이티브 백엔드 코드 | 운영체제 (Rust) |

> `src-tauri`는 "src"가 아니라 **"Tauri용 소스"**라는 의미입니다.
> 이것은 Tauri 프로젝트의 **표준 구조**입니다.

---

## 모듈 아키텍처

### 모듈 통신 패턴

각 모듈은 `init(context)` 또는 함수에 `ctx` 객체를 받아 다른 모듈의 기능에 접근합니다.

```javascript
// main.js (오케스트레이터)에서 모듈 조립
import * as tabs from './modules/tabs/tab-manager.js';
import * as search from './modules/search/search-manager.js';

// 모듈 초기화 시 필요한 콜백/참조를 context로 전달
tabs.init({
  renderMarkdown: renderer.renderMarkdown,
  switchToTab: tabs.switchToTab,
  // ...
});

search.init({
  getActiveTab: () => tabs.getTabs().find(t => t.id === tabs.getActiveTabId()),
  // ...
});
```

### 모듈 목록

| 모듈 | 파일 | 역할 |
|------|------|------|
| notification | notification.js | 알림/에러 토스트 표시 |
| image-modal | image-modal.js | 이미지 클릭 확대 모달 |
| print | print.js | 인쇄 및 PDF 내보내기 |
| presentation | presentation-mode.js | 프레젠테이션 모드 |
| renderer | renderer.js | 마크다운 렌더링, 페이징 |
| search | search-manager.js | 텍스트 검색, 하이라이트 |
| tabs | tab-manager.js | 탭 생성/전환/닫기 |
| zoom | zoom-manager.js | 줌, 뷰모드, pan |
| file-ops | file-ops.js | 파일 열기/저장, 드래그앤드롭, 파일 워처, 최근 파일 |
| session | session.js | 세션 저장/복원 |
| vmd | vmd.js | 읽기전용 포맷 (.vmd) 내보내기/열기 |
| theme | theme-system.js | 테마 적용/에디터/임포트/내보내기/저장 테마 |
| shortcuts | shortcuts.js | 키보드 단축키, 외부 링크, 앵커, 코드 복사 |
| toc | toc.js | 목차 사이드바, 스크롤 스파이 |

### main.js (오케스트레이터)에 남은 것

- 모듈 import 및 조립
- DOM element 캐싱
- 글로벌 상태 선언 (tabs, activeTabId, currentLanguage 등)
- `init()` 함수 (각 모듈 초기화 호출)
- `updateUITexts()` (i18n UI 업데이트)
- 에디터 함수 (setEditorMode, onEditorInput, saveCurrentFile)
- 툴바 드롭다운 핸들러
- Welcome HTML

---

## 주요 파일 설명

### index.html
- 툴바, 탭바, 검색바, 콘텐츠 영역
- 테마 커스터마이저 모달
- 프로그램 정보 / 단축키 모달
- 프레젠테이션 오버레이
- 드롭 오버레이

### src/main.js (~626줄)
- 앱 오케스트레이터 (진입점)
- 13개 모듈 import 및 context 전달로 초기화
- 툴바 이벤트 연결

### src/core/ (핵심 인프라)

#### store.js - 중앙 상태 관리
```javascript
// Observer 패턴으로 상태 변경 시 자동 UI 업데이트
store.subscribe('theme', (value) => applyTheme(value));
store.set('theme', 'dark');  // 구독자에게 자동 알림
```

#### events.js - 이벤트 버스
```javascript
// 모듈 간 느슨한 결합
eventBus.emit('file:opened', { name, path });
eventBus.on('file:opened', (data) => { /* 처리 */ });
```

#### dom.js - DOM 유틸리티
```javascript
$id('btn-home')  // document.getElementById
$('.tab')        // document.querySelector
$$('.tabs')      // querySelectorAll → Array
```

### src/i18n.js
- 다국어 번역 데이터 (한국어/영어)
- 모든 UI 텍스트 중앙 관리
- 언어 전환 시 동적 업데이트

### src-tauri/src/lib.rs
- `read_file`: 파일 읽기 커맨드
- `write_file`: 파일 쓰기 커맨드
- `get_cli_args`: CLI 인자 처리
- **싱글 인스턴스**: 중복 실행 방지 및 파일 전달

---

## 싱글 인스턴스 구현

### 개요
MD 파일을 더블클릭할 때 새 앱이 열리지 않고, 기존 앱의 새 탭으로 열리도록 구현.

### 기술 스택
- **tauri-plugin-single-instance**: Tauri 공식 싱글 인스턴스 플러그인
- **Mutex 기반**: 앱 identifier로 시스템 mutex 생성
- **IPC**: Tauri 이벤트 시스템으로 파일 경로 전달

### 아키텍처

```
┌─────────────────┐     ┌─────────────────┐
│  1st Instance   │     │  2nd Instance   │
│  (Running)      │     │  (New)          │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │ single-instance │
         │              │ plugin init     │
         │              │ (mutex check)   │
         │              └────────┬────────┘
         │                       │ mutex exists
         │              ┌────────▼────────┐
         │              │ Send args to    │
         │              │ 1st instance    │
         │              │ via IPC         │
         │              └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │ Exit 2nd        │
         │              │ instance        │
         │              └─────────────────┘
         │
┌────────▼────────┐
│ single-instance │
│ callback        │
│ triggered       │
└────────┬────────┘
         │
┌────────▼────────┐
│ emit('open-     │
│ files-from-     │
│ instance')      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Focus window    │
│ (unminimize,    │
│  show, focus)   │
└────────┬────────┘
         │
┌────────▼────────┐
│ Frontend:       │
│ listen() →      │
│ loadFile() →    │
│ New Tab         │
└─────────────────┘
```

### 핵심 코드

#### 1. Rust 백엔드 (lib.rs)
```rust
use tauri::{Emitter, Manager};

pub fn run() {
    tauri::Builder::default()
        // single-instance 플러그인 - 가장 먼저 등록
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // 마크다운 파일 경로 필터링
            let file_paths = filter_md_files(&argv);

            if !file_paths.is_empty() {
                // 프론트엔드에 이벤트 전송
                let _ = app.emit("open-files-from-instance", file_paths);
            }

            // 창 활성화 - 동적으로 첫 번째 창 찾기
            let windows = app.webview_windows();
            if let Some((_, window)) = windows.iter().next() {
                if window.is_minimized().unwrap_or(false) {
                    let _ = window.unminimize();
                }
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        // ... 나머지 설정
}
```

#### 2. 프론트엔드 (main.js)
```javascript
// Tauri 이벤트 리스너
const { listen } = await import('@tauri-apps/api/event');

await listen('open-files-from-instance', async (event) => {
    const filePaths = event.payload;
    for (const filePath of filePaths) {
        await loadFile(filePath);  // 새 탭으로 열기
    }
});
```

### 주의사항

#### 창 찾기 방식
```rust
// ❌ 잘못된 방식 - label이 "main"이 아닐 수 있음
app.get_webview_window("main")

// ✅ 올바른 방식 - 동적으로 첫 번째 창 찾기
app.webview_windows().iter().next()
```

Tauri 2.0에서 `tauri.conf.json`에 `label` 필드가 없으면 기본 창 label이 "main"이 아닐 수 있음.

#### 빌드 vs 설치 테스트
| 테스트 방법 | 파일 연결 | 권장 |
|-------------|-----------|------|
| `target/release/vexa-md.exe` 직접 실행 | 이전 버전 유지 | ❌ |
| NSIS 인스톨러로 설치 후 테스트 | 새 버전 등록 | ✅ |

**항상 NSIS 인스톨러로 설치 후 테스트해야 정확한 동작 확인 가능.**

### 의존성
```toml
# Cargo.toml
[dependencies]
tauri-plugin-single-instance = "2"
```

---

## 테마 시스템 구조

### CSS 변수
```css
:root {
  --bg: #ffffff;
  --text: #1f2328;
  --accent: #656d76;
  --border: #d0d7de;
  --code-bg: #f6f8fa;
  --toolbar-bg: #f6f8fa;
  /* ... */
}
```

### 테마 적용 방식
1. `data-theme` 속성: 라이트/다크
2. `data-color` 속성: 컬러 테마 (purple, ocean 등)
3. `<style id="custom-theme-styles">`: 커스텀 스타일

### 커스텀 테마 저장
```javascript
// localStorage에 저장
localStorage.setItem('customStyles', JSON.stringify(styles));

// 저장 형식
{
  bg: '#ffffff',
  text: '#1f2328',
  accent: '#8b5cf6',
  // ... 모든 커스텀 속성
}
```

---

## 다국어 시스템 (i18n)

### 지원 언어
- 한국어 (ko) - 기본
- English (en)
- 日本語 (ja)

### 구조
```javascript
// src/i18n.js
export const i18n = {
  ko: {
    home: '홈',
    openFile: '파일 열기',
    // ... 모든 한국어 텍스트
  },
  en: {
    home: 'Home',
    openFile: 'Open File',
    // ... 모든 영어 텍스트
  },
  ja: {
    home: 'ホーム',
    openFile: 'ファイルを開く',
    // ... 모든 일본어 텍스트
  }
};
```

### 사용 방법
```javascript
import { i18n } from './i18n.js';

const lang = i18n[currentLanguage];
button.title = lang.openFile;
```

---

## Tauri 권한 설정

### capabilities/default.json
```json
{
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:default",
    "fs:allow-read",
    "fs:write-all",
    "fs:allow-download-write",
    "fs:allow-desktop-write",
    "fs:allow-document-write",
    "fs:allow-home-write"
  ]
}
```

---

## 플러그인

### 사용 중인 Tauri 플러그인
- `tauri-plugin-dialog`: 파일 열기/저장 다이얼로그
- `tauri-plugin-fs`: 파일 시스템 접근

---

## 플러그인 시스템

### 핵심 구조

```
src/
├── core/
│   ├── plugin.js           # Plugin 기본 클래스
│   ├── plugin-manager.js   # 플러그인 로딩/관리
│   └── plugin-api.js       # 플러그인에 노출되는 API
├── plugins/                # 내장 플러그인
│   └── mermaid/
│       └── index.js        # Mermaid 다이어그램 플러그인
└── modules/
    └── plugins/
        ├── plugin-ui.js    # 플러그인 관리 UI
        └── plugin-ui.css   # 플러그인 스타일
```

### Plugin API

```javascript
const api = {
  events,     // 이벤트 시스템
  store,      // 상태 관리
  markdown,   // 마크다운 확장 (addExtension, onAfterRender)
  ui,         // UI 확장 (addToolbarButton, showNotification)
  dom         // DOM 유틸리티
};
```

### 플러그인 개발

자세한 내용은 [plugin-development.md](./plugin-development.md) 참조.

---

## CSS 모듈 로딩 순서

`src/styles/index.css`에서 CSS 모듈을 로딩하는 순서:

| 순서 | 모듈 | 파일 | 설명 |
|------|------|------|------|
| 1 | theme | theme.css | CSS 변수 정의 |
| 2 | base | base.css | 전역 리셋, 기본 레이아웃 |
| 3 | ui | ui.css | UI 컴포넌트 |
| 4 | tabs | tabs.css | 탭 바 |
| 5 | files | files.css | 파일 관리 |
| 6 | search | search.css | 검색 바 |
| 7 | viewer | viewer.css | 마크다운 뷰어 |
| 8 | syntax | syntax.css | 코드 하이라이트 |
| 9 | toc | toc.css | 목차 사이드바 |
| 10 | editor | editor.css | 에디터 |
| 11 | plugins | plugin-ui.css | 플러그인 UI |

**⚠️ CSS 특이성 주의**: 나중에 로드된 CSS가 같은 특이성에서 우선. 하지만 **선택자 특이성이 다르면 순서와 무관**. 예: `#main-container #content` vs `#main-container.mode-split #content`.

---

## 트러블슈팅

개발 중 발생한 문제와 해결책은 [docs/troubleshooting/](./troubleshooting/) 참조.

### 주요 이슈 문서

- [Mermaid 다이어그램 크기 및 분할 화면 레이아웃](./troubleshooting/mermaid-split-mode.md)

---

## 빌드 및 실행

### 개발 모드
```bash
npm run tauri dev
```

### 프로덕션 빌드
```bash
npm run tauri build
```

### 빌드 결과물
```
src-tauri/target/release/
├── md-viewer.exe                              # 실행 파일
└── bundle/nsis/
    └── SP MD Viewer_1.0.0_x64-setup.exe       # 설치 파일
```

### 요구사항
- Node.js 18+
- Rust (rustup)
- Windows 10/11

---

## 문서 히스토리

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-30 | main.js 모듈 분리 리팩토링 - 13개 모듈 구조로 전면 재작성 |
| 2026-01-25 | 플러그인 시스템 아키텍처 추가 |
| 2026-01-25 | CSS 모듈 로딩 순서 문서화 |
| 2026-01-25 | 트러블슈팅 섹션 추가 |
| 2026-01-24 | editor 모듈 추가 (마크다운 편집 기능) |
| 2026-01-24 | highlight.js, html2pdf.js 기술 스택 추가 |
| 2026-01-24 | CSS 모듈 구조 업데이트 |
| 2026-01-22 | TOC 모듈 구조 추가 |
| 2025-12-29 | 모듈화 아키텍처 문서화 |

*마지막 업데이트: 2026-01-30*
