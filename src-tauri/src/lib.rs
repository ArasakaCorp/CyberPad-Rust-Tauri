use serde::Serialize;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
struct SaveResponse {
    ok: bool,
    error: Option<String>,
}

#[derive(Serialize)]
struct FilePayload {
    #[serde(rename = "filePath")]
    file_path: String,

    content: String,
}

// --- window controls ---

#[tauri::command]
fn minimize_window(window: tauri::Window) -> SaveResponse {
    match window.minimize() {
        Ok(_) => SaveResponse { ok: true, error: None },
        Err(e) => SaveResponse { ok: false, error: Some(e.to_string()) },
    }
}

#[tauri::command]
fn close_app(window: tauri::Window) -> SaveResponse {
    match window.close() {
        Ok(_) => SaveResponse { ok: true, error: None },
        Err(e) => SaveResponse { ok: false, error: Some(e.to_string()) },
    }
}

// --- file ops ---

fn file_path_to_string(fp: tauri_plugin_dialog::FilePath) -> Option<String> {
    match fp {
        tauri_plugin_dialog::FilePath::Path(p) => Some(p.to_string_lossy().to_string()),
        // Для desktop обычно Path. URI встречается на mobile/content://
        tauri_plugin_dialog::FilePath::Url(_) => None,
    }
}

#[tauri::command]
async fn open_file_dialog(app: tauri::AppHandle) -> Option<FilePayload> {
    // blocking_* OK внутри command (не main thread)
    let fp = app.dialog().file().blocking_pick_file()?;
    let path = file_path_to_string(fp)?;
    let content = std::fs::read_to_string(&path).ok()?;

Some(FilePayload {
    file_path: path,
    content,
})
}

#[tauri::command]
fn save_file(path: String, content: String) -> SaveResponse {
    match std::fs::write(&path, content) {
        Ok(_) => SaveResponse { ok: true, error: None },
        Err(e) => SaveResponse { ok: false, error: Some(e.to_string()) },
    }
}

#[tauri::command]
async fn save_as_dialog(
    app: tauri::AppHandle,
    suggested_name: String,
    content: String
) -> Option<FilePayload> {
    let fp = app
        .dialog()
        .file()
        .set_file_name(suggested_name)
        .blocking_save_file()?;

    let path = file_path_to_string(fp)?;
    std::fs::write(&path, content).ok()?;

    Some(FilePayload {
        file_path: path,
        content: String::new(),
    })
}

#[tauri::command]
fn open_path(path: String) -> Option<FilePayload> {
    let content = std::fs::read_to_string(&path).ok()?;

    Some(FilePayload {
        file_path: path,
        content,
    })
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            close_app,
            open_file_dialog,
            save_file,
            save_as_dialog,
            open_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
