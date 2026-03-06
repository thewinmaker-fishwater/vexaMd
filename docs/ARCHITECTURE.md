# Vexa MD - 기술 아키텍처

## 기술 스택

### Frontend
- **Vite 5.4.x**: 빌드 도구
- **Vanilla JavaScript (ES Modules)**: UI 및 로직
- **marked.js 12.x**: 마크다운 파싱
- **highlight.js 11.x**: 코드 문법 하이라이트
- **Mermaid.js 11.x**: 다이어그램 렌더링 (플러그인)
- **html2pdf.js**: PDF 내보내기

### Backend
- **Tauri 2.0**: 데스크톱 앱 프레임워크
- **Rust**: 네이티브 기능 (파일 I/O, AES-256-GCM 암호화, 윈도우 관리)

### 플랫폼
- Windows (NSIS 인스톨러)
- macOS (DMG, ARM64 + Intel)
- Linux (DEB, AppImage)

---

## 프로젝트 구조

```
workspace-mdView/
├── src/                          # 프론트엔드 소스 (웹: JS, CSS)
│   ├── main.js                   # 오케스트레이터 (~341줄) - 모듈 조립/초기화
│   ├── i18n.js                   # 다국어 지원 (한국어/영어/일본어)
│   │
│   ├── styles/                   # CSS 모듈 시스템
│   │   ├── index.css             # CSS 진입점 (@import 15개 모듈)
│   │   ├── base.css              # 전역 리셋, 기본 레이아웃
│   │   └── animations.css        # 알림 애니메이션 (slideIn/slideOut)
│   │
│   ├── core/                     # 핵심 인프라
│   │   ├── store.js              # 중앙 상태 관리 (Observer 패턴)
│   │   ├── events.js             # 이벤트 버스 (모듈 간 통신)
│   │   ├── dom.js                # DOM 유틸리티
│   │   ├── text-utils.js         # 텍스트 유틸리티 (단어/글자/읽기시간 카운팅)
│   │   ├── plugin.js             # Plugin 기본 클래스
│   │   ├── plugin-manager.js     # 플러그인 로딩/관리/설치/제거
│   │   └── plugin-api.js         # 플러그인에 노출되는 API
│   │
│   ├── modules/                  # 기능별 모듈 (20개)
│   │   ├── notification/         # 알림 시스템
│   │   │   └── notification.js   # showNotification, showError
│   │   ├── image-modal/          # 이미지 확대 모달
│   │   │   └── image-modal.js    # 이미지 열기/닫기/줌/드래그
│   │   ├── print/                # 인쇄/PDF
│   │   │   └── print.js          # printDocument, exportPdf
│   │   ├── presentation/         # 프레젠테이션
│   │   │   └── presentation-mode.js
│   │   ├── markdown/             # 마크다운 렌더링
│   │   │   └── renderer.js       # marked 설정, renderMarkdown, renderPages
│   │   ├── search/               # 검색 기능
│   │   │   ├── search-manager.js # 검색 수행/하이라이트/네비게이션
│   │   │   └── search.css
│   │   ├── tabs/                 # 탭 관리
│   │   │   ├── tab-manager.js    # createTab, switchToTab, closeTab, 횡스크롤
│   │   │   └── tabs.css
│   │   ├── zoom/                 # 줌/뷰모드
│   │   │   └── zoom-manager.js   # setViewMode, setZoom, pan
│   │   ├── files/                # 파일 처리
│   │   │   ├── file-ops.js       # openFile, loadFile, dragDrop, fileWatcher, recentFiles
│   │   │   └── files.css
│   │   ├── session/              # 세션 관리
│   │   │   └── session.js        # saveSession, restoreSession
│   │   ├── vmd/                  # 읽기전용 포맷
│   │   │   ├── vmd.js            # exportVmd, exportVmdToMd, loadVmdFile
│   │   │   ├── vmd-key-ui.js     # 키 관리 UI (생성/편집/삭제/내보내기/가져오기)
│   │   │   └── vmd-key-ui.css
│   │   ├── theme/                # 테마 시스템
│   │   │   ├── theme-system.js   # 테마 적용/에디터/프리셋/임포트/내보내기
│   │   │   └── theme.css         # 테마 CSS 변수 (6종 컬러)
│   │   ├── shortcuts/            # 키보드 단축키
│   │   │   └── shortcuts.js      # 키보드 핸들러, 링크 핸들러, 코드 복사
│   │   ├── toc/                  # TOC 사이드바
│   │   │   ├── toc.js            # 목차 생성/스크롤 스파이
│   │   │   └── toc.css
│   │   ├── editor/               # 마크다운 편집기
│   │   │   ├── editor-manager.js # 에디터 모드/입력/저장 관리
│   │   │   └── editor.css
│   │   ├── welcome/              # 웰컴 화면
│   │   │   └── welcome.js        # 홈 화면 HTML 생성
│   │   ├── ui/                   # UI 공통
│   │   │   ├── ui-texts.js       # i18n 기반 UI 텍스트 업데이트
│   │   │   └── ui.css            # UI 컴포넌트 스타일
│   │   ├── plugins/              # 플러그인 UI
│   │   │   ├── plugin-ui.js      # 플러그인 관리 UI
│   │   │   └── plugin-ui.css
│   │   ├── updater/              # 자동 업데이트
│   │   │   ├── updater.js        # 버전 확인, 다운로드, 재시작
│   │   │   └── updater.css
│   │   ├── status-bar/           # 상태바
│   │   │   └── status-bar.js     # 글자수/단어수/읽기시간/줌 표시
│   │   └── viewer/               # 뷰어 공통
│   │       ├── viewer.css        # 마크다운 뷰어 스타일
│   │       └── syntax.css        # 코드 하이라이트 스타일
│   │
│   ├── plugins/                  # 내장 플러그인 (11개)
│   │   ├── mermaid/              # Mermaid 다이어그램
│   │   ├── word-counter/         # 단어 수 카운터
│   │   ├── reading-time/         # 읽기 시간 추정
│   │   ├── auto-toc-insert/      # [TOC] 목차 삽입
│   │   ├── image-zoom/           # 이미지 확대
│   │   ├── footnote/             # 각주 [^1]
│   │   ├── copy-as-html/         # HTML 복사
│   │   ├── emoji-replace/        # 이모지 변환
│   │   ├── external-link-icon/   # 외부 링크 아이콘
│   │   ├── highlight-search/     # 키워드 하이라이팅
│   │   └── template/             # 개발자 템플릿
│   │
│   └── components/               # 재사용 컴포넌트
│       ├── icons.js              # SVG 아이콘 모음
│       ├── toolbar.js            # 툴바 컴포넌트
│       └── helpers.js            # 헬퍼 함수
│
├── src-tauri/                    # Tauri 백엔드 소스 (Rust)
│   ├── src/
│   │   ├── lib.rs                # Tauri 커맨드, VMD 암호화, 윈도우 관리
│   │   └── main.rs               # 앱 엔트리포인트 (vexa_md_lib::run())
│   ├── capabilities/
│   │   └── default.json          # 권한 설정
│   ├── icons/                    # 앱 아이콘
│   ├── Cargo.toml                # Rust 의존성
│   └── tauri.conf.json           # Tauri 설정 + 업데이터 설정
├── public/                       # 정적 파일
│   ├── logo.jpg                  # 로고
│   └── favicon.ico               # 파비콘
├── docs/                         # 문서
├── .github/workflows/            # CI/CD
│   └── release.yml               # 멀티플랫폼 릴리스 빌드
├── index.html                    # 메인 HTML
├── package.json                  # npm 의존성
└── vite.config.js                # Vite 설정
```

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
| tabs | tab-manager.js | 탭 생성/전환/닫기, 횡스크롤, 스크롤 위치 저장 |
| zoom | zoom-manager.js | 줌, 뷰모드, pan |
| file-ops | file-ops.js | 파일 열기/저장, 드래그앤드롭, 파일 워처, 최근 파일 |
| session | session.js | 세션 저장/복원 (탭 상태 유지) |
| vmd | vmd.js, vmd-key-ui.js | 읽기전용 포맷 (.vmd) 내보내기/열기, 키 관리 UI |
| theme | theme-system.js | 테마 적용/에디터/프리셋/임포트/내보내기 |
| shortcuts | shortcuts.js | 키보드 단축키, 외부 링크, 앵커, 코드 복사 |
| toc | toc.js | 목차 사이드바, 스크롤 스파이 |
| editor-manager | editor-manager.js | 에디터 모드 전환, 입력 처리, 저장 |
| welcome | welcome.js | 홈 화면 웰컴 HTML 생성 |
| ui-texts | ui-texts.js | i18n 기반 전체 UI 텍스트 업데이트 |
| plugin-ui | plugin-ui.js | 플러그인 관리 UI (설치/삭제/에러/설정 폼) |
| updater | updater.js | 자동 업데이트 확인/다운로드/재시작 |
| status-bar | status-bar.js | 하단 상태바 (글자수/단어수/읽기시간/파일명/줌) |

