# SP MD Viewer - 기술 아키텍처

## 기술 스택

### Frontend
- **Vite**: 빌드 도구
- **Vanilla JavaScript (ES Modules)**: UI 및 로직
- **marked.js**: 마크다운 파싱

### Backend
- **Tauri 2.0**: 데스크톱 앱 프레임워크
- **Rust**: 네이티브 기능 (파일 읽기/쓰기)

---

## 프로젝트 구조

```
mdView/
├── src/                      # 프론트엔드 소스 (웹: JS, CSS)
│   ├── main.js               # 진입점 (172줄) - 모듈 초기화만
│   ├── style.css             # 전체 스타일시트
│   ├── i18n.js               # 다국어 지원 (한국어/영어)
│   │
│   ├── core/                 # 핵심 인프라
│   │   ├── store.js          # 중앙 상태 관리 (Observer 패턴)
│   │   ├── events.js         # 이벤트 버스 (모듈 간 통신)
│   │   └── dom.js            # DOM 유틸리티
│   │
│   ├── modules/              # 기능별 모듈
│   │   ├── theme/            # 테마 시스템
│   │   │   ├── theme-manager.js   # 테마 전환 로직
│   │   │   └── theme-editor.js    # 테마 편집기 모달
│   │   │
│   │   ├── tabs/             # 탭 관리
│   │   │   └── tabs.js       # 탭 생성/전환/닫기
│   │   │
│   │   ├── search/           # 검색 기능
│   │   │   └── search.js     # 텍스트 검색 및 하이라이트
│   │   │
│   │   ├── viewer/           # 마크다운 뷰어
│   │   │   ├── markdown.js   # 마크다운 렌더링
│   │   │   └── presentation.js # 프레젠테이션 모드
│   │   │
│   │   ├── files/            # 파일 처리
│   │   │   ├── file-handler.js   # 파일 열기/저장
│   │   │   ├── drag-drop.js      # 드래그앤드롭
│   │   │   └── recent-files.js   # 최근 파일 관리
│   │   │
│   │   └── ui/               # UI 컴포넌트
│   │       ├── keyboard.js   # 키보드 단축키
│   │       ├── view-mode.js  # 보기 모드 관리
│   │       ├── zoom.js       # 줌 관리
│   │       ├── help-menu.js  # 도움말 메뉴
│   │       └── settings.js   # 설정 (폰트, 언어 등)
│   │
│   └── utils/                # 공통 유틸리티
│       └── helpers.js        # 헬퍼 함수
│
├── src-tauri/                # Tauri 백엔드 소스 (Rust)
│   ├── src/
│   │   ├── lib.rs            # Tauri 커맨드 정의
│   │   └── main.rs           # 앱 엔트리포인트
│   ├── capabilities/
│   │   └── default.json      # 권한 설정
│   ├── icons/                # 앱 아이콘
│   ├── Cargo.toml            # Rust 의존성
│   └── tauri.conf.json       # Tauri 설정
├── public/                   # 정적 파일
│   └── logo.jpg              # Seven Peaks 로고
├── docs/                     # 문서
├── index.html                # 메인 HTML
├── package.json              # npm 의존성
└── vite.config.js            # Vite 설정
```

### 폴더 역할 설명

| 폴더 | 역할 | 실행 환경 |
|------|------|----------|
| `src/` | 프론트엔드 웹 코드 | 브라우저/WebView |
| `src-tauri/` | 네이티브 백엔드 코드 | 운영체제 (Rust) |

> `src-tauri`는 "src"가 아니라 **"Tauri용 소스"**라는 의미입니다.
> 이것은 Tauri 프로젝트의 **표준 구조**입니다.

---

## 주요 파일 설명

### index.html
- 툴바, 탭바, 검색바, 콘텐츠 영역
- 테마 커스터마이저 모달
- 프로그램 정보 / 단축키 모달
- 프레젠테이션 오버레이
- 드롭 오버레이

### src/main.js (172줄)
- 앱 진입점
- 모듈 import 및 초기화
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

### src/modules/ (기능별 모듈)

