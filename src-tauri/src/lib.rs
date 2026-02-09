// Library entry point for Tauri
// Using tauri-plugin-single-instance for proper single instance handling

use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{Emitter, Manager};
use tauri_plugin_window_state::StateFlags;

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

/// hex 문자열을 32바이트 키로 변환. 빈 문자열이면 내장키 사용.
fn resolve_key(key_hex: &str) -> Result<[u8; 32], String> {
    if key_hex.is_empty() {
        return Ok(*VMD_KEY);
    }
    let bytes = hex::decode(key_hex).map_err(|e| format!("키 hex 디코딩 실패: {}", e))?;
    if bytes.len() != 32 {
        return Err(format!("키는 32바이트여야 합니다. (현재 {}바이트)", bytes.len()));
    }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Ok(arr)
}

/// VMD 파일 암호화 저장 (v2 포맷: MAGIC + VERSION + KEY_NAME_LEN + KEY_NAME + NONCE + ENCRYPTED)
#[tauri::command]
fn write_vmd(path: String, json_content: String, key_hex: String, key_name: String) -> Result<(), String> {
    let key_bytes = resolve_key(&key_hex)?;
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let encrypted = cipher
        .encrypt(nonce, json_content.as_bytes())
        .map_err(|e| format!("암호화 실패: {}", e))?;

    let name_bytes = key_name.as_bytes();
    if name_bytes.len() > 255 {
        return Err("키 이름은 255바이트를 초과할 수 없습니다.".to_string());
    }

    // v2: MAGIC(4) + VERSION(1, 0x02) + KEY_NAME_LEN(1) + KEY_NAME(N) + NONCE(12) + ENCRYPTED
    let mut output = Vec::with_capacity(4 + 1 + 1 + name_bytes.len() + 12 + encrypted.len());
    output.extend_from_slice(VMD_MAGIC);
    output.push(0x02);
    output.push(name_bytes.len() as u8);
    output.extend_from_slice(name_bytes);
    output.extend_from_slice(&nonce_bytes);
    output.extend_from_slice(&encrypted);

    fs::write(&path, &output).map_err(|e| format!("VMD 파일 저장 실패: {}", e))
}

/// VMD 파일 복호화 읽기 (v1/v2 자동 감지)
#[tauri::command]
fn read_vmd(path: String, key_hex: String) -> Result<String, String> {
    let data = fs::read(&path).map_err(|e| format!("VMD 파일 읽기 실패: {}", e))?;

    if data.len() < 16 || &data[0..4] != VMD_MAGIC {
        return Err("유효한 VMD 파일이 아닙니다.".to_string());
    }

    // v2 감지: 5번째 바이트가 0x02
    if data[4] == 0x02 {
        if data.len() < 6 {
            return Err("VMD v2 헤더가 손상되었습니다.".to_string());
        }
        let name_len = data[5] as usize;
        let header_end = 6 + name_len;
        if data.len() < header_end + 12 {
            return Err("VMD v2 파일이 손상되었습니다.".to_string());
        }
        let key_name = String::from_utf8(data[6..header_end].to_vec())
            .map_err(|_| "키 이름 UTF-8 변환 실패".to_string())?;

        let key_bytes = resolve_key(&key_hex)?;
        let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        let nonce = Nonce::from_slice(&data[header_end..header_end + 12]);

        let decrypted = cipher
            .decrypt(nonce, &data[header_end + 12..])
            .map_err(|_| format!("복호화 실패. 키가 올바르지 않습니다. (키 이름: {})", key_name))?;

        String::from_utf8(decrypted).map_err(|e| format!("UTF-8 변환 실패: {}", e))
    } else {
        // v1: 내장키로 복호화
        let nonce = Nonce::from_slice(&data[4..16]);
        let key = aes_gcm::Key::<Aes256Gcm>::from_slice(VMD_KEY);
        let cipher = Aes256Gcm::new(key);

        let decrypted = cipher
            .decrypt(nonce, &data[16..])
            .map_err(|_| "VMD 파일 복호화 실패. 손상되었거나 다른 버전의 파일입니다.".to_string())?;

        String::from_utf8(decrypted).map_err(|e| format!("UTF-8 변환 실패: {}", e))
    }
}

/// VMD 파일 헤더 정보 읽기 (키 없이 version/keyName만 확인)
#[tauri::command]
fn read_vmd_info(path: String) -> Result<String, String> {
    let data = fs::read(&path).map_err(|e| format!("VMD 파일 읽기 실패: {}", e))?;

    if data.len() < 16 || &data[0..4] != VMD_MAGIC {
        return Err("유효한 VMD 파일이 아닙니다.".to_string());
    }

    if data[4] == 0x02 {
        if data.len() < 6 {
            return Err("VMD v2 헤더가 손상되었습니다.".to_string());
        }
        let name_len = data[5] as usize;
        if data.len() < 6 + name_len {
            return Err("VMD v2 파일이 손상되었습니다.".to_string());
        }
        let key_name = String::from_utf8(data[6..6 + name_len].to_vec())
            .map_err(|_| "키 이름 UTF-8 변환 실패".to_string())?;
        Ok(format!("{{\"version\":2,\"keyName\":\"{}\"}}", key_name))
    } else {
        Ok("{\"version\":1,\"keyName\":\"default\"}".to_string())
    }
}

/// 랜덤 32바이트 키 생성 (hex 문자열 반환)
#[tauri::command]
fn generate_random_key() -> String {
    let mut key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    hex::encode(key)
}

/// 윈도우 표시 (프론트엔드 준비 완료 후 호출)
#[tauri::command]
fn show_window(window: tauri::Window) {
    let _ = window.show();
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
        .plugin(tauri_plugin_window_state::Builder::default()
            .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
            .build())
        .invoke_handler(tauri::generate_handler![read_file, get_cli_args, write_file, write_vmd, read_vmd, read_vmd_info, generate_random_key, show_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