### main.js (오케스트레이터)에 남은 것

- 모듈 import 및 조립
- DOM element 캐싱 (툴바 드롭다운, 모달)
- 글로벌 상태 선언 (currentLanguage)
- `init()` 함수 (각 모듈 초기화 호출)
- `updateUITexts()` 래퍼 (실제 로직은 ui-texts.js)
- 툴바 드롭다운 핸들러
- VMD 컨텍스트 빌더
- Export 버튼 상태 업데이트

---

## 주요 파일 설명

### index.html
- 툴바 (서식/도구 드롭다운 그룹)
- 탭바 (횡스크롤, 좌우 방향 버튼)
- 검색바, 콘텐츠 영역
- 테마 커스터마이저 모달
- 프로그램 정보 / 단축키 모달
- 프레젠테이션 오버레이
- 드롭 오버레이

### src/main.js (~341줄)
- 앱 오케스트레이터 (진입점)
- 20개 모듈 import 및 context 전달로 초기화
- 툴바 이벤트 연결

### src/core/ (핵심 인프라)

#### text-utils.js - 텍스트 분석 유틸리티
```javascript
// CJK 인식 단어/글자/읽기시간 카운팅 (상태바, Word Counter 플러그인에서 공유)
import { countWords, countChars, calcReadingTime } from './text-utils.js';
countWords('Hello 안녕하세요');  // CJK 문자는 개별 단어로 카운팅
```

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
- 다국어 번역 데이터 (한국어/영어/일본어)
- 모든 UI 텍스트 중앙 관리
- 언어 전환 시 동적 업데이트

