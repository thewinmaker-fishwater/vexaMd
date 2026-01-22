// Library entry point for Tauri
// Using tauri-plugin-single-instance for proper single instance handling

use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{Emitter, Manager};

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
    fs::write(&path, &content).map_err(|e| {
        let err_msg = format!("파일 저장 실패 ({}): {}", path, e);
        eprintln!("{}", err_msg);
        err_msg
    })
}

/// 마크다운 파일 경로 필터링
fn filter_md_files(args: &[String]) -> Vec<String> {
    args.iter()
        .filter(|arg| {
            let lower = arg.to_lowercase();
            lower.ends_with(".md") || lower.ends_with(".markdown") || lower.ends_with(".txt")
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
        .setup(move |app| {
            // 초기 CLI 인자 처리 (첫 번째 인스턴스)
            let args: Vec<String> = env::args().collect();
            let file_paths = filter_md_files(&args);

            if !file_paths.is_empty() {
                // 잠시 후 이벤트 발생 (UI가 준비된 후)
                let app_handle = app.handle().clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = app_handle.emit("open-files-from-instance", file_paths);
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![read_file, get_cli_args, write_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
