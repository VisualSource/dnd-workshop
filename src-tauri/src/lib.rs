mod commands;
mod http;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    //tauri_runtime_verso::set_verso_devtools_port(5045);

    //tauri_runtime_verso::builder()

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(tokio::sync::Mutex::new(http::SteamWebLoginState::new()))
        .invoke_handler(tauri::generate_handler![
            commands::start_steam_login,
            commands::cancel_steam_login
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
