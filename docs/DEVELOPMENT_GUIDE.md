# SP MD Viewer 개발 가이드

## 완전한 개발 과정: 설계부터 배포까지

---

## 1. 프로젝트 설계

### 1.1 요구사항 분석

| 구분 | 요구사항 |
|------|----------|
| 성능 | 1초 미만 렌더링 |
| 크기 | 초경량 (2MB 이하) |
| 기능 | 마크다운 뷰어 |
| 플랫폼 | Windows |
| UI | 다크/라이트 테마 |

### 1.2 기술 스택 선정

**왜 Tauri를 선택했나?**

| 프레임워크 | 설치 파일 크기 | 메모리 사용 | 언어 |
|------------|----------------|-------------|------|
| Electron | ~150MB | ~300MB | JavaScript |
| Tauri | ~1-2MB | ~30MB | Rust + JS |
| Qt | ~50MB | ~100MB | C++ |

Tauri는 시스템 WebView를 사용하므로 Chromium을 번들하지 않아 초경량입니다.

### 1.3 아키텍처 설계

```
┌─────────────────────────────────────────────┐
│                  사용자 인터페이스                │
│           (HTML + CSS + JavaScript)           │
├─────────────────────────────────────────────┤
│                 Tauri Core                    │
│  ┌─────────────┐    ┌─────────────────────┐  │
│  │   IPC 통신   │    │   플러그인 시스템     │  │
│  └─────────────┘    └─────────────────────┘  │
├─────────────────────────────────────────────┤
│                Rust Backend                   │
│  ┌─────────────┐    ┌─────────────────────┐  │
│  │  파일 읽기   │    │   CLI 인자 처리      │  │
│  └─────────────┘    └─────────────────────┘  │
├─────────────────────────────────────────────┤
│              Windows OS (WebView2)           │
└─────────────────────────────────────────────┘
```

---

## 2. 개발 환경 구축

### 2.1 필수 소프트웨어 설치

#### Step 1: Node.js 설치
```bash
# Windows에서 winget으로 설치
winget install OpenJS.NodeJS.LTS

# 설치 확인
node --version  # v18.x.x 이상
npm --version   # 9.x.x 이상
```

#### Step 2: Rust 설치
```bash
# rustup 설치 (Rust 버전 관리자)
winget install Rustlang.Rustup

# 환경 변수 적용 (새 터미널 열기 또는)
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path

# 설치 확인
rustc --version  # rustc 1.7x.x
cargo --version  # cargo 1.7x.x
```

#### Step 3: Visual Studio Build Tools (Windows)
Rust 컴파일에 필요한 C++ 빌드 도구입니다.
```bash
winget install Microsoft.VisualStudio.2022.BuildTools
```
설치 시 "Desktop development with C++" 워크로드 선택

#### Step 4: WebView2 Runtime
Windows 10/11에는 기본 포함. 없다면:
```bash
winget install Microsoft.EdgeWebView2Runtime
```

### 2.2 프로젝트 생성

#### 방법 1: npm으로 생성 (권장)
```bash
# 프로젝트 디렉토리 생성
mkdir C:\workspace-mdView
cd C:\workspace-mdView

# package.json 생성
npm init -y
```

#### 방법 2: Tauri CLI로 생성
```bash
npm create tauri-app@latest
```

---

## 3. 프로젝트 구조 생성

### 3.1 package.json 설정

```json
{
  "name": "md-viewer",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "tauri": "tauri"
  },
  "dependencies": {
    "marked": "^12.0.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "vite": "^5.4.0"
  }
}
```

```bash
# 의존성 설치
npm install
```

### 3.2 Vite 설정 (vite.config.js)

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  // Tauri 개발 서버가 모든 호스트에서 접근 가능하도록
  server: {
    strictPort: true,
  },
  // 빌드 시 소스맵 제거 (용량 감소)
  build: {
    sourcemap: false,
  },
  // 환경 변수 접두사
  envPrefix: ['VITE_', 'TAURI_'],
});
```

### 3.3 Tauri 초기화

```bash
# Tauri 프로젝트 구조 생성
npm run tauri init
```

다음 질문에 답변:
- App name: `SP MD Viewer`
- Window title: `SP MD Viewer`
- Web assets path: `../dist`
- Dev server URL: `http://localhost:5173`
- Dev command: `npm run dev`
- Build command: `npm run build`

---

## 4. Rust 백엔드 개발

### 4.1 Cargo.toml 설정

`src-tauri/Cargo.toml`:
```toml
[package]
name = "md-viewer"
version = "1.0.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[profile.release]
strip = true
lto = true
codegen-units = 1
panic = "abort"
```

