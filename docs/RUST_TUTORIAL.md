# Rust 초보자를 위한 Tauri 개발 가이드

## 목차
1. [Rust 기초 개념](#1-rust-기초-개념)
2. [Tauri 프로젝트 구조](#2-tauri-프로젝트-구조)
3. [Cargo.toml 이해하기](#3-cargotoml-이해하기)
4. [main.rs 분석](#4-mainrs-분석)
5. [lib.rs 분석](#5-librs-분석)
6. [Tauri 명령어 만들기](#6-tauri-명령어-만들기)
7. [프론트엔드와 통신하기](#7-프론트엔드와-통신하기)

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
│   └── lib.rs           # 핵심 로직
├── icons/               # 앱 아이콘
├── capabilities/        # 권한 설정
│   └── default.json
├── Cargo.toml           # Rust 의존성
└── tauri.conf.json      # Tauri 설정
```

### 2.2 파일별 역할

| 파일 | 역할 |
|------|------|
| `main.rs` | Windows 앱 진입점, 콘솔 창 숨김 |
| `lib.rs` | Tauri 앱 로직, 커맨드 정의 |
| `Cargo.toml` | Rust 패키지 설정 및 의존성 |
| `tauri.conf.json` | 앱 이름, 창 크기, 권한 등 설정 |
| `capabilities/default.json` | 보안 권한 정의 |

---

## 3. Cargo.toml 이해하기

```toml
[package]
name = "md-viewer"           # 패키지 이름
version = "1.0.0"            # 버전
edition = "2021"             # Rust 에디션 (2015, 2018, 2021)

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
# Tauri 코어 라이브러리
tauri = { version = "2", features = [] }

# Tauri 플러그인들
tauri-plugin-dialog = "2"    # 파일 열기 다이얼로그
tauri-plugin-fs = "2"        # 파일 시스템 접근

# 직렬화 라이브러리
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[profile.release]
strip = true                 # 바이너리에서 심볼 제거 (크기 감소)
lto = true                   # Link Time Optimization (성능 향상)
codegen-units = 1            # 단일 코드 생성 유닛 (최적화)
panic = "abort"              # 패닉 시 즉시 종료 (크기 감소)
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
```

---

## 4. main.rs 분석

```rust
// 조건부 컴파일: Windows에서만 적용
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"  // 콘솔 창 숨김
)]

fn main() {
    // lib.rs의 run() 함수 호출
    md_viewer_lib::run()
}
```

### 4.1 조건부 컴파일 설명

```rust
#![cfg_attr(조건, 속성)]
```

- `#!`: 크레이트 전체에 적용
- `cfg_attr`: 조건이 참이면 속성 적용
- `not(debug_assertions)`: 릴리스 빌드일 때
- `target_os = "windows"`: Windows OS일 때
- `windows_subsystem = "windows"`: GUI 앱으로 실행 (콘솔 숨김)

### 4.2 왜 main.rs와 lib.rs를 분리하나요?

1. **테스트 용이성**: lib.rs의 함수들을 독립적으로 테스트 가능
2. **재사용성**: 라이브러리로 다른 프로젝트에서 사용 가능
3. **Tauri 권장 구조**: Tauri 2.x의 표준 패턴

---

## 5. lib.rs 분석

```rust
use tauri::Manager;  // Tauri 앱 관리 기능
use std::env;        // 환경 변수, CLI 인자

// ========================================
// Tauri 커맨드 정의
// ========================================

// #[tauri::command]: 이 함수를 프론트엔드에서 호출 가능하게 함
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    // std::fs::read_to_string: 파일을 문자열로 읽기
    std::fs::read_to_string(&path)
        // map_err: 에러 타입 변환
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_cli_args() -> Vec<String> {
    // env::args(): 커맨드라인 인자 반환
    // skip(1): 첫 번째 인자(프로그램 경로) 건너뛰기
    // filter: .md, .markdown, .txt 파일만 필터링
    env::args()
        .skip(1)
        .filter(|arg| {
            let lower = arg.to_lowercase();
            lower.ends_with(".md")
                || lower.ends_with(".markdown")
                || lower.ends_with(".txt")
        })
        .collect()  // Vec<String>으로 수집
}

// ========================================
// 앱 실행 함수
// ========================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 플러그인 등록
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())

        // 커맨드 등록 (프론트엔드에서 호출 가능)
        .invoke_handler(tauri::generate_handler![
            read_file,
            get_cli_args
        ])

        // 앱 설정 콜백
        .setup(|app| {
            // 메인 윈도우 가져오기
            let window = app.get_webview_window("main").unwrap();
            // 윈도우 표시
            window.show().unwrap();
            Ok(())
        })

        // 앱 실행
        .run(tauri::generate_context!())

        // 에러 처리
        .expect("Tauri 앱 실행 실패");
}
```

### 5.1 매크로 설명

| 매크로 | 설명 |
|--------|------|
| `#[tauri::command]` | 함수를 Tauri 커맨드로 등록 |
| `tauri::generate_handler![]` | 커맨드 핸들러 생성 |
| `tauri::generate_context!()` | tauri.conf.json 설정 로드 |

### 5.2 Result 반환

```rust
// 성공/실패를 명시적으로 처리
fn read_file(path: String) -> Result<String, String> {
    // Ok(내용) 또는 Err(에러메시지) 반환
    std::fs::read_to_string(&path)
        .map_err(|e| e.to_string())
}
```

프론트엔드에서:
```javascript
// 성공 시 content에 파일 내용
// 실패 시 예외 발생
const content = await invoke('read_file', { path: '/path/to/file.md' });
```

---

## 6. Tauri 커맨드 만들기

### 6.1 기본 커맨드

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

// Result 반환 커맨드
#[tauri::command]
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("Cannot divide by zero"))
    } else {
        Ok(a / b)
    }
}
```

### 6.2 비동기 커맨드

```rust
// async 키워드로 비동기 함수 정의
#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    // 비동기 작업 수행
    // reqwest 등의 라이브러리 사용
    Ok(String::from("data"))
}
```

### 6.3 커맨드 등록

```rust
.invoke_handler(tauri::generate_handler![
    greet,
    greet_name,
    divide,
    fetch_data
])
```

---

## 7. 프론트엔드와 통신하기

### 7.1 JavaScript에서 Rust 호출

```javascript
import { invoke } from '@tauri-apps/api/core';

// 기본 호출
const greeting = await invoke('greet');
console.log(greeting);  // "Hello!"

// 매개변수 전달
const personalGreeting = await invoke('greet_name', {
    name: 'World'
});
console.log(personalGreeting);  // "Hello, World!"

// 에러 처리
try {
    const result = await invoke('divide', { a: 10, b: 0 });
} catch (error) {
    console.error('Error:', error);  // "Cannot divide by zero"
}
```

### 7.2 매개변수 이름 규칙

Rust에서 `snake_case` → JavaScript에서 `camelCase`

```rust
#[tauri::command]
fn read_file(file_path: String) -> String { ... }
```

```javascript
// JavaScript에서는 camelCase로 전달
await invoke('read_file', { filePath: '/path/to/file' });
// 또는 snake_case 그대로도 가능
await invoke('read_file', { file_path: '/path/to/file' });
```

### 7.3 복잡한 데이터 전달

```rust
use serde::{Serialize, Deserialize};

// 구조체 정의 (직렬화/역직렬화 가능)
#[derive(Serialize, Deserialize)]
struct User {
    name: String,
    age: u32,
}

#[tauri::command]
fn get_user() -> User {
    User {
        name: String::from("Alice"),
        age: 30,
    }
}

#[tauri::command]
fn save_user(user: User) -> Result<(), String> {
    println!("Saving user: {} ({})", user.name, user.age);
    Ok(())
}
```

```javascript
// 객체 받기
const user = await invoke('get_user');
console.log(user);  // { name: "Alice", age: 30 }

// 객체 전달
await invoke('save_user', {
    user: { name: "Bob", age: 25 }
});
```

---

## 추가 학습 자료

### 공식 문서
- [Rust 공식 문서](https://doc.rust-lang.org/book/)
- [Tauri 공식 문서](https://tauri.app/v2/start/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)

### 추천 학습 순서
1. Rust 기초 문법 (변수, 함수, 조건문)
2. 소유권과 참조 이해
3. Result와 Option 다루기
4. Tauri 프로젝트 생성 및 실행
5. 간단한 커맨드 만들기
6. 프론트엔드 연동

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
// 커맨드 정의는 했지만...
#[tauri::command]
fn my_command() -> String { ... }

// 등록을 안 하면 호출 불가!
.invoke_handler(tauri::generate_handler![
    // my_command 누락!
])
```

**해결**: `generate_handler!`에 모든 커맨드 등록

---

## 이 프로젝트에서 배울 수 있는 것

1. **Tauri 기본 구조**: 프로젝트 셋업부터 빌드까지
2. **Rust-JavaScript 통신**: invoke를 통한 데이터 교환
3. **파일 시스템 접근**: Tauri 플러그인 사용법
4. **에러 처리**: Result 타입 활용
5. **조건부 컴파일**: 플랫폼별 코드 분기