### src-tauri/src/lib.rs

Tauri 커맨드와 앱 설정을 정의하는 Rust 백엔드 핵심 파일.

#### 커맨드 목록

| 커맨드 | 역할 |
|--------|------|
| `read_file` | 마크다운/텍스트 파일 읽기 (확장자 검증) |
| `write_file` | 파일 쓰기 (에디터 저장) |
| `get_cli_args` | CLI 인자에서 .md/.vmd 파일 경로 추출 |
| `write_vmd` | VMD 암호화 저장 (v2: MAGIC + VERSION + KEY_NAME + NONCE + ENCRYPTED) |
| `read_vmd` | VMD 복호화 읽기 (v1/v2 자동 감지) |
| `read_vmd_info` | VMD 헤더 정보 읽기 (키 이름, 버전) |
| `generate_random_key` | 랜덤 32바이트 AES 키 생성 (hex 반환) |
| `show_window` | 프론트엔드 준비 완료 후 윈도우 표시 (모니터 영역 체크) |

#### 앱 설정 (`run()`)
- **싱글 인스턴스**: `tauri_plugin_single_instance` (중복 실행 방지, 파일 전달)
- **윈도우 상태 복원**: `tauri_plugin_window_state` (`VISIBLE` 제외로 깜빡임 방지)
- **자동 업데이트**: `tauri_plugin_updater` (GitHub Releases 기반)
- **프로세스 재시작**: `tauri_plugin_process` (업데이트 후 재시작)

