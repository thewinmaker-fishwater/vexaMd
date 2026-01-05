// Library entry point for Tauri

use std::env;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// tasklist 명령어로 이미 실행 중인지 체크
#[cfg(windows)]
fn is_already_running() -> bool {
    use std::os::windows::process::CommandExt;
    use std::process::Command;

    const CREATE_NO_WINDOW: u32 = 0x08000000;
    let current_pid = std::process::id();

    let output = Command::new("tasklist")
        .args(["/FI", "IMAGENAME eq vexa-md.exe", "/FO", "CSV", "/NH"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

    if let Ok(output) = output {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("vexa-md.exe") {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 2 {
                    let pid_str = parts[1].trim_matches('"');
                    if let Ok(pid) = pid_str.parse::<u32>() {
                        if pid != current_pid {
                            return true;
                        }
                    }
                }
            }
        }
    }

    false
}

#[cfg(not(windows))]
fn is_already_running() -> bool {
    false
}

#[cfg(windows)]
mod single_instance {
    use windows::core::PCSTR;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
        FindWindowA, SetForegroundWindow, ShowWindow, SW_RESTORE,
    };

    const WINDOW_CLASS: &str = "Vexa MD\0";

    pub fn find_existing_window() -> Option<HWND> {
        unsafe {
            let class = PCSTR::from_raw(WINDOW_CLASS.as_ptr());
            match FindWindowA(None, class) {
                Ok(hwnd) if !hwnd.0.is_null() => Some(hwnd),
                _ => None,
            }
        }
    }

    pub fn activate_existing_window(hwnd: HWND) {
        unsafe {
            let _ = ShowWindow(hwnd, SW_RESTORE);
            let _ = SetForegroundWindow(hwnd);
        }
    }
}

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

/// 파일 경로를 공유 파일에 저장
fn save_file_paths_to_temp(paths: &[String]) {
    let temp_file = std::env::temp_dir().join("vexa_md_open_files.txt");
    if let Ok(mut f) = std::fs::File::create(&temp_file) {
        for p in paths {
            let _ = writeln!(f, "{}", p);
        }
    }
}

/// 공유 파일에서 파일 경로 읽기
fn read_file_paths_from_temp() -> Vec<String> {
    let temp_file = std::env::temp_dir().join("vexa_md_open_files.txt");
    let mut paths = Vec::new();
    if let Ok(f) = std::fs::File::open(&temp_file) {
        let reader = BufReader::new(f);
        for line in reader.lines() {
            if let Ok(p) = line {
                if !p.is_empty() {
                    paths.push(p);
                }
            }
        }
        let _ = std::fs::remove_file(&temp_file);
    }
    paths
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // CLI 인자에서 파일 경로 추출
    let args: Vec<String> = env::args().collect();
    let file_paths = filter_md_files(&args);

    // 싱글 인스턴스 체크
    if is_already_running() {
        // 기존 인스턴스가 있음
        if !file_paths.is_empty() {
            // 파일 경로를 임시 파일에 저장
            save_file_paths_to_temp(&file_paths);

            // 기존 윈도우 활성화
            #[cfg(windows)]
            if let Some(hwnd) = single_instance::find_existing_window() {
                single_instance::activate_existing_window(hwnd);
            }
        }
        return;
    }

    // AppHandle 공유
    let app_handle: Arc<Mutex<Option<AppHandle>>> = Arc::new(Mutex::new(None));
    let app_handle_clone = app_handle.clone();

    // 파일 열기 요청을 주기적으로 체크하는 스레드
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_millis(500));

            let paths = read_file_paths_from_temp();
            if !paths.is_empty() {
                let handle = app_handle_clone.lock().unwrap();
                if let Some(ref app) = *handle {
                    let _ = app.emit("open-files-from-instance", paths);
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.set_focus();
                        let _ = window.unminimize();
                    }
                }
            }
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(move |app| {
            let mut handle = app_handle.lock().unwrap();
            *handle = Some(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![read_file, get_cli_args, write_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