### 4.2 main.rs 작성

`src-tauri/src/main.rs`:
```rust
// 릴리스 빌드에서 콘솔 창 숨김 (Windows)
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    md_viewer_lib::run()
}
```

### 4.3 lib.rs 작성

`src-tauri/src/lib.rs`:
```rust
use tauri::Manager;
use std::env;

/// 파일을 읽어서 문자열로 반환
/// 프론트엔드에서 invoke('read_file', { path: '...' })로 호출
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("파일 읽기 실패: {}", e))
}

/// CLI 인자에서 마크다운 파일 경로 추출
/// 예: md-viewer.exe file.md → ["file.md"] 반환
#[tauri::command]
fn get_cli_args() -> Vec<String> {
    env::args()
        .skip(1)  // 첫 번째 인자(프로그램 경로) 건너뛰기
        .filter(|arg| {
            let lower = arg.to_lowercase();
            lower.ends_with(".md")
                || lower.ends_with(".markdown")
                || lower.ends_with(".txt")
        })
        .collect()
}

/// Tauri 앱 실행
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 플러그인 등록
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // 커맨드 핸들러 등록
        .invoke_handler(tauri::generate_handler![
            read_file,
            get_cli_args
        ])
        // 앱 초기화
        .setup(|app| {
            // 메인 윈도우 표시
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            Ok(())
        })
        // 앱 실행
        .run(tauri::generate_context!())
        .expect("Tauri 앱 실행 중 오류 발생");
}
```

### 4.4 권한 설정

`src-tauri/capabilities/default.json`:
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "기본 권한",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "fs:default",
    "fs:allow-read-text-file"
  ]
}
```

### 4.5 Tauri 설정

`src-tauri/tauri.conf.json`:
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "SP MD Viewer",
  "version": "1.0.0",
  "identifier": "com.chilbong.mdviewer",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "SP MD Viewer",
        "width": 1200,
        "height": 800,
        "minWidth": 600,
        "minHeight": 400,
        "resizable": true,
        "fullscreen": false,
        "visible": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico"
    ],
    "windows": {
      "webviewInstallMode": {
        "type": "downloadBootstrapper"
      }
    }
  },
  "plugins": {}
}
```

---

## 5. 프론트엔드 개발

### 5.1 HTML 구조 (index.html)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SP MD Viewer</title>
  <link rel="stylesheet" href="/src/style.css">
</head>
<body>
  <!-- 툴바 -->
  <div id="toolbar">
    <button id="btn-home" title="홈으로">🏠</button>
    <button id="btn-open" title="파일 열기">📂</button>
    <!-- ... 더 많은 버튼 ... -->
  </div>

  <!-- 탭 바 -->
  <div id="tab-bar">
    <div id="tabs-container"></div>
  </div>

  <!-- 콘텐츠 영역 -->
  <main id="content" class="markdown-body">
    <div class="welcome">
      <h1>SP MD Viewer</h1>
      <p>마크다운 파일을 열거나 드래그하세요.</p>
    </div>
  </main>

  <!-- 드래그 오버레이 -->
  <div id="drop-overlay">
    <div class="drop-message">파일을 놓으세요</div>
  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### 5.2 JavaScript 핵심 로직 (src/main.js)

```javascript
import { marked } from 'marked';

// Tauri API 동적 로드
let tauriApi = null;
let dialogApi = null;

async function initTauri() {
  try {
    tauriApi = await import('@tauri-apps/api/core');
    dialogApi = await import('@tauri-apps/plugin-dialog');
  } catch (e) {
    console.log('브라우저 모드로 실행');
  }
}

// 마크다운 렌더링
function renderMarkdown(text) {
  const html = marked.parse(text);
  document.getElementById('content').innerHTML = html;
}

// 파일 열기
async function openFile() {
  if (dialogApi) {
    // Tauri 환경: 네이티브 다이얼로그
    const selected = await dialogApi.open({
      filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }]
    });
    if (selected) {
      const content = await tauriApi.invoke('read_file', { path: selected });
      renderMarkdown(content);
    }
  } else {
    // 브라우저 환경: HTML input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      const text = await file.text();
      renderMarkdown(text);
    };
    input.click();
  }
}

// 초기화
async function init() {
  await initTauri();

  document.getElementById('btn-open').addEventListener('click', openFile);

  // CLI 인자 처리
  if (tauriApi) {
    const args = await tauriApi.invoke('get_cli_args');
    if (args.length > 0) {
      const content = await tauriApi.invoke('read_file', { path: args[0] });
      renderMarkdown(content);
    }
  }
}

init();
```

