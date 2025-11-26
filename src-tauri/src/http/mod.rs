use std::{
    io::{self, ErrorKind, Write},
    net::{TcpListener, TcpStream},
    thread::{self, JoinHandle},
};
use min::{Events,Interset,Poll,Token};
use mio::{Events, net::{TcpListener,TcpStream}};

mod request;
mod response;

use request::Request;
use response::Response;

pub struct StreamWebLoginState {
    port: Option<u16>,
    handle: Option<JoinHandle<()>>,
}

/**
 *  1. Start Sever
 *  2. generate noce
 *  3. return noce and port
 *  4. wait for request
 *  5. if invalid
 *         -> ignore
 *     else
 *  6. send response to window
 *  7. close server 
 * 
 */
const SERVER: Token = Token(0);
const MESSAGE_PUMP: Token = Token(1);

impl SteamWebLoginState {
    pub fn cancel(&mut self) -> io::Result<()> {
        self.port = None;

        if let Some(handle) = self.handle.take() {
            handle.join().expect("Failed to join thread!");
        }

        Ok(())
    }

    pub fn start_server(&mut self) -> io::Result<()> {
        let handle = thread::spawn(||{
            let mut poll = Poll::new()?;
            let mut events = Events::with_capacity(128); 

            let mut server = TcpListener::bind("localhost")?;
            
            poll.registry().register(&mut server,SERVER,Interset::READABLE)?;

            loop {
                poll.poll(&mut events, None)?;

                for event in events.iter() {
                    SERVER => {}
                    MESSAGE_PUMP => {}
                    _ => unreachable!()
                }
            }
        });



        self.handle = Some(handle);

        Ok(())
    }
}

fn handle_connection(mut stream: TcpStream) -> io::Result<()> {
    let req = Request::new(&stream);

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