| 모듈 | 파일 | 역할 |
|------|------|------|
| theme | theme-manager.js | 테마 전환, CSS 변수 관리 |
| theme | theme-editor.js | 테마 편집기 모달 |
| tabs | tabs.js | 탭 생성/전환/닫기 |
| search | search.js | 텍스트 검색, 하이라이트 |
| viewer | markdown.js | 마크다운 렌더링, 페이징 |
| viewer | presentation.js | 프레젠테이션 모드 |
| files | file-handler.js | 파일 열기/저장, Tauri 연동 |
| files | drag-drop.js | 드래그앤드롭 처리 |
| files | recent-files.js | 최근 파일 목록 관리 |
| ui | keyboard.js | 키보드 단축키 |
| ui | view-mode.js | 보기 모드 (single/double/paging) |
| ui | zoom.js | 줌 레벨 관리 |
| ui | help-menu.js | 도움말/정보 모달 |
| ui | settings.js | 폰트, 언어 설정 + i18n 적용 |

### src/style.css
- CSS 변수 기반 테마 시스템
- 라이트/다크 모드
- 6개의 컬러 테마 정의
- 마크다운 렌더링 스타일
- 반응형 및 인쇄 스타일
- 프레젠테이션 모드 스타일
- 모달 스타일

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

### 기술적 접근

#### 시도했던 방법들 (실패)
1. **tauri-plugin-single-instance**: Windows에서 작동 안 함
2. **TCP 소켓 IPC**: 포트 바인딩 실패
3. **Windows Named Mutex (CreateMutexA)**: API 호환성 문제
4. **fslock crate**: 파일 락 실패
5. **sysinfo crate**: 앱 크래시 발생

#### 최종 구현 (성공)
**Windows tasklist 명령어 + 임시 파일 IPC**

```
┌─────────────────┐     ┌─────────────────┐
│  1st Instance   │     │  2nd Instance   │
│  (Running)      │     │  (New)          │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │ is_already_     │
         │              │ running()       │
         │              │ (tasklist)      │
         │              └────────┬────────┘
         │                       │ true
         │              ┌────────▼────────┐
         │              │ Save file path  │
         │              │ to temp file    │
         │              └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │ Activate window │
         │              │ & Exit          │
         │              └─────────────────┘
         │
┌────────▼────────┐
│ Background      │
│ thread (500ms)  │
│ polls temp file │
└────────┬────────┘
         │
┌────────▼────────┐
│ emit('open-     │
│ files-from-     │
│ instance')      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Frontend:       │
│ loadFile()      │
│ → New Tab       │
└─────────────────┘
```

### 핵심 코드

#### 1. 프로세스 중복 체크 (lib.rs)
```rust
fn is_already_running() -> bool {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let output = Command::new("tasklist")
        .args(["/FI", "IMAGENAME eq vexa-md.exe", "/FO", "CSV", "/NH"])
        .creation_flags(CREATE_NO_WINDOW)  // 콘솔 창 숨김
        .output();

    // 현재 PID가 아닌 다른 vexa-md.exe가 있으면 true
}
```

#### 2. 임시 파일 IPC (lib.rs)
```rust
// 저장: %TEMP%/vexa_md_open_files.txt
fn save_file_paths_to_temp(paths: &[String])

// 읽기 (500ms 폴링)
fn read_file_paths_from_temp() -> Vec<String>
```

#### 3. 이벤트 emit (lib.rs)
```rust
app.emit("open-files-from-instance", paths);
window.set_focus();
window.unminimize();
```

#### 4. 프론트엔드 수신 (main.js)
```javascript
await listen('open-files-from-instance', async (event) => {
    for (const filePath of event.payload) {
        await loadFile(filePath);  // 새 탭으로 열기
    }
});
```

### 주요 특징
- **콘솔 창 없음**: `CREATE_NO_WINDOW` 플래그 사용
- **크로스 플랫폼 준비**: `#[cfg(windows)]` 조건부 컴파일
- **안정성**: tasklist는 Windows 기본 명령어로 항상 사용 가능
- **응답성**: 500ms 폴링으로 빠른 파일 전달

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
