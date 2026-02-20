# Vexa MD 개발 가이드

## 완전한 개발 과정: 설계부터 배포까지

---

## 1. 프로젝트 설계

### 1.1 요구사항 분석

| 구분 | 요구사항 |
|------|----------|
| 성능 | 1초 미만 렌더링 |
| 크기 | 초경량 설치 파일 |
| 기능 | 마크다운 뷰어 + 편집기 + 플러그인 |
| 플랫폼 | Windows, macOS, Linux |
| UI | 다크/라이트 테마, 6종 컬러, 커스텀 테마 |

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
│  ┌─────────────┐  ┌────────────┐  ┌───────┐ │
│  │  파일 I/O   │  │ AES-256암호화│  │ 업데이터│ │
│  └─────────────┘  └────────────┘  └───────┘ │
├─────────────────────────────────────────────┤
│        OS (WebView2 / WebKit / WebKitGTK)    │
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

# 설치 확인
rustc --version
cargo --version
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

### 2.2 프로젝트 클론

```bash
git clone https://github.com/thewinmaker-fishwater/vexaMd.git
cd vexaMd
npm install
```

---

## 3. 프로젝트 구조

### 3.1 package.json

```json
{
  "name": "vexa-md",
  "version": "1.5.2",
  "dependencies": {
    "@tauri-apps/api": "^2.9.1",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-process": "^2.3.1",
    "@tauri-apps/plugin-shell": "^2.3.4",
    "@tauri-apps/plugin-updater": "^2.9.0",
    "highlight.js": "^11.11.1",
    "html2pdf.js": "^0.14.0",
    "marked": "^12.0.0",
    "mermaid": "^11.12.2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "vite": "^5.4.0"
  }
}
```

### 3.2 Vite 설정 (vite.config.js)

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: { strictPort: true },
  build: { sourcemap: false },
  envPrefix: ['VITE_', 'TAURI_'],
});
```

---

## 4. Rust 백엔드

### 4.1 Cargo.toml

`src-tauri/Cargo.toml`:
```toml
[package]
name = "vexa-md"
version = "1.5.2"
edition = "2021"

