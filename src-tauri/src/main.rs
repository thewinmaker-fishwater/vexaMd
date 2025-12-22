// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::path::PathBuf;

/// 파일 읽기 커맨드
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(&path);

    // 파일 존재 확인
    if !path.exists() {
        return Err(format!("파일이 존재하지 않습니다: {}", path.display()));
    }

    // 파일 확장자 확인
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if !["md", "markdown", "txt"].contains(&ext.as_str()) {
        return Err("지원하지 않는 파일 형식입니다. (.md, .markdown, .txt만 지원)".to_string());
    }

    // 파일 읽기
    fs::read_to_string(&path).map_err(|e| format!("파일 읽기 실패: {}", e))
}

/// CLI 인자 가져오기
#[tauri::command]
fn get_cli_args() -> Vec<String> {
    let args: Vec<String> = env::args().skip(1).collect();

    // .md, .markdown, .txt 파일만 필터링
    args.into_iter()
        .filter(|arg| {
            let lower = arg.to_lowercase();
            lower.ends_with(".md") || lower.ends_with(".markdown") || lower.ends_with(".txt")
        })
        .collect()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_file, get_cli_args])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