### 5.3 CSS 테마 시스템 (src/style.css)

```css
/* CSS 변수를 활용한 테마 시스템 */
:root {
  --bg: #ffffff;
  --text: #1f2328;
  --accent: #656d76;
}

[data-theme="dark"] {
  --bg: #0d1117;
  --text: #e6edf3;
  --accent: #8b949e;
}

body {
  background: var(--bg);
  color: var(--text);
}

/* 마크다운 스타일 */
.markdown-body {
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.7;
}

.markdown-body h1 {
  border-bottom: 2px solid var(--accent);
}
```

---

## 6. 아이콘 생성

### 6.1 Python으로 아이콘 생성

```python
from PIL import Image, ImageDraw

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 배경 (둥근 사각형)
    margin = size // 8
    draw.rounded_rectangle(
        [margin, margin, size-margin, size-margin],
        radius=size//6,
        fill=(100, 100, 100)
    )

    # MD 텍스트
    # ... 텍스트 그리기 ...

    return img

# 아이콘 저장
sizes = [32, 128, 256]
for s in sizes:
    img = create_icon(s)
    img.save(f'src-tauri/icons/{s}x{s}.png')

# ICO 파일 생성
img = create_icon(256)
img.save('src-tauri/icons/icon.ico', format='ICO')
```

---

## 7. 빌드 및 실행

### 7.1 개발 모드 실행

```bash
# 개발 서버 + Tauri 앱 동시 실행
npm run tauri dev
```

**개발 모드 특징:**
- Hot Reload: 코드 수정 시 자동 새로고침
- DevTools: F12로 개발자 도구 열기
- 빠른 빌드: 최적화 없이 빠르게 컴파일

### 7.2 프로덕션 빌드

```bash
# 최적화된 실행 파일 생성
npm run tauri build
```

**빌드 결과물:**
```
src-tauri/target/release/
├── md-viewer.exe                    # 실행 파일
└── bundle/nsis/
    └── SP MD Viewer_1.0.0_x64-setup.exe  # 설치 파일
```

### 7.3 빌드 최적화 옵션

`Cargo.toml`의 `[profile.release]` 섹션:

| 옵션 | 설명 | 효과 |
|------|------|------|
| `strip = true` | 심볼 제거 | 파일 크기 30% 감소 |
| `lto = true` | Link Time Optimization | 성능 10% 향상 |
| `codegen-units = 1` | 단일 컴파일 유닛 | 최적화 향상 |
| `panic = "abort"` | 패닉 시 즉시 종료 | 파일 크기 감소 |

---

## 8. 실행 방법

### 8.1 설치 프로그램으로 설치
```
SP MD Viewer_1.0.0_x64-setup.exe 실행
→ 설치 마법사 따라 진행
→ 시작 메뉴에서 실행
```

### 8.2 직접 실행
```bash
# 실행 파일 직접 실행
./md-viewer.exe

# 파일과 함께 실행
./md-viewer.exe README.md
```

### 8.3 파일 연결 (더블클릭으로 열기)

1. `.md` 파일 우클릭
2. "연결 프로그램" → "다른 앱 선택"
3. `md-viewer.exe` 선택
4. "항상 이 앱으로 열기" 체크

---

## 9. 빌드 vs 설치 테스트

### 9.0 테스트 환경 차이점

Tauri 앱을 테스트할 때 **빌드 후 직접 실행**과 **설치 후 실행**은 다른 결과를 낼 수 있습니다.

#### 차이점 비교

| 항목 | 빌드 후 직접 실행 | NSIS 설치 후 실행 |
|------|------------------|-------------------|
| 실행 경로 | `target/release/vexa-md.exe` | `C:/Users/.../AppData/.../vexa-md.exe` |
| 파일 연결 | 이전 설치 버전 유지 | 새 버전으로 업데이트 |
| 레지스트리 | 변경 없음 | 앱 정보 등록/업데이트 |
| 싱글 인스턴스 | 경로 불일치로 오작동 가능 | 정상 동작 |
| 시작 메뉴 | 변경 없음 | 바로가기 생성/업데이트 |

#### 반드시 설치 후 테스트해야 하는 기능

1. **싱글 인스턴스**: 파일 더블클릭 시 기존 앱에서 열기
2. **파일 연결**: `.md` 파일과 앱 연결
3. **시스템 통합**: 시작 메뉴, 프로그램 추가/제거

#### 테스트 워크플로우

```bash
# 1. 빌드
npm run tauri build

# 2. 설치 (반드시!)
# src-tauri/target/release/bundle/nsis/ 폴더의 설치 파일 실행

# 3. 테스트
# - 앱 실행
# - MD 파일 더블클릭 (싱글 인스턴스 테스트)
# - 파일 연결 테스트
```

