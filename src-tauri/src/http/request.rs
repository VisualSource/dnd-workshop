use std::{collections::HashMap, io::Read, net::TcpStream};

const MESSAGE_SIZE: usize = 1024;

#[derive(Debug)]
pub struct Request {
    pub method: String,
    pub path: String,
    pub headers: HashMap<String, String>,
    pub query: HashMap<String, String>,
    pub content: String,
}

impl Request {
    pub fn new(mut stream: &TcpStream) -> Result<Self, String> {
        let mut received: Vec<u8> = Vec::new();
        let mut rx_bytes = [0u8; MESSAGE_SIZE];
        loop {
            let bytes_read = stream.read(&mut rx_bytes);
            match bytes_read {
                Ok(bytes) => {
                    received.extend_from_slice(&rx_bytes[..bytes]);
                    if bytes < MESSAGE_SIZE {
                        break;
                    }
                }
                Err(err) => return Err(err.to_string()),
            }
        }

        let request_text = String::from_utf8(received).unwrap();
        let mut request_lines: Vec<&str> = request_text.split_inclusive('\n').collect();

        let mut header_map: HashMap<String, String> = HashMap::new();
        let mut query_params: HashMap<String, String> = HashMap::new();

        let request_line = request_lines[0];
        let mut parts = request_line.split_ascii_whitespace();
        let http_method = parts.next().unwrap();
        let full_path = parts.next().unwrap();

        let path_and_query: Vec<&str> = full_path.split('?').collect();
        let path = path_and_query[0];

        if path_and_query.len() > 1 {
            let query_string = path_and_query[1..].join("");
            let query_pairs: Vec<&str> = query_string.split('&').collect();

            for pair in query_pairs {
                if let Some((key, value)) = pair.split_once('=') {
                    query_params.insert(key.to_string(), value.to_string());
                }
            }
        }

        request_lines.remove(0);

        let blank_line_index = request_lines
            .iter()
            .position(|&line| line == "\r\n")
            .unwrap();
        let body_lines = &mut request_lines.split_off(blank_line_index);
        body_lines.remove(0);
        let body_content = body_lines.join("");

        for header_line in request_lines {
            if let Some((key, value)) = header_line.split_once(": ") {
                let clean_value = value.replace("\r\n", "");
                header_map.insert(key.to_string(), clean_value);
            }
        }

        Ok(Self {
            method: http_method.to_string(),
            path: path.to_string(),
            content: body_content,
            headers: header_map,
            query: query_params,
        })
    }
}
