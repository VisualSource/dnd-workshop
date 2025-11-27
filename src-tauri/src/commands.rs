use tauri::{AppHandle, Manager};

use crate::http::SteamWebLoginState;

// remember to call `.manage(MyState::default())`
#[tauri::command]
pub async fn start_steam_login(
    app: AppHandle,
    state: tauri::State<'_, tokio::sync::Mutex<SteamWebLoginState>>,
) -> Result<u16, String> {
    let app_handle = app.app_handle();

    let mut guard = state.lock().await;
    let port = guard
        .start_server(app_handle)
        .await
        .map_err(|err| err.to_string())?;

    Ok(port)
}

#[tauri::command]
pub async fn cancel_steam_login(
    state: tauri::State<'_, tokio::sync::Mutex<SteamWebLoginState>>,
) -> Result<(), String> {
    let mut guard = state.lock().await;

    guard.cancel().await.map_err(|err| err.to_string())?;

    Ok(())
}
