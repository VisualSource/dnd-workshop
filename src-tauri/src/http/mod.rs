use std::{
    io::{self, ErrorKind, Write},
    net::{TcpListener, TcpStream},
    thread::{self, JoinHandle},
};

mod request;
mod response;

use response::Response;

pub struct StreamWebLoginState {
    port: Option<u16>,
    handle: Option<JoinHandle<()>>,
}

impl StreamWebLoginState {
    pub fn cancel(&mut self) -> io::Result<()> {
        self.port = None;

        if let Some(handle) = &self.handle {
            handle.join().expect("Failed to join thread!");
        }

        Ok(())
    }

    pub fn start_server(&mut self) -> io::Result<()> {
        let listener = TcpListener::bind("localhost")?;

        let addr = listener.local_addr()?;
        self.port = Some(addr.port());

        let handle = thread::spawn(move || {
            for stream in listener.incoming() {
                match stream {
                    Ok(stream) => {
                        if let Err(err) = handle_connection(stream) {
                            eprintln!("{}", err);
                        }
                    }
                    Err(err) => {
                        eprintln!("{}", err);
                    }
                }
            }
        });

        self.handle = Some(handle);

        Ok(())
    }
}

fn handle_connection(mut stream: TcpStream) -> io::Result<()> {
    let req = request::Request::new(&stream);

    let res = match req {
        Ok(r) => {
            let res = match r.method.as_str() {
                "GET" => Response::text(204, "", None),
                &_ => Response::text(400, "", None),
            };

            Response::resolve(&res)
        }
        Err(err) => {
            let res = Response::text(500, err.to_string(), None);
            Response::resolve(&res)
        }
    };

    if let Err(err) = stream.write(res.as_bytes()) {
        return Err(io::Error::other(err));
    }

    Ok(())
}
