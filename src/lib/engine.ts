import { Application, CullerPlugin, extensions } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { parseMapFile } from "./dungeon-scrawl/parser";
import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";

export class Engine {
	#mountCount = 0;
	#fakeDismount = false;
	canvas: HTMLCanvasElement | null = null;
	container: HTMLDivElement | null = null;
	public app: Application | null = null;
	private controller: AbortController | null = null;

	constructor() {
		extensions.add(CullerPlugin);
	}

	private async init() {
		this.app = new Application();

		const signal = this.controller?.signal;
		if (!this.canvas || !this.container) throw new Error("Invalid canvas");

		await this.app.init({
			canvas: this.canvas,
			antialias: true,
			autoDensity: true,
			resizeTo: this.container,
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

		const file = await readFile("dungeon(3).ds", {
			baseDir: BaseDirectory.Download,
		});

		const { map, bgColor } = parseMapFile(file);
		this.app.renderer.background.color.setValue(bgColor);
		viewport.addChild(map);
	}

	public mount(
		canvas: HTMLCanvasElement | null,
		container: HTMLDivElement | null,
	) {
		this.#mountCount++;
		if (this.#mountCount !== 1) return;
		if (!canvas || !container) return;

		if (import.meta.env.DEV && this.#fakeDismount) {
			this.#fakeDismount = false;
			return;
		}
		this.canvas = canvas;
		this.container = container;
		this.controller = new AbortController();

		if (import.meta.env.DEV)
			window.addEventListener(
				"keydown",
				(ev) => {
					console.log(ev.key);
					if (ev.ctrlKey && ev.key === "p") {
						this.app?.destroy();
						this.app = null;
						this.init().catch((e) => console.error(e));
						console.log("Reloading....");
					}
				},
				{ signal: this.controller.signal },
			);

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