---

## 싱글 인스턴스 구현

### 개요
MD 파일을 더블클릭할 때 새 앱이 열리지 않고, 기존 앱의 새 탭으로 열리도록 구현.

### 아키텍처

```
┌─────────────────┐     ┌─────────────────┐
│  1st Instance   │     │  2nd Instance   │
│  (Running)      │     │  (New)          │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │ single-instance │
         │              │ (mutex check)   │
         │              └────────┬────────┘
         │                       │ mutex exists
         │              ┌────────▼────────┐
         │              │ Send args →     │
         │              │ Exit 2nd        │
         │              └─────────────────┘
         │
┌────────▼────────┐
│ emit('open-     │
│ files-from-     │
│ instance')      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Focus window +  │
│ New Tab         │
└─────────────────┘
```

### 주의사항

#### 창 찾기 방식
```rust
// ❌ 잘못된 방식 - label이 "main"이 아닐 수 있음
app.get_webview_window("main")

// ✅ 올바른 방식 - 동적으로 첫 번째 창 찾기
app.webview_windows().iter().next()
```

#### 빌드 vs 설치 테스트
**항상 NSIS 인스톨러로 설치 후 테스트해야 정확한 동작 확인 가능.**

---

## Tauri 플러그인

### 사용 중인 Tauri 플러그인

| 플러그인 | 역할 |
|----------|------|
| `tauri-plugin-single-instance` | 싱글 인스턴스 (중복 실행 방지) |
| `tauri-plugin-dialog` | 파일 열기/저장 다이얼로그 |
| `tauri-plugin-fs` | 파일 시스템 접근 (watch 포함) |
| `tauri-plugin-shell` | 외부 링크 브라우저 열기 |
| `tauri-plugin-window-state` | 윈도우 크기/위치 저장/복원 |
| `tauri-plugin-updater` | 자동 업데이트 (GitHub Releases) |
| `tauri-plugin-process` | 프로세스 재시작 (업데이트 후) |

### Rust 추가 의존성

| 크레이트 | 역할 |
|----------|------|
| `aes-gcm` | AES-256-GCM 암호화 (VMD 파일) |
| `rand` | 랜덤 키 생성 |
| `hex` | hex 인코딩/디코딩 |
| `windows` (Windows only) | Win32 API (모니터 감지) |

---

## Tauri 권한 설정

### capabilities/default.json

```json
{
  "permissions": [
    "core:default",
    "dialog:default", "dialog:allow-open", "dialog:allow-save",
    "fs:default", "fs:allow-read", "fs:allow-watch", "fs:allow-unwatch",
    "fs:write-all", "fs:allow-download-write", "fs:allow-desktop-write",
    "fs:allow-document-write", "fs:allow-home-write",
    "shell:default", "shell:allow-open",
    "updater:default",
    "process:allow-restart",
    { "identifier": "fs:scope", "allow": ["**", "$HOME/**", "$DOCUMENT/**", "$DOWNLOAD/**", "$DESKTOP/**"] }
  ]
}
```

---

## 플러그인 시스템

### 핵심 구조

```
src/core/
├── plugin.js           # Plugin 기본 클래스
├── plugin-manager.js   # 플러그인 로딩/관리/설치/제거
└── plugin-api.js       # 플러그인에 노출되는 API

src/plugins/            # 내장 플러그인 (각각 index.js + plugin.json)
├── mermaid/            # Mermaid 다이어그램
├── word-counter/       # 단어 수 카운터
├── reading-time/       # 읽기 시간 추정
├── auto-toc-insert/    # [TOC] 마커 목차 삽입
├── image-zoom/         # 이미지 라이트박스
├── footnote/           # 각주 [^1] 렌더링
├── copy-as-html/       # HTML 클립보드 복사
├── emoji-replace/      # :smile: → 이모지 변환
├── external-link-icon/ # 외부 링크 아이콘
├── highlight-search/   # 키워드 영구 하이라이팅
└── template/           # 개발자 템플릿
```

### Plugin API

