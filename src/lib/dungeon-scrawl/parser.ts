import { Container } from "pixi.js"
import { readZip } from "./zip-reader";

export const parseMapFile = (file: Uint8Array<ArrayBuffer>) => {
    const utf8decoder = new TextDecoder();
    const container = new Container;

	const zip = readZip(file);
	const rawMap = JSON.parse(utf8decoder.decode(zip.map.content));

    return container;
}   
