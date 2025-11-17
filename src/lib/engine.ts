import { Application, CullerPlugin, extensions, type Graphics } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { parseMapFile } from "./dungeon-scrawl/parser";
import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";

function buildGrid(graphics: Graphics) {
	// Draw 10 vertical lines spaced 10 pixels apart
	for (let i = 0; i < 11; i++) {
		// Move to top of each line (x = i*10, y = 0)
		graphics
			.moveTo(i * 10, 0)
			// Draw down to bottom (x = i*10, y = 100)
			.lineTo(i * 10, 100);
	}

	// Draw 10 horizontal lines spaced 10 pixels apart
	for (let i = 0; i < 11; i++) {
		// Move to start of each line (x = 0, y = i*10)
		graphics
			.moveTo(0, i * 10)
			// Draw across to end (x = 100, y = i*10)
			.lineTo(100, i * 10);
	}

	return graphics;
}

export class Engine {
	#mountCount = 0;
	#fakeDismount = false;
	canvas: HTMLCanvasElement | null = null;
	public app: Application | null = null;
	private controller: AbortController | null = null;

	constructor() {
		extensions.add(CullerPlugin);
	}

	private async init() {
		const signal = this.controller?.signal;
		if (!this.app) throw new Error("App not created");
		if (!this.canvas) throw new Error("Invalid canvas");

		await this.app.init({
			canvas: this.canvas,
			antialias: true,
		});

		this.app.queueResize();
		if (signal?.aborted) return;

		const viewport = new Viewport({
			screenWidth: this.canvas.width,
			screenHeight: this.canvas.height,
			worldHeight: 10_000,
			worldWidth: 10_000,
			events: this.app.renderer.events,
		});
		this.app.stage.addChild(viewport);
		viewport.drag().pinch().wheel();

		const file = await readFile("dungeon(1).ds", {
			baseDir: BaseDirectory.Download,
		});

		const { map, bgColor } = parseMapFile(file);
		this.app.renderer.background.color.setValue(bgColor);
		viewport.addChild(map);
	}

	public mount(canvas: HTMLCanvasElement | null) {
		this.#mountCount++;
		if (this.#mountCount !== 1) return;
		if (!canvas) return;

		if (import.meta.env.DEV && this.#fakeDismount) {
			this.#fakeDismount = false;
			return;
		}
		this.canvas = canvas;
		this.controller = new AbortController();

		this.app = new Application();

		this.init().catch((err) => console.error(err));
	}
	public unmount() {
		this.#mountCount--;
		if (this.#mountCount !== 0) return;

		if (import.meta.env.DEV && this.canvas?.isConnected) {
			this.#fakeDismount = true;
			return;
		}

		this.canvas = null;
		this.controller?.abort();

		this.app?.destroy();
	}
}