```javascript
const api = {
  events,     // 이벤트 시스템
  store,      // 상태 관리
  markdown,   // 마크다운 확장 (addExtension, onAfterRender)
  ui,         // UI 확장 (addToolbarButton, showNotification)
  dom,        // DOM 유틸리티
  utils       // 헬퍼 (debounce, throttle, generateId)
};
```

### 플러그인 설치 경로
- **내장 플러그인**: `src/plugins/` (빌드 시 번들)
- **외부 플러그인**: `{appDataDir}/plugins/` (런타임 스캔)

### 플러그인 개발
- 개발자 가이드: [plugin-development.md](./plugin-development.md)
- 사용자 가이드: [plugin-user-guide.md](./plugin-user-guide.md)

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
}
```

### 테마 적용 방식
1. `data-theme` 속성: 라이트/다크
2. `data-color` 속성: 컬러 테마 (default, purple, ocean, sunset, forest, rose)
3. `<style id="custom-theme-styles">`: 커스텀 스타일

### 커스텀 테마 프리셋
- 여러 커스텀 테마를 이름 붙여 저장
- JSON 파일로 내보내기/가져오기 지원

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
| 12 | vmd-key | vmd-key-ui.css | VMD 키 관리 UI |
| 13 | status-bar | status-bar.css | 하단 상태바 |
| 14 | animations | animations.css | 알림 애니메이션 |
| 15 | updater | updater.css | 자동 업데이트 모달 |

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
  ko: { home: '홈', openFile: '파일 열기', /* ... */ },
  en: { home: 'Home', openFile: 'Open File', /* ... */ },
  ja: { home: 'ホーム', openFile: 'ファイルを開く', /* ... */ }
};
```

---

## 자동 업데이트 시스템

### 아키텍처

```
┌──────────────┐    HTTPS    ┌─────────────────┐
│ Vexa MD App  │────────────→│ GitHub Releases  │
│ (updater.js) │             │ latest.json      │
└──────┬───────┘             └────────┬────────┘
       │                              │
       │ 버전 비교                      │ URL + 서명
       │                              │
┌──────▼───────┐             ┌────────▼────────┐
│ 다운로드 +    │←────────────│ .exe / .dmg /   │
│ 서명 검증     │  minisign   │ .AppImage + .sig│
└──────┬───────┘             └─────────────────┘
       │
┌──────▼───────┐
│ 재시작 →     │
│ 새 버전 적용  │
└──────────────┘
```

### CI/CD 파이프라인 (`release.yml`)

| 잡 | 역할 |
|----|------|
| `create-release` | `gh api`로 draft 릴리스 생성 |
| `build` (4x) | Windows, macOS ARM64, macOS Intel, Linux 병렬 빌드 |
| `update-json` | `latest.json` 생성 및 릴리스에 업로드 |

---

## 트러블슈팅

개발 중 발생한 문제와 해결책은 [docs/troubleshooting/](./troubleshooting/) 참조.

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
├── vexa-md.exe                              # 실행 파일
└── bundle/nsis/
    └── Vexa MD_1.5.2_x64-setup.exe          # 설치 파일
```

### 요구사항
- Node.js 18+
- Rust (rustup)
- Windows 10/11, macOS, 또는 Linux

---

## 문서 히스토리

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-20 | status-bar 모듈, text-utils.js 추가, CSS 15개 모듈로 업데이트 |
| 2026-02-14 | 전면 동기화: Vexa MD 통일, 모듈/플러그인/Tauri 플러그인 목록 현행화, 자동 업데이트/CI 섹션 추가 |
| 2026-01-31 | 플러그인 시스템 Phase 2, main.js 추가 축소 리팩토링 |
| 2026-01-30 | main.js 모듈 분리 리팩토링 - 13개 모듈 구조로 전면 재작성 |
| 2026-01-25 | 플러그인 시스템 아키텍처 추가, CSS 모듈 로딩 순서 문서화 |
| 2025-12-29 | 모듈화 아키텍처 문서화 |

*마지막 업데이트: 2026-02-20*
