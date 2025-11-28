use std::{collections::HashMap, io, time::Duration};
use tauri::{AppHandle, Emitter};
use tokio::io::AsyncWriteExt;
use tokio_util::sync::CancellationToken;

mod request;
mod response;

use request::Request;
use response::Response;

pub struct ActiveState {
    cancellation_token: CancellationToken,
    handle: tokio::task::JoinHandle<()>,
}

pub struct SteamWebLoginState(Option<ActiveState>);

impl SteamWebLoginState {
    pub fn new() -> Self {
        Self(None)
    }

    pub async fn cancel(&mut self) -> io::Result<()> {
        if let Some(state) = self.0.take() {
            state.cancellation_token.cancel();
            state.handle.await?;
        }

        Ok(())
    }

    pub async fn start_server(&mut self, app_handle: &AppHandle) -> io::Result<u16> {
        if let Some(state) = self.0.take() {
            state.cancellation_token.cancel();
            state.handle.await?;
        }

        let token = CancellationToken::new();
        let cloned_token = token.clone();

        let listener = tokio::net::TcpListener::bind("localhost:0").await?;

        let addr = listener.local_addr()?;

        let handle = app_handle.clone();
        let handle = tokio::spawn(async move {
            loop {
                tokio::select! {
                    _ = cloned_token.cancelled() => {
                        log::debug!("Loop was cancelled");
                        break;
                    }
                    _ = tokio::time::sleep(Duration::from_mins(10)) => {
                        log::debug!("Loop timeout called");
                        cloned_token.cancel();
                    },
                    stream = listener.accept() => {
                        match stream {
                            Ok((stream,_)) => {
                                match handle_connection(stream).await {
                                    Ok(result) => {
                                        if let Some(value) = result {
                                            cloned_token.cancel();
                                            if let Err(err) = handle.emit("steam-login", value) {
                                                log::error!("{}",err);
                                            }
                                        }
                                    }
                                    Err(err)=>{
                                        log::error!("{}",err);
                                    }
                                }
                            }
                            Err(err) => {
                                log::error!("{}",err);
                            }
                        }
                    }
                }
            }

            log::debug!("Exiting serer loop!");
        });

        let port = addr.port();

        self.0 = Some(ActiveState {
            cancellation_token: token,
            handle,
        });

        Ok(port)
    }
}

async fn handle_connection(
    mut stream: tokio::net::TcpStream,
) -> io::Result<Option<HashMap<String, String>>> {
    let req = Request::new(&mut stream).await;

    let mut result = None;

    let res = match req {
        Ok(r) => {
            let res = match r.method.as_str() {
                "GET" => {
                    log::debug!("{:#?}",r);
                    if &r.path == "/" {
                        result = Some(r.query);
                        Response::text(204, "", None)
                    } else {
                        Response::text(400, "", None)
                    }
                }
                &_ => Response::text(400, "", None),
            };

            Response::resolve(&res)
        }
        Err(err) => {
            log::error!("{}",err);
            let res = Response::text(500, "Error".into(), None);
            Response::resolve(&res)
        }
    };

    if let Err(err) = stream.write(res.as_bytes()).await {
        return Err(io::Error::other(err));
    }

    Ok(result)
}
