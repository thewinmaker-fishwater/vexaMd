// Library entry point for Tauri
// Using tauri-plugin-single-instance for proper single instance handling

use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{Emitter, Manager};

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore;

/// 파일 읽기 커맨드
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(&path);

    if !path.exists() {
        return Err(format!("파일이 존재하지 않습니다: {}", path.display()));
    }

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if !["md", "markdown", "txt"].contains(&ext.as_str()) {
        return Err("지원하지 않는 파일 형식입니다. (.md, .markdown, .txt만 지원)".to_string());
    }

    fs::read_to_string(&path).map_err(|e| format!("파일 읽기 실패: {}", e))
}

/// CLI 인자 가져오기
#[tauri::command]
fn get_cli_args() -> Vec<String> {
    let args: Vec<String> = env::args().skip(1).collect();

    args.into_iter()
        .filter(|arg| {
            let lower = arg.to_lowercase();
            lower.ends_with(".md") || lower.ends_with(".markdown") || lower.ends_with(".txt") || lower.ends_with(".vmd")
        })
        .collect()
}

/// 파일 쓰기 커맨드
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| {
        let err_msg = format!("파일 저장 실패 ({}): {}", path, e);
        eprintln!("{}", err_msg);
        err_msg
    })
}

// VMD 암호화 키 (앱 내장 - 32바이트)
const VMD_KEY: &[u8; 32] = b"VexaMD_2026_SecureKey_AES256!!!!";
// VMD 파일 매직 헤더
const VMD_MAGIC: &[u8; 4] = b"VXMD";

/// VMD 파일 암호화 저장
#[tauri::command]
fn write_vmd(path: String, json_content: String) -> Result<(), String> {
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(VMD_KEY);
    let cipher = Aes256Gcm::new(key);

    // 랜덤 nonce (12바이트)
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let encrypted = cipher
        .encrypt(nonce, json_content.as_bytes())
        .map_err(|e| format!("암호화 실패: {}", e))?;

    // 파일 구조: MAGIC(4) + NONCE(12) + ENCRYPTED_DATA
    let mut output = Vec::with_capacity(4 + 12 + encrypted.len());
    output.extend_from_slice(VMD_MAGIC);
    output.extend_from_slice(&nonce_bytes);
    output.extend_from_slice(&encrypted);

    fs::write(&path, &output).map_err(|e| format!("VMD 파일 저장 실패: {}", e))
}

/// VMD 파일 복호화 읽기
#[tauri::command]
fn read_vmd(path: String) -> Result<String, String> {
    let data = fs::read(&path).map_err(|e| format!("VMD 파일 읽기 실패: {}", e))?;

    if data.len() < 16 || &data[0..4] != VMD_MAGIC {
        return Err("유효한 VMD 파일이 아닙니다.".to_string());
    }

    let nonce = Nonce::from_slice(&data[4..16]);
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(VMD_KEY);
    let cipher = Aes256Gcm::new(key);

    let decrypted = cipher
        .decrypt(nonce, &data[16..])
        .map_err(|_| "VMD 파일 복호화 실패. 손상되었거나 다른 버전의 파일입니다.".to_string())?;

    String::from_utf8(decrypted).map_err(|e| format!("UTF-8 변환 실패: {}", e))
}

/// 마크다운 파일 경로 필터링
fn filter_md_files(args: &[String]) -> Vec<String> {
    args.iter()
        .filter(|arg| {
            let lower = arg.to_lowercase();
            lower.ends_with(".md") || lower.ends_with(".markdown") || lower.ends_with(".txt") || lower.ends_with(".vmd")
        })
        .cloned()
        .collect()
}

/// 윈도우 상태 파일 경로
fn window_state_path() -> Option<PathBuf> {
    dirs::config_dir().map(|p| p.join("com.vexa-md").join("window-state.json"))
}

/// 윈도우 상태 저장 (Window용 - on_window_event에서 사용)
fn save_window_state(window: &tauri::Window) {
    if let Some(path) = window_state_path() {
        let is_maximized = window.is_maximized().unwrap_or(false);
        let state = if is_maximized {
            serde_json::json!({ "maximized": true })
        } else {
            let position = window.outer_position().ok();
            let size = window.outer_size().ok();
            serde_json::json!({
                "maximized": false,
                "x": position.as_ref().map(|p| p.x),
                "y": position.as_ref().map(|p| p.y),
                "width": size.as_ref().map(|s| s.width),
                "height": size.as_ref().map(|s| s.height)
            })
        };
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::write(&path, state.to_string());
    }
}

/// 윈도우 상태 복원 (WebviewWindow용 - setup에서 사용)
fn restore_window_state(window: &tauri::WebviewWindow) {
    if let Some(path) = window_state_path() {
        if let Ok(data) = fs::read_to_string(&path) {
            if let Ok(state) = serde_json::from_str::<serde_json::Value>(&data) {
                let maximized = state.get("maximized").and_then(|v| v.as_bool()).unwrap_or(false);
                if maximized {
                    let _ = window.maximize();
                } else {
                    if let (Some(x), Some(y)) = (
                        state.get("x").and_then(|v| v.as_i64()),
                        state.get("y").and_then(|v| v.as_i64()),
                    ) {
                        let _ = window.set_position(tauri::Position::Physical(
                            tauri::PhysicalPosition::new(x as i32, y as i32),
                        ));
                    }
                    if let (Some(w), Some(h)) = (
                        state.get("width").and_then(|v| v.as_u64()),
                        state.get("height").and_then(|v| v.as_u64()),
                    ) {
                        let _ = window.set_size(tauri::Size::Physical(
                            tauri::PhysicalSize::new(w as u32, h as u32),
                        ));
                    }
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // single-instance 플러그인 - 가장 먼저 등록해야 함
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // 마크다운 파일 경로 필터링
            let file_paths = filter_md_files(&argv);

            // 모든 webview 창 가져오기
            let windows = app.webview_windows();

            if !file_paths.is_empty() {
                // 프론트엔드에 파일 열기 이벤트 전송
                let _ = app.emit("open-files-from-instance", file_paths);
            }

            // 창을 앞으로 가져오기 - 동적으로 첫 번째 창 찾기
            // 주의: get_webview_window("main") 대신 iter().next() 사용
            // Tauri 2.0에서 기본 창 label이 "main"이 아닐 수 있음
            if let Some((_, window)) = windows.iter().next() {
                if window.is_minimized().unwrap_or(false) {
                    let _ = window.unminimize();
                }
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            // 윈도우 상태 복원 (깜빡임 최소화: 숨기기 → 복원 → 표시)
            if let Some((_, window)) = app.webview_windows().iter().next() {
                let _ = window.hide();
                restore_window_state(window);
                let _ = window.show();
            }

            // CLI 인자 처리는 JS 측에서 get_cli_args로 직접 처리

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                save_window_state(window);
            }
        })
        .invoke_handler(tauri::generate_handler![read_file, get_cli_args, write_file, write_vmd, read_vmd])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
