// Library entry point for Tauri

use std::env;
use std::fs;
use std::path::PathBuf;

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
            lower.ends_with(".md") || lower.ends_with(".markdown") || lower.ends_with(".txt")
        })
        .collect()
}

/// 파일 쓰기 커맨드
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    println!("write_file called: path={}, content_len={}", path, content.len());
    fs::write(&path, &content).map_err(|e| {
        let err_msg = format!("파일 저장 실패 ({}): {}", path, e);
        eprintln!("{}", err_msg);
        err_msg
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_file, get_cli_args, write_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