[lib]
name = "vexa_md_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[dependencies]
tauri = { version = "2", features = ["tray-icon", "devtools"] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = { version = "2", features = ["watch"] }
tauri-plugin-shell = "2"
tauri-plugin-single-instance = "2"
tauri-plugin-window-state = "2"
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
aes-gcm = "0.10"
rand = "0.8"
hex = "0.4"

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "z"
strip = true
```

### 4.2 main.rs

`src-tauri/src/main.rs`:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    vexa_md_lib::run();
}
```

### 4.3 lib.rs 주요 커맨드

`src-tauri/src/lib.rs`:

| 커맨드 | 역할 |
|--------|------|
| `read_file` | 마크다운/텍스트 파일 읽기 (확장자 검증) |
| `write_file` | 파일 쓰기 (에디터 저장) |
| `get_cli_args` | CLI 인자에서 .md/.vmd 파일 경로 추출 |
| `write_vmd` | VMD 암호화 저장 (AES-256-GCM, v2 포맷) |
| `read_vmd` | VMD 복호화 읽기 (v1/v2 자동 감지) |
| `read_vmd_info` | VMD 헤더 정보 읽기 (키 이름, 버전) |
| `generate_random_key` | 랜덤 32바이트 AES 키 생성 |
| `show_window` | 프론트엔드 준비 완료 후 윈도우 표시 |

### 4.4 앱 설정 (`run()`)

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| { /* ... */ }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default()
            .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
            .build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            read_file, get_cli_args, write_file,
            write_vmd, read_vmd, read_vmd_info,
            generate_random_key, show_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4.5 권한 설정

`src-tauri/capabilities/default.json`:
```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default", "dialog:allow-open", "dialog:allow-save",
    "fs:default", "fs:allow-read", "fs:allow-watch", "fs:allow-unwatch",
    "fs:write-all",
    "shell:default", "shell:allow-open",
    "updater:default",
    "process:allow-restart"
  ]
}
```

### 4.6 Tauri 설정

`src-tauri/tauri.conf.json`:
```json
{
  "productName": "Vexa MD",
  "version": "1.5.2",
  "identifier": "com.vexamd.viewer",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5180",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [{
      "title": "Vexa MD",
      "width": 1000, "height": 700,
      "minWidth": 400, "minHeight": 300,
      "visible": false,
      "dragDropEnabled": true
    }]
  },
  "bundle": {
    "createUpdaterArtifacts": true,
    "targets": "all",
    "fileAssociations": [{
      "ext": ["md", "markdown"],
      "mimeType": "text/markdown",
      "description": "Markdown Document"
    }]
  },
  "plugins": {
    "updater": {
      "pubkey": "...",
      "endpoints": ["https://github.com/.../releases/latest/download/latest.json"]
    }
  }
}
```

---

## 5. 프론트엔드 구조

### 5.1 모듈 시스템

프론트엔드는 `main.js` 오케스트레이터가 20개 모듈을 조립하는 구조입니다.

```javascript
// main.js (~341줄) - 모듈 import 및 초기화
import * as tabs from './modules/tabs/tab-manager.js';
import * as renderer from './modules/markdown/renderer.js';
import * as fileOps from './modules/files/file-ops.js';
// ... 16개 더

async function init() {
  // 모듈 초기화 (context 전달)
  tabs.init({ renderMarkdown: renderer.renderMarkdown, /* ... */ });
  fileOps.init({ loadFile: tabs.loadFileInTab, /* ... */ });
  // ...
}
```

### 5.2 CSS 모듈 구조

CSS는 15개 모듈로 분리되어 `src/styles/index.css`에서 순서대로 import합니다:

```
theme.css → base.css → ui.css → tabs.css → files.css →
search.css → viewer.css → syntax.css → toc.css → editor.css →
plugin-ui.css → vmd-key-ui.css → status-bar.css → animations.css → updater.css
```

각 모듈별 CSS는 해당 모듈 디렉토리에 위치합니다 (예: `modules/tabs/tabs.css`).

---

## 6. 빌드 및 실행

### 6.1 개발 모드
```bash
npm run tauri dev
```

**개발 모드 특징:**
- Hot Reload: 코드 수정 시 자동 새로고침
- DevTools: F12로 개발자 도구 열기
- 빠른 빌드: 최적화 없이 빠르게 컴파일

### 6.2 프로덕션 빌드
```bash
npm run tauri build
```

**빌드 결과물:**
```
src-tauri/target/release/
├── vexa-md.exe                              # 실행 파일
└── bundle/nsis/
    └── Vexa MD_1.5.2_x64-setup.exe          # 설치 파일
```

### 6.3 빌드 최적화 옵션

`Cargo.toml`의 `[profile.release]` 섹션:

| 옵션 | 설명 | 효과 |
|------|------|------|
| `strip = true` | 심볼 제거 | 파일 크기 30% 감소 |
| `lto = true` | Link Time Optimization | 성능 향상 |
| `codegen-units = 1` | 단일 컴파일 유닛 | 최적화 향상 |
| `opt-level = "z"` | 크기 최적화 | 바이너리 크기 감소 |
| `panic = "abort"` | 패닉 시 즉시 종료 | 파일 크기 감소 |

---

## 7. 실행 방법

### 7.1 설치 프로그램으로 설치
```
Vexa MD_x.x.x_x64-setup.exe 실행
→ 설치 마법사 따라 진행
→ 시작 메뉴에서 실행
```

### 7.2 직접 실행
```bash
./vexa-md.exe
./vexa-md.exe README.md
```

### 7.3 파일 연결 (더블클릭으로 열기)
1. `.md` 파일 우클릭
2. "연결 프로그램" → "다른 앱 선택"
3. `vexa-md.exe` 선택
4. "항상 이 앱으로 열기" 체크

---

## 8. 빌드 vs 설치 테스트

Tauri 앱을 테스트할 때 **빌드 후 직접 실행**과 **설치 후 실행**은 다른 결과를 낼 수 있습니다.

| 항목 | 빌드 후 직접 실행 | NSIS 설치 후 실행 |
|------|------------------|-------------------|
| 파일 연결 | 이전 설치 버전 유지 | 새 버전으로 업데이트 |
| 레지스트리 | 변경 없음 | 앱 정보 등록/업데이트 |
| 싱글 인스턴스 | 경로 불일치로 오작동 가능 | 정상 동작 |

**반드시 설치 후 테스트해야 하는 기능:**
1. 싱글 인스턴스 (파일 더블클릭)
2. 파일 연결 (.md)
3. 자동 업데이트

| 테스트 유형 | 권장 환경 | 명령어 |
|-------------|-----------|--------|
| UI/기능 개발 | 개발 모드 | `npm run tauri dev` |
| 성능 테스트 | 릴리스 빌드 | `npm run tauri build` |
| 시스템 통합 | **설치 후** | NSIS 인스톨러 실행 |

---

## 9. 릴리스

릴리스 절차는 [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) 참조.

---

## 10. 문제 해결

### Rust 관련 오류
```bash
# "cargo not found" 오류 → 새 터미널 열기 또는:
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path
```

### 포트 충돌
```bash
# "Port 5180 is already in use" 오류
taskkill /F /IM "node.exe"
```

### 빌드 오류
```bash
# 캐시 삭제 후 재빌드
cargo clean
npm run tauri build
```

---

## 11. 배포 체크리스트

- [ ] 버전 번호 업데이트 (package.json, Cargo.toml, tauri.conf.json)
- [ ] 릴리스 빌드 테스트 (`npm run tauri build`)
- [ ] 설치 후 테스트 (싱글 인스턴스, 파일 연결, 자동 업데이트)
- [ ] 커밋 + 태그 + 푸시
- [ ] CI 빌드 성공 확인
- [ ] 릴리스 퍼블리시 + latest.json 검증

---

## 문서 히스토리

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-20 | CSS 15개 모듈, 20개 UI 모듈로 업데이트 |
| 2026-02-14 | 전면 재작성: Vexa MD 통일, 현재 설정/구조/커맨드 반영, 릴리스 가이드 분리 |
| 2026-01-24 | 마크다운 편집 기능, CSS 모듈화 구조 추가 |
| 2025-12-26 | 초기 문서 작성 |

*마지막 업데이트: 2026-02-20*
