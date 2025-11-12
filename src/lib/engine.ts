import {
	Application,
	Container,
	CullerPlugin,
	extensions,
	Graphics,
	Text,
} from "pixi.js";

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

		const gridPixel = buildGrid(new Graphics()).stroke({
			color: 0xffffff,
			pixelLine: true,
			width: 1,
		});

		const grid = buildGrid(new Graphics()).stroke({
			color: 0xffffff,
			pixelLine: false,
		});

		// Position the grids side by side
		grid.x = -100;
		grid.y = -50;
		gridPixel.y = -50;

		// Create a container to hold both grids
		const container = new Container();

		container.addChild(grid, gridPixel);

		// Center the container on screen
		container.x = this.app.screen.width / 2;
		container.y = this.app.screen.height / 2;
		this.app.stage.addChild(container);

		// Animation variables
		let count = 0;
		this.app.ticker.add(() => {
			count += 0.01;
			container.scale = 1 + (Math.sin(count) + 1) * 2;
		});

		const label = new Text({
			text: "Grid Comparison: Standard Lines (Left) vs Pixel-Perfect Lines (Right)",
			style: { fill: 0xffffff },
		});

		label.position.set(20, 20);
		label.width = this.app.screen.width - 40;
		label.scale.y = label.scale.x;
		this.app.stage.addChild(label);
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
