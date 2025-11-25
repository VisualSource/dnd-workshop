import { Graphics, Rectangle } from "pixi.js";
import type { Color, Point, Shape } from "./types";

export const isHorizontalLine = (point1: Point, point2: Point): boolean => {
	const slope = (point2[1] - point1[1]) / (point1[0] - point2[0]);
	return slope === 0;
};

export const getHorizontalAligment = (x1: number, x2: number): number => {
	const sign = Math.sign(x1 - x2);
	return sign === -1 ? 0 : 1;
};

export const getVerticalAligment = (y1: number, y2: number): number => {
	const sign = Math.sign(y1 - y2);
	return sign === -1 ? 1 : 0;
};

export const getBoundingBox = (geomerty: Shape[], padding: number) => {
	let miny: number | undefined;
	let maxy: number | undefined;
	let maxx: number | undefined;
	let minx: number | undefined;

	for (const polygons of geomerty) {
		const base = polygons.at(0);
		if (!base) continue;
		for (const point of base) {
			miny = miny === undefined ? point[1] : Math.min(miny, point[1]);
			maxy = maxy === undefined ? point[1] : Math.max(maxy, point[1]);
			minx = minx === undefined ? point[0] : Math.min(minx, point[0]);
			maxx = maxx === undefined ? point[0] : Math.max(maxx, point[0]);
		}
	}

	if (
		miny === undefined ||
		minx === undefined ||
		maxx === undefined ||
		maxy === undefined
	)
		throw new Error("Invalid bounds");

	const bounds = new Rectangle(
		Math.floor(minx),
		Math.floor(miny),
		Math.round(maxx),
		Math.round(maxy),
	);

	return bounds.pad(padding, padding);
};

export const drawGrid = (
	graphics: Graphics,
	variant: "lines" | "dots" | "rough",
	bounds: Rectangle,
	cellDiameter: number,
	color: Color,
	radiusOrWidth: number,
	roughness?: unknown,
) => {
	switch (variant) {
		case "lines": {
			graphics.setStrokeStyle({
				color: color.colour,
				alpha: color.alpha,
				width: radiusOrWidth,
			});

			for (let x = bounds.x; x < bounds.width; x += cellDiameter) {
				graphics.moveTo(x, bounds.y).lineTo(x, bounds.height).stroke();
			}

			for (let y = bounds.x; y < bounds.height; y += cellDiameter) {
				graphics.moveTo(bounds.x, y).lineTo(bounds.width, y).stroke();
			}
			break;
		}
		case "dots": {
			graphics.setFillStyle({
				color: color.colour,
				alpha: color.alpha,
			});
			for (let x = bounds.x; x < bounds.width; x += cellDiameter) {
				for (let y = bounds.y; y < bounds.height; y += cellDiameter) {
					graphics.circle(x, y, radiusOrWidth).fill();
				}
			}
			break;
		}
		case "rough": {
			break;
		}
	}
};
