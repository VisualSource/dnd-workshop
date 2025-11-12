import { Graphics } from "pixi.js";

export function parseDSFile(content: unknown) {
	// Create a grid of vertical and horizontal lines
	const grid = new Graphics();

	// Draw 10 vertical lines spaced 10 pixels apart
	// Draw vertical lines
	for (let i = 0; i < 10; i++) {
		// Move to top of each line (x = i*10, y = 0)
		grid
			.moveTo(i * 10, 0)
			// Draw down to bottom (x = i*10, y = 100)
			.lineTo(i * 10, 100);
	}

	// Draw horizontal lines
	for (let i = 0; i < 10; i++) {
		// Move to start of each line (x = 0, y = i*10)
		grid
			.moveTo(0, i * 10)
			// Draw across to end (x = 100, y = i*10)
			.lineTo(100, i * 10);
	}

	// Stroke all lines in white with pixel-perfect width
	grid.stroke({ color: 0xffffff, pixelLine: true });

	return grid;
}
