# Rust 초보자를 위한 Tauri 개발 가이드

> Vexa MD 프로젝트 (v1.5.2) 기반 실전 Rust + Tauri 2.x 학습 가이드

## 목차
1. [Rust 기초 개념](#1-rust-기초-개념)
2. [Tauri 프로젝트 구조](#2-tauri-프로젝트-구조)
3. [Cargo.toml 이해하기](#3-cargotoml-이해하기)
4. [main.rs 분석](#4-mainrs-분석)
5. [lib.rs 분석](#5-librs-분석)
6. [Tauri 커맨드 만들기](#6-tauri-커맨드-만들기)
7. [프론트엔드와 통신하기](#7-프론트엔드와-통신하기)
8. [Tauri 플러그인 사용하기](#8-tauri-플러그인-사용하기)
9. [VMD 암호화 시스템](#9-vmd-암호화-시스템)

---

## 1. Rust 기초 개념

### 1.1 Rust란?
Rust는 Mozilla가 개발한 시스템 프로그래밍 언어입니다.

**특징:**
- **메모리 안전성**: 컴파일 시점에 메모리 오류 방지
- **제로 비용 추상화**: 고수준 기능을 성능 저하 없이 사용
- **스레드 안전성**: 데이터 레이스 방지
- **C/C++ 수준의 성능**

### 1.2 기본 문법

```rust
// 변수 선언 (기본적으로 불변)
let x = 5;

// 가변 변수 (mut 키워드 필요)
let mut y = 10;
y = 20;  // OK

// 타입 명시
let name: String = String::from("Hello");
let count: i32 = 42;

// 함수 정의
fn add(a: i32, b: i32) -> i32 {
    a + b  // return 키워드 없이 마지막 표현식이 반환값
}

// if 표현식
let result = if x > 0 { "positive" } else { "negative" };
```

### 1.3 소유권 (Ownership)

Rust의 가장 중요한 개념입니다.

```rust
// 소유권 이동 (Move)
let s1 = String::from("hello");
let s2 = s1;  // s1의 소유권이 s2로 이동
// println!("{}", s1);  // 오류! s1은 더 이상 유효하지 않음

// 복제 (Clone)
let s1 = String::from("hello");
let s2 = s1.clone();  // 깊은 복사
println!("{} {}", s1, s2);  // OK

// 참조 (Borrowing)
let s1 = String::from("hello");
let len = calculate_length(&s1);  // 참조를 빌려줌
println!("{} has {} chars", s1, len);  // s1 여전히 유효

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

### 1.4 Result와 Option

Rust는 null이 없습니다. 대신 `Option`과 `Result`를 사용합니다.

```rust
// Option: 값이 있거나 없을 수 있음
let some_number: Option<i32> = Some(5);
let no_number: Option<i32> = None;

// 값 추출
match some_number {
    Some(n) => println!("숫자: {}", n),
    None => println!("값 없음"),
}

// Result: 성공 또는 실패
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("0으로 나눌 수 없음"))
    } else {
        Ok(a / b)
    }
}

// ? 연산자: 에러 전파
fn safe_divide(a: i32, b: i32) -> Result<i32, String> {
    let result = divide(a, b)?;  // 에러면 바로 반환
    Ok(result * 2)
}
```

---

## 2. Tauri 프로젝트 구조

### 2.1 디렉토리 구조

```
src-tauri/
├── src/
│   ├── main.rs          # Windows 진입점
│   └── lib.rs           # 핵심 로직 (커맨드, VMD 암호화, 윈도우 관리)
├── icons/               # 앱 아이콘
├── capabilities/        # 권한 설정
│   └── default.json
├── Cargo.toml           # Rust 의존성
├── build.rs             # 빌드 스크립트
└── tauri.conf.json      # Tauri 설정 (앱 이름, 윈도우, 번들, 업데이터)
```

### 2.2 파일별 역할

| 파일 | 역할 |
|------|------|
| `main.rs` | Windows 앱 진입점, 콘솔 창 숨김 |
| `lib.rs` | Tauri 앱 로직: 8개 커맨드, VMD 암호화, 윈도우 관리, 싱글 인스턴스 |
| `Cargo.toml` | Rust 패키지 설정, 의존성, 빌드 최적화 |
| `tauri.conf.json` | 앱 이름, 창 크기, 번들 설정, 업데이터 엔드포인트 |
| `capabilities/default.json` | 보안 권한 정의 (파일, 쉘, 다이얼로그 등) |

---

## 3. Cargo.toml 이해하기

```toml
[package]
name = "vexa-md"              # 패키지 이름
version = "1.5.2"             # 버전
description = "Ultra-lightweight Markdown Viewer - Vexa MD"
edition = "2021"              # Rust 에디션 (2015, 2018, 2021)

[lib]
name = "vexa_md_lib"          # 라이브러리 이름 (main.rs에서 호출 시 사용)
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
# Tauri 코어 라이브러리
tauri = { version = "2", features = ["tray-icon", "devtools"] }

# Tauri 플러그인들
tauri-plugin-dialog = "2"              # 파일 열기/저장 다이얼로그
tauri-plugin-fs = { version = "2", features = ["watch"] }  # 파일 시스템 (감시 포함)
tauri-plugin-shell = "2"               # 외부 링크 브라우저 열기
tauri-plugin-single-instance = "2"     # 싱글 인스턴스 (중복 실행 방지)
tauri-plugin-window-state = "2"        # 윈도우 위치/크기 기억
tauri-plugin-updater = "2"             # 자동 업데이트
tauri-plugin-process = "2"             # 프로세스 관리 (재시작)

# 직렬화 라이브러리
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# VMD 암호화 관련
aes-gcm = "0.10"                       # AES-256-GCM 암호화
rand = "0.8"                           # 랜덤 키/논스 생성
hex = "0.4"                            # hex 인코딩/디코딩

[profile.release]
panic = "abort"              # 패닉 시 즉시 종료 (크기 감소)
codegen-units = 1            # 단일 코드 생성 유닛 (최적화)
lto = true                   # Link Time Optimization (성능 향상)
opt-level = "z"              # 크기 최적화 (s=속도, z=크기)
strip = true                 # 바이너리에서 심볼 제거 (크기 감소)
```

### 3.1 의존성 추가 방법

```bash
# 터미널에서 추가
cargo add serde --features derive

# 또는 Cargo.toml에 직접 추가
[dependencies]
serde = { version = "1", features = ["derive"] }
```

### 3.2 features란?

라이브러리의 선택적 기능을 활성화합니다.

```toml
# derive 기능 활성화: #[derive(Serialize)] 매크로 사용 가능
serde = { version = "1", features = ["derive"] }

# watch 기능 활성화: 파일 시스템 변경 감지
tauri-plugin-fs = { version = "2", features = ["watch"] }

# devtools 기능 활성화: F12 개발자 도구 사용 가능
tauri = { version = "2", features = ["tray-icon", "devtools"] }
```

---

## 4. main.rs 분석

```rust
// 조건부 컴파일: 릴리스 빌드 + Windows에서 콘솔 창 숨김
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // lib.rs의 run() 함수 호출
    vexa_md_lib::run();
}
```

### 4.1 조건부 컴파일 설명

```rust
#![cfg_attr(조건, 속성)]
```

- `#!`: 크레이트 전체에 적용
- `cfg_attr`: 조건이 참이면 속성 적용
- `not(debug_assertions)`: 릴리스 빌드일 때
- `windows_subsystem = "windows"`: GUI 앱으로 실행 (콘솔 숨김)

> **참고**: 이전 버전에서는 `all(not(debug_assertions), target_os = "windows")` 형태로 Windows 조건도 포함했지만, 현재는 간소화되었습니다. `windows_subsystem` 속성 자체가 Windows에서만 의미가 있으므로 `target_os` 조건은 생략 가능합니다.

### 4.2 왜 main.rs와 lib.rs를 분리하나요?

1. **테스트 용이성**: lib.rs의 함수들을 독립적으로 테스트 가능
2. **재사용성**: 라이브러리로 다른 프로젝트에서 사용 가능
3. **Tauri 권장 구조**: Tauri 2.x의 표준 패턴
4. **멀티 크레이트 타입**: `crate-type = ["staticlib", "cdylib", "rlib"]`로 다양한 빌드 타겟 지원

---

## 5. lib.rs 분석

Vexa MD의 `lib.rs`는 크게 4가지 영역으로 구성됩니다:

### 5.1 Import 및 상수

```rust
use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{Emitter, Manager};                   // Tauri 앱/윈도우 관리
use tauri_plugin_window_state::StateFlags;        // 윈도우 상태 플래그

// VMD 암호화 관련 import
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore;

// VMD 암호화 키 (앱 내장 - 32바이트)
const VMD_KEY: &[u8; 32] = b"VexaMD_2026_SecureKey_AES256!!!!";
// VMD 파일 매직 헤더
const VMD_MAGIC: &[u8; 4] = b"VXMD";
```

### 5.2 Tauri 커맨드 (8개)

| 커맨드 | 역할 | 반환 타입 |
|--------|------|-----------|
| `read_file` | 마크다운/텍스트 파일 읽기 (확장자 검증) | `Result<String, String>` |
| `write_file` | 파일 쓰기 (에디터 저장) | `Result<(), String>` |
| `get_cli_args` | CLI 인자에서 .md/.vmd 파일 경로 추출 | `Vec<String>` |
| `write_vmd` | VMD 암호화 저장 (AES-256-GCM, v2 포맷) | `Result<(), String>` |
| `read_vmd` | VMD 복호화 읽기 (v1/v2 자동 감지) | `Result<String, String>` |
| `read_vmd_info` | VMD 헤더 정보 읽기 (키 이름, 버전) | `Result<String, String>` |
| `generate_random_key` | 랜덤 32바이트 AES 키 생성 (hex 반환) | `String` |
| `show_window` | 프론트엔드 준비 완료 후 윈도우 표시 | `()` |

### 5.3 앱 설정 (`run()`)

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 1. 싱글 인스턴스 플러그인 (가장 먼저 등록)
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let file_paths = filter_md_files(&argv);
            if !file_paths.is_empty() {
                let _ = app.emit("open-files-from-instance", file_paths);
            }
            // 기존 창을 앞으로 가져오기
            let windows = app.webview_windows();
            if let Some((_, window)) = windows.iter().next() {
                if window.is_minimized().unwrap_or(false) {
                    let _ = window.unminimize();
                }
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        // 2. 기본 플러그인들
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        // 3. 윈도우 상태 (VISIBLE 상태 제외 - 깜빡임 방지)
        .plugin(tauri_plugin_window_state::Builder::default()
            .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
            .build())
        // 4. 자동 업데이트
        .plugin(tauri_plugin_updater::Builder::new().build())
        // 5. 프로세스 관리 (업데이트 후 재시작)
        .plugin(tauri_plugin_process::init())
        // 6. 커맨드 등록
        .invoke_handler(tauri::generate_handler![
            read_file, get_cli_args, write_file,
            write_vmd, read_vmd, read_vmd_info,
            generate_random_key, show_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 5.4 매크로 설명

| 매크로 | 설명 |
|--------|------|
| `#[tauri::command]` | 함수를 Tauri 커맨드로 등록 (프론트엔드에서 `invoke()` 호출 가능) |
| `tauri::generate_handler![]` | 등록된 커맨드들의 핸들러 생성 |
| `tauri::generate_context!()` | `tauri.conf.json` 설정 로드 |
| `#[cfg_attr(mobile, tauri::mobile_entry_point)]` | 모바일 빌드 시 진입점 설정 |

### 5.5 헬퍼 함수

```rust
/// hex 문자열을 32바이트 키로 변환. 빈 문자열이면 내장키 사용.
fn resolve_key(key_hex: &str) -> Result<[u8; 32], String> {
    if key_hex.is_empty() {
        return Ok(*VMD_KEY);
    }
    let bytes = hex::decode(key_hex)
        .map_err(|e| format!("키 hex 디코딩 실패: {}", e))?;
    if bytes.len() != 32 {
        return Err(format!("키는 32바이트여야 합니다. (현재 {}바이트)", bytes.len()));
    }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Ok(arr)
}

/// 마크다운 파일 경로 필터링 (싱글 인스턴스에서 사용)
fn filter_md_files(args: &[String]) -> Vec<String> {
    args.iter()
        .filter(|arg| {
            let lower = arg.to_lowercase();
            lower.ends_with(".md") || lower.ends_with(".markdown")
                || lower.ends_with(".txt") || lower.ends_with(".vmd")
        })
        .cloned()
        .collect()
}
```

---

## 6. Tauri 커맨드 만들기

### 6.1 기본 커맨드 패턴

```rust
// 매개변수 없는 커맨드
#[tauri::command]
fn greet() -> String {
    String::from("Hello!")
}

// 매개변수 있는 커맨드
#[tauri::command]
fn greet_name(name: String) -> String {
    format!("Hello, {}!", name)
}

// Result 반환 커맨드 (에러 처리)
#[tauri::command]
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("Cannot divide by zero"))
    } else {
        Ok(a / b)
    }
}
```

### 6.2 실제 프로젝트의 커맨드 예시

**파일 읽기 커맨드** (확장자 검증 포함):
```rust
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(&path);

    // 1. 파일 존재 확인
    if !path.exists() {
        return Err(format!("파일이 존재하지 않습니다: {}", path.display()));
    }

    // 2. 확장자 검증
    let ext = path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if !["md", "markdown", "txt"].contains(&ext.as_str()) {
        return Err("지원하지 않는 파일 형식입니다.".to_string());
    }

    // 3. 파일 읽기
    fs::read_to_string(&path)
        .map_err(|e| format!("파일 읽기 실패: {}", e))
}
```

**윈도우 관리 커맨드** (Tauri 윈도우 객체 주입):
```rust
#[tauri::command]
fn show_window(window: tauri::Window) {
    // 윈도우가 모니터 영역 밖에 있는지 확인
    if let Ok(pos) = window.outer_position() {
        let monitors = window.available_monitors().unwrap_or_default();
        let is_visible = monitors.iter().any(|m| {
            let mp = m.position();
            let ms = m.size();
            // 윈도우 좌상단이 모니터 영역 안에 있는지 확인
            let wx = pos.x as f64;
            let wy = pos.y as f64;
            wx >= mp.x as f64 - 50.0 && wx < mp.x as f64 + ms.width as f64
                && wy >= mp.y as f64 - 50.0 && wy < mp.y as f64 + ms.height as f64
        });

        if !is_visible {
            let _ = window.center();  // 화면 밖이면 중앙으로 이동
        }
    }
    let _ = window.show();
}
```

> **참고**: `tauri::Window` 매개변수는 Tauri가 자동으로 주입합니다. 프론트엔드에서 `invoke('show_window')`만 호출하면 됩니다.

### 6.3 비동기 커맨드

```rust
#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    // 비동기 작업 수행
    Ok(String::from("data"))
}
```

### 6.4 커맨드 등록

**모든 커맨드는 `generate_handler!`에 등록해야 호출 가능합니다:**

```rust
.invoke_handler(tauri::generate_handler![
    read_file, get_cli_args, write_file,
    write_vmd, read_vmd, read_vmd_info,
    generate_random_key, show_window
])
```

---

## 7. 프론트엔드와 통신하기

### 7.1 JavaScript에서 Rust 호출

```javascript
import { invoke } from '@tauri-apps/api/core';

// 기본 호출
const content = await invoke('read_file', { path: '/path/to/file.md' });

// 에러 처리
try {
    const result = await invoke('read_vmd', {
        path: '/path/to/file.vmd',
        keyHex: ''  // 빈 문자열이면 내장키 사용
    });
} catch (error) {
    console.error('VMD 읽기 실패:', error);
}
```

> **참고**: Vexa MD는 `withGlobalTauri: true` 설정을 사용하므로, `window.__TAURI__.core.invoke()`로도 호출 가능합니다.

### 7.2 매개변수 이름 규칙

Rust의 `snake_case` 매개변수는 JavaScript에서 `camelCase`로 변환됩니다:

```rust
#[tauri::command]
fn write_vmd(path: String, json_content: String, key_hex: String, key_name: String) -> Result<(), String> { ... }
```

```javascript
// JavaScript에서는 camelCase로 전달
await invoke('write_vmd', {
    path: '/path/to/file.vmd',
    jsonContent: '{"content":"# Hello"}',
    keyHex: 'a1b2c3...',
    keyName: 'my-key'
});
```

### 7.3 복잡한 데이터 전달

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct User {
    name: String,
    age: u32,
}

#[tauri::command]
fn get_user() -> User {
    User { name: String::from("Alice"), age: 30 }
}

#[tauri::command]
fn save_user(user: User) -> Result<(), String> {
    println!("Saving user: {} ({})", user.name, user.age);
    Ok(())
}
```

```javascript
const user = await invoke('get_user');
console.log(user);  // { name: "Alice", age: 30 }

await invoke('save_user', {
    user: { name: "Bob", age: 25 }
});
```

### 7.4 Rust에서 JavaScript로 이벤트 보내기

```rust
use tauri::Emitter;

// 싱글 인스턴스에서 파일 열기 이벤트 전송
let _ = app.emit("open-files-from-instance", file_paths);
```

```javascript
import { listen } from '@tauri-apps/api/event';

// 이벤트 수신
await listen('open-files-from-instance', (event) => {
    const filePaths = event.payload;
    // 파일 열기 처리
});
```

---

## 8. Tauri 플러그인 사용하기

### 8.1 Vexa MD에서 사용하는 플러그인 (7개)

| 플러그인 | 역할 | Cargo.toml |
|----------|------|------------|
| `tauri-plugin-single-instance` | 앱 중복 실행 방지, 기존 인스턴스에 파일 전달 | `"2"` |
| `tauri-plugin-dialog` | 파일 열기/저장 다이얼로그 | `"2"` |
| `tauri-plugin-fs` | 파일 시스템 읽기/쓰기/감시 | `"2"` + `watch` |
| `tauri-plugin-shell` | 외부 링크를 기본 브라우저로 열기 | `"2"` |
| `tauri-plugin-window-state` | 윈도우 위치/크기/최대화 상태 기억 | `"2"` |
| `tauri-plugin-updater` | GitHub Releases 기반 자동 업데이트 | `"2"` |
| `tauri-plugin-process` | 앱 재시작 (업데이트 적용 시) | `"2"` |

### 8.2 플러그인 등록 순서

```rust
tauri::Builder::default()
    // 싱글 인스턴스는 가장 먼저 등록 (중복 실행 감지가 다른 플러그인보다 먼저 작동해야 함)
    .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| { /* ... */ }))
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    // window-state는 Builder 패턴으로 옵션 설정
    .plugin(tauri_plugin_window_state::Builder::default()
        .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
        .build())
    // updater도 Builder 패턴
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
```

### 8.3 권한 설정 (capabilities)

Tauri 2.x에서는 플러그인 사용 시 반드시 `capabilities/default.json`에 권한을 설정해야 합니다:

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
    "process:allow-restart",
    {
      "identifier": "fs:scope",
      "allow": [
        { "path": "**" },
        { "path": "$HOME/**" },
        { "path": "$DOCUMENT/**" },
        { "path": "$DOWNLOAD/**" },
        { "path": "$DESKTOP/**" }
      ]
    }
  ]
}
```

> **주의**: 권한이 없으면 프론트엔드에서 해당 플러그인 API 호출 시 에러가 발생합니다.

### 8.4 window-state 플러그인 주의사항

`tauri-plugin-window-state`는 기본적으로 `VISIBLE` 상태도 복원합니다. 이것이 문제가 되는 이유:

1. `tauri.conf.json`에서 `visible: false`로 설정해도 복원 시 덮어씀
2. 프론트엔드 준비 전에 윈도우가 표시되어 깜빡임 발생

**해결책:**
```rust
// VISIBLE 상태만 복원에서 제외
.plugin(tauri_plugin_window_state::Builder::default()
    .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
    .build())
```

추가 안전장치로 CSS에서 `opacity: 0`으로 시작하고, 프론트엔드 준비 완료 후 `opacity: 1`로 전환합니다.

---

## 9. VMD 암호화 시스템

Vexa MD의 독자 포맷인 `.vmd` (Vexa Markdown Document)는 AES-256-GCM으로 암호화된 읽기전용 마크다운 파일입니다.

### 9.1 파일 포맷 구조

**v2 포맷** (현재):
```
MAGIC(4바이트) + VERSION(1, 0x02) + KEY_NAME_LEN(1) + KEY_NAME(N) + NONCE(12) + ENCRYPTED_DATA
```

**v1 포맷** (하위 호환):
```
MAGIC(4바이트) + NONCE(12) + ENCRYPTED_DATA
```

### 9.2 암호화 흐름

```rust
#[tauri::command]
fn write_vmd(path: String, json_content: String, key_hex: String, key_name: String) -> Result<(), String> {
    // 1. 키 해석 (빈 문자열이면 내장키)
    let key_bytes = resolve_key(&key_hex)?;

    // 2. AES-256-GCM 암호화 객체 생성
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // 3. 랜덤 12바이트 논스 생성 (매번 다른 값)
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // 4. 암호화
    let encrypted = cipher.encrypt(nonce, json_content.as_bytes())
        .map_err(|e| format!("암호화 실패: {}", e))?;

    // 5. v2 포맷으로 조립하여 저장
    let mut output = Vec::new();
    output.extend_from_slice(VMD_MAGIC);      // "VXMD"
    output.push(0x02);                         // 버전 2
    output.push(key_name.len() as u8);         // 키 이름 길이
    output.extend_from_slice(key_name.as_bytes()); // 키 이름
    output.extend_from_slice(&nonce_bytes);     // 논스
    output.extend_from_slice(&encrypted);       // 암호화된 데이터

    fs::write(&path, &output).map_err(|e| format!("저장 실패: {}", e))
}
```

### 9.3 복호화 흐름 (v1/v2 자동 감지)

```rust
#[tauri::command]
fn read_vmd(path: String, key_hex: String) -> Result<String, String> {
    let data = fs::read(&path)?;

    // 매직 헤더 확인
    if &data[0..4] != VMD_MAGIC {
        return Err("유효한 VMD 파일이 아닙니다.".to_string());
    }

    if data[4] == 0x02 {
        // v2: 키 이름 → 논스 → 암호화 데이터
        let name_len = data[5] as usize;
        let header_end = 6 + name_len;
        // ... 복호화
    } else {
        // v1: 내장키로 복호화
        // ... 복호화
    }
}
```

### 9.4 핵심 개념 설명

- **AES-256-GCM**: 인증된 암호화 방식. 데이터 기밀성 + 무결성 동시 보장
- **Nonce (Number used once)**: 매번 다른 12바이트 랜덤 값. 같은 키로 같은 데이터를 암호화해도 결과가 다름
- **매직 헤더**: 파일이 VMD 형식인지 빠르게 확인하는 4바이트 시그니처 (`VXMD`)

---

## 추가 학습 자료

### 공식 문서
- [Rust 공식 문서](https://doc.rust-lang.org/book/)
- [Tauri 2.x 공식 문서](https://v2.tauri.app/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)

### 추천 학습 순서
1. Rust 기초 문법 (변수, 함수, 조건문)
2. 소유권과 참조 이해
3. Result와 Option 다루기
4. Tauri 프로젝트 생성 및 실행
5. 간단한 커맨드 만들기
6. 프론트엔드 연동
7. 플러그인 활용
8. 암호화 등 고급 기능

---

## 자주 하는 실수

### 1. 소유권 이동 후 사용

```rust
let s = String::from("hello");
let s2 = s;
println!("{}", s);  // 오류! s는 이미 이동됨
```

**해결**: `clone()` 사용 또는 참조(`&`) 사용

### 2. 가변 참조 중복

```rust
let mut s = String::from("hello");
let r1 = &mut s;
let r2 = &mut s;  // 오류! 동시에 여러 가변 참조 불가
```

**해결**: 가변 참조는 하나만 사용

### 3. 커맨드 등록 누락

```rust
#[tauri::command]
fn my_command() -> String { ... }

// 등록을 안 하면 프론트엔드에서 호출 불가!
.invoke_handler(tauri::generate_handler![
    // my_command 누락!
])
```

**해결**: `generate_handler!`에 모든 커맨드 등록

### 4. 권한 설정 누락

```json
// capabilities/default.json에 권한이 없으면 플러그인 API 호출 시 에러
{
  "permissions": [
    // "shell:allow-open" 누락 → shell.open() 호출 실패!
  ]
}
```

**해결**: 사용하는 플러그인의 권한을 모두 `capabilities/default.json`에 등록

### 5. window-state VISIBLE 충돌

```rust
// 이렇게 하면 visible: false 설정이 무시됨
.plugin(tauri_plugin_window_state::Builder::default().build())
```

**해결**: VISIBLE 상태를 복원에서 제외
```rust
.plugin(tauri_plugin_window_state::Builder::default()
    .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
    .build())
```

---

## 이 프로젝트에서 배울 수 있는 것

1. **Tauri 2.x 기본 구조**: 프로젝트 셋업부터 빌드까지
2. **Rust-JavaScript 통신**: `invoke()`를 통한 양방향 데이터 교환
3. **이벤트 시스템**: Rust → JS 이벤트 (`emit`)
4. **파일 시스템 접근**: Tauri 플러그인 사용법
5. **에러 처리**: `Result` 타입 활용
6. **조건부 컴파일**: 플랫폼별 코드 분기
7. **암호화**: AES-256-GCM 구현
8. **플러그인 시스템**: 7개 Tauri 플러그인 조합
9. **싱글 인스턴스**: 앱 중복 실행 방지 패턴
10. **빌드 최적화**: LTO, 크기 최적화, 심볼 제거

---

## 문서 히스토리

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-14 | 전면 재작성: Vexa MD v1.5.2 반영, 8개 커맨드, 7개 플러그인, VMD 암호화 섹션, 이벤트 시스템 추가 |
| 2025-12-26 | 초기 문서 작성 (v1.0.0 기준) |

*마지막 업데이트: 2026-02-14*
