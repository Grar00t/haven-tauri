// ═══════════════════════════════════════════════════════════════════════
// HAVEN IDE — Tauri Backend Library
// مكتبة الواجهة الخلفية للبيئة السيادية
// Built by أبو خوارزم — Sulaiman Alshammari
// ═══════════════════════════════════════════════════════════════════════

use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use serde::{Deserialize, Serialize};
use sysinfo::System;
use tauri::Manager;

// ── Data Types ────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaGenerateRequest {
    pub model: String,
    pub prompt: String,
    pub system: Option<String>,
    pub stream: Option<bool>,
    pub options: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaChatRequest {
    pub model: String,
    pub messages: Vec<OllamaChatMessage>,
    pub stream: Option<bool>,
    pub options: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaGenerateResponse {
    pub model: String,
    pub response: String,
    pub done: bool,
    pub total_duration: Option<u64>,
    pub eval_count: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModel {
    pub name: String,
    pub modified_at: String,
    pub size: u64,
    pub digest: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModelsResponse {
    pub models: Vec<OllamaModel>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaRunningModel {
    pub name: String,
    pub model: String,
    pub size: u64,
    pub digest: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaRunningModelsResponse {
    pub models: Vec<OllamaRunningModel>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub cpu_usage: f32,
    pub cpu_count: usize,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_available: u64,
    pub disk_total: u64,
    pub disk_used: u64,
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: Option<u64>,
    pub extension: Option<String>,
    pub children: Option<Vec<FileEntry>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

// ── Ollama Commands ───────────────────────────────────────────────────

/// فحص صحة الاتصال بـ Ollama
#[tauri::command]
pub async fn ollama_health_check(host: Option<String>) -> Result<bool, String> {
    let base_url = host.unwrap_or_else(|| "http://127.0.0.1:11434".to_string());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .no_proxy()
        .build()
        .map_err(|e| e.to_string())?;

    match client.get(format!("{}/api/tags", base_url)).send().await {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}

/// توليد نص من نموذج Ollama (بدون بث)
#[tauri::command]
pub async fn ollama_generate(
    request: OllamaGenerateRequest,
    host: Option<String>,
) -> Result<String, String> {
    let base_url = host.unwrap_or_else(|| "http://127.0.0.1:11434".to_string());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .no_proxy()
        .build()
        .map_err(|e| e.to_string())?;

    let mut req = request;
    req.stream = Some(false);

    let response = client
        .post(format!("{}/api/generate", base_url))
        .json(&req)
        .send()
        .await
        .map_err(|e| format!("Connection error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama error: HTTP {}", response.status()));
    }

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    body.get("response")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "No response field in Ollama response".to_string())
}

/// محادثة مع نموذج Ollama
#[tauri::command]
pub async fn ollama_chat(
    request: OllamaChatRequest,
    host: Option<String>,
) -> Result<String, String> {
    let base_url = host.unwrap_or_else(|| "http://127.0.0.1:11434".to_string());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .no_proxy()
        .build()
        .map_err(|e| e.to_string())?;

    let mut req = request;
    req.stream = Some(false);

    let response = client
        .post(format!("{}/api/chat", base_url))
        .json(&req)
        .send()
        .await
        .map_err(|e| format!("Connection error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama error: HTTP {}", response.status()));
    }

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    body.get("message")
        .and_then(|m| m.get("content"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "No message content in Ollama response".to_string())
}

/// قائمة النماذج المتاحة
#[tauri::command]
pub async fn ollama_list_models(host: Option<String>) -> Result<Vec<OllamaModel>, String> {
    let base_url = host.unwrap_or_else(|| "http://127.0.0.1:11434".to_string());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .no_proxy()
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(format!("{}/api/tags", base_url))
        .send()
        .await
        .map_err(|e| format!("Connection error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama error: HTTP {}", response.status()));
    }

    let data: OllamaModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    Ok(data.models)
}

/// النماذج التي تعمل حالياً
#[tauri::command]
pub async fn ollama_running_models(host: Option<String>) -> Result<Vec<OllamaRunningModel>, String> {
    let base_url = host.unwrap_or_else(|| "http://127.0.0.1:11434".to_string());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .no_proxy()
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(format!("{}/api/ps", base_url))
        .send()
        .await
        .map_err(|e| format!("Connection error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama error: HTTP {}", response.status()));
    }

    let data: OllamaRunningModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    Ok(data.models)
}

/// معلومات نموذج محدد
#[tauri::command]
pub async fn ollama_show_model(
    model_name: String,
    host: Option<String>,
) -> Result<serde_json::Value, String> {
    let base_url = host.unwrap_or_else(|| "http://127.0.0.1:11434".to_string());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .no_proxy()
        .build()
        .map_err(|e| e.to_string())?;

    let body = serde_json::json!({ "name": model_name });
    let response = client
        .post(format!("{}/api/show", base_url))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Connection error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama error: HTTP {}", response.status()));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

/// حذف نموذج
#[tauri::command]
pub async fn ollama_delete_model(
    model_name: String,
    host: Option<String>,
) -> Result<bool, String> {
    let base_url = host.unwrap_or_else(|| "http://127.0.0.1:11434".to_string());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .no_proxy()
        .build()
        .map_err(|e| e.to_string())?;

    let body = serde_json::json!({ "name": model_name });
    let response = client
        .delete(format!("{}/api/delete", base_url))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Connection error: {}", e))?;

    Ok(response.status().is_success())
}

// ── File System Commands ──────────────────────────────────────────────

/// قراءة ملف
#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read '{}': {}", path, e))
}

/// كتابة ملف
#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<bool, String> {
    // Ensure parent directory exists
    if let Some(parent) = PathBuf::from(&path).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    tokio::fs::write(&path, &content)
        .await
        .map_err(|e| format!("Failed to write '{}': {}", path, e))?;

    Ok(true)
}

/// إنشاء مجلد
#[tauri::command]
pub async fn create_directory(path: String) -> Result<bool, String> {
    tokio::fs::create_dir_all(&path)
        .await
        .map_err(|e| format!("Failed to create directory '{}': {}", path, e))?;
    Ok(true)
}

/// حذف ملف أو مجلد
#[tauri::command]
pub async fn delete_path(path: String, recursive: bool) -> Result<bool, String> {
    let meta = tokio::fs::metadata(&path)
        .await
        .map_err(|e| format!("Path not found '{}': {}", path, e))?;

    if meta.is_dir() {
        if recursive {
            tokio::fs::remove_dir_all(&path)
                .await
                .map_err(|e| format!("Failed to delete dir '{}': {}", path, e))?;
        } else {
            tokio::fs::remove_dir(&path)
                .await
                .map_err(|e| format!("Failed to delete dir '{}': {}", path, e))?;
        }
    } else {
        tokio::fs::remove_file(&path)
            .await
            .map_err(|e| format!("Failed to delete file '{}': {}", path, e))?;
    }

    Ok(true)
}

/// قائمة محتويات مجلد
#[tauri::command]
pub async fn list_directory(path: String, recursive: bool) -> Result<Vec<FileEntry>, String> {
    list_dir_recursive(&path, recursive, 0).await
}

async fn list_dir_recursive(
    path: &str,
    recursive: bool,
    depth: usize,
) -> Result<Vec<FileEntry>, String> {
    let mut entries: Vec<FileEntry> = Vec::new();

    let mut read_dir = tokio::fs::read_dir(path)
        .await
        .map_err(|e| format!("Failed to read dir '{}': {}", path, e))?;

    while let Some(entry) = read_dir
        .next_entry()
        .await
        .map_err(|e| format!("Error reading entry: {}", e))?
    {
        let entry_path = entry.path();
        let entry_name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files and common noise
        if entry_name.starts_with('.') && ![".", ".."].contains(&entry_name.as_str()) {
            continue;
        }
        if entry_name == "node_modules" || entry_name == "target" || entry_name == ".git" {
            let is_dir = entry_path.is_dir();
            entries.push(FileEntry {
                name: entry_name.clone(),
                path: entry_path.to_string_lossy().to_string(),
                is_dir,
                size: 0,
                modified: None,
                extension: None,
                children: if is_dir { Some(vec![]) } else { None },
            });
            continue;
        }

        let meta = match entry.metadata().await {
            Ok(m) => m,
            Err(_) => continue,
        };

        let is_dir = meta.is_dir();
        let size = if is_dir { 0 } else { meta.len() };
        let modified = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        let extension = if is_dir {
            None
        } else {
            entry_path
                .extension()
                .map(|e| e.to_string_lossy().to_string())
        };

        let children = if is_dir && recursive && depth < 5 {
            let child_path = entry_path.to_string_lossy().to_string();
            match Box::pin(list_dir_recursive(&child_path, recursive, depth + 1)).await {
                Ok(c) => Some(c),
                Err(_) => Some(vec![]),
            }
        } else if is_dir {
            Some(vec![])
        } else {
            None
        };

        entries.push(FileEntry {
            name: entry_name,
            path: entry_path.to_string_lossy().to_string(),
            is_dir,
            size,
            modified,
            extension,
            children,
        });
    }

    // Sort: directories first, then files, both alphabetically
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

// ── Shell Commands ────────────────────────────────────────────────────

/// تنفيذ أمر في الطرفية
#[tauri::command]
pub async fn run_command(
    command: String,
    cwd: Option<String>,
    env_vars: Option<HashMap<String, String>>,
) -> Result<CommandResult, String> {
    let working_dir = cwd.unwrap_or_else(|| {
        dirs::home_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| "/".to_string())
    });

    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = tokio::process::Command::new("cmd");
        c.args(["/C", &command]);
        c
    } else {
        let mut c = tokio::process::Command::new("sh");
        c.args(["-c", &command]);
        c
    };

    cmd.current_dir(&working_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(vars) = env_vars {
        for (key, val) in vars {
            cmd.env(key, val);
        }
    }

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to run command: {}", e))?;

    Ok(CommandResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

// ── System Info ───────────────────────────────────────────────────────

/// معلومات النظام
#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_usage = sys.global_cpu_usage();
    let cpu_count = sys.cpus().len();
    let memory_total = sys.total_memory();
    let memory_used = sys.used_memory();
    let memory_available = sys.available_memory();

    // Disk info
    let disks = sysinfo::Disks::new_with_refreshed_list();
    let (disk_total, disk_used) = disks.iter().fold((0u64, 0u64), |acc, d| {
        (acc.0 + d.total_space(), acc.1 + (d.total_space() - d.available_space()))
    });

    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
    let hostname = System::host_name().unwrap_or_else(|| "haven".to_string());

    Ok(SystemInfo {
        cpu_usage,
        cpu_count,
        memory_total,
        memory_used,
        memory_available,
        disk_total,
        disk_used,
        os_name,
        os_version,
        hostname,
    })
}

/// مسار المنزل
#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

/// مسار مجلد التطبيق
#[tauri::command]
pub async fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

// ── App Entry ─────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            // Ollama
            ollama_health_check,
            ollama_generate,
            ollama_chat,
            ollama_list_models,
            ollama_running_models,
            ollama_show_model,
            ollama_delete_model,
            // Filesystem
            read_file,
            write_file,
            create_directory,
            delete_path,
            list_directory,
            // Shell
            run_command,
            // System
            get_system_info,
            get_home_dir,
            get_app_data_dir,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running HAVEN IDE");
}