#### 개발 모드 vs 릴리스 빌드

| 테스트 유형 | 권장 환경 | 명령어 |
|-------------|-----------|--------|
| UI/기능 개발 | 개발 모드 | `npm run tauri dev` |
| 성능 테스트 | 릴리스 빌드 | `npm run tauri build` |
| 시스템 통합 | **설치 후** | NSIS 인스톨러 실행 |

---

## 10. 문제 해결

### 10.1 Rust 관련 오류

```bash
# "cargo not found" 오류
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path

# 또는 새 터미널 열기
```

### 10.2 포트 충돌

```bash
# "Port 5173 is already in use" 오류
# node 프로세스 종료
taskkill /F /IM "node.exe"
```

### 10.3 WebView2 오류

```bash
# WebView2 런타임 설치
winget install Microsoft.EdgeWebView2Runtime
```

### 10.4 빌드 오류

```bash
# 캐시 삭제 후 재빌드
cargo clean
npm run tauri build
```

---

## 11. 성능 최적화

### 11.1 초기 로딩 최적화

**Tauri API 병렬 로드:**
```javascript
// 기존: 순차 로드 (느림)
tauriApi = await import('@tauri-apps/api/core');
const dialogModule = await import('@tauri-apps/plugin-dialog');
const fsModule = await import('@tauri-apps/plugin-fs');

// 개선: 병렬 로드 (빠름)
const [coreModule, dialogModule, fsModule] = await Promise.all([
  import('@tauri-apps/api/core'),
  import('@tauri-apps/plugin-dialog'),
  import('@tauri-apps/plugin-fs')
]);
```

**UI 우선 렌더링:**
```javascript
async function init() {
  // 1. UI 먼저 렌더링 (즉시 화면 표시)
  applyTheme(currentTheme);
  renderTabs();
  // ... 기타 UI 초기화 ...

  // 2. Tauri 초기화 (백그라운드)
  initTauri().then(() => {
    setupTauriEvents();
    handleCliArgs();
  });
}
```

### 11.2 성능 측정

`main.js`에 성능 측정 코드가 주석으로 포함되어 있습니다:
```javascript
// [PERF] 성능 측정 코드 (필요시 주석 해제)
// const initStart = performance.now();
// console.log('[PERF] init() 시작');
// ...
// console.log(`[PERF] UI 초기화: ${(performance.now() - initStart).toFixed(1)}ms`);
```

### 11.3 개발자 도구 (F12)

프로덕션 빌드에서 F12 개발자 도구를 사용하려면:

`src-tauri/Cargo.toml`:
```toml
# devtools 활성화
tauri = { version = "2", features = ["tray-icon", "devtools"] }
```

### 11.4 성능 목표

| 항목 | 목표 | 현재 |
|------|------|------|
| UI 초기화 | < 10ms | ~1ms |
| Tauri 초기화 | < 100ms | ~32ms |
| 전체 로딩 | < 100ms | ~35ms |

---

## 12. 배포 체크리스트

- [ ] 버전 번호 업데이트 (package.json, Cargo.toml, tauri.conf.json)
- [ ] 아이콘 확인
- [ ] 릴리스 빌드 테스트
- [ ] 설치/제거 테스트
- [ ] 다른 PC에서 테스트
- [ ] 바이러스 스캔 (오진 확인)

---

## 부록: 주요 파일 전체 경로

```
mdView/
├── docs\
│   ├── README.md              # 프로젝트 개요
│   ├── DEVELOPMENT_GUIDE.md   # 이 문서
│   ├── ARCHITECTURE.md        # 기술 아키텍처
│   ├── CHANGELOG.md           # 개발 이력
│   └── RUST_TUTORIAL.md       # Rust 교육자료
├── public\
│   └── logo.jpg               # Seven Peaks 로고
├── src\
│   ├── main.js                # 프론트엔드 로직
│   ├── style.css              # 스타일시트
│   └── i18n.js                # 다국어 번역 (한국어/영어)
├── src-tauri\
│   ├── src\
│   │   ├── main.rs            # Rust 진입점
│   │   └── lib.rs             # Rust 핵심 로직
│   ├── icons\                 # 앱 아이콘
│   ├── capabilities\
│   │   └── default.json       # 권한 설정
│   ├── Cargo.toml             # Rust 설정
│   └── tauri.conf.json        # Tauri 설정
├── index.html                 # 메인 HTML
├── package.json               # npm 설정
└── vite.config.js             # Vite 설정
```
