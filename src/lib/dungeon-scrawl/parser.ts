import { Container, Graphics, Rectangle, type RoundedPoint } from "pixi.js";
import { readZip } from "./zip-reader";
import type { DSFile, Point } from "./types";
import type { UUID } from "node:crypto";
import {
	drawGrid,
	getBoundingBox,
	getHorizontalAligment,
	getVerticalAligment,
	isHorizontalLine,
} from "./utils";

type Metadata = {
	pageId?: UUID;
	geomertyId?: UUID;
	bounds?: Rectangle;
	cellDiameter?: number;
};

type ParserState = {
	pageId: UUID;
	queue: UUID[];
	openGroupsStack: {
		container: Container;
		nodeId: UUID;
		lastChildUUID: UUID;
		metadata: Metadata;
	}[];
	getMetadata<T extends keyof Metadata>(key: T): Metadata[T] | null;
	popOpenGroup(nodeId: UUID): void;
	queueChildren(
		nodeId: UUID,
		children: UUID[],
		container: Container,
		metadata?: Metadata,
	): void;
	appendChild(parentId: UUID, item: Container): void;
};

export const parseMapFile = (file: Uint8Array<ArrayBuffer>) => {
	const utf8decoder = new TextDecoder();
	const root = new Container({
		isRenderGroup: true,
	});

	const zip = readZip(file);
	const map = JSON.parse(utf8decoder.decode(zip.map.content)) as DSFile;

	if (map.version !== 1) throw new Error("Unsupported ds file version");

	const doc = map.state.document.nodes[map.state.document.documentNodeId];

	const state: ParserState = {
		pageId: doc.selectedPage,
		queue: [doc.selectedPage],
		openGroupsStack: [],
		getMetadata(key) {
			for (let i = state.openGroupsStack.length - 1; i > -1; i--) {
				const id = state.openGroupsStack[i].metadata[key];
				if (id) return id;
			}

			return null;
		},
		popOpenGroup(nodeId) {
			const group = state.openGroupsStack.at(-1);
			if (!group) return;
			if (group.lastChildUUID !== nodeId) return;
			state.openGroupsStack.pop();
		},
		appendChild(parentId, item) {
			const group = state.openGroupsStack.at(-1);
			if (!group) return;
			if (group.nodeId === parentId) {
				group.container.addChild(item);
			}
		},
		queueChildren(nodeId, children, container, metadata = {}) {
			if (children.length < 1) return;
			state.queue.splice(0, 0, ...children);
			const lastUUID = children.at(-1);
			if (!lastUUID) return;
			state.openGroupsStack.push({
				container,
				nodeId,
				lastChildUUID: lastUUID,
				metadata,
			});
		},
	};

	let bgColor = 0;

	while (state.queue.length !== 0) {
		const uuid = state.queue.shift();
		if (!uuid) throw new Error("Failed to get item uuid");
		const node = map.state.document.nodes[uuid];

		switch (node.type) {
			case "PAGE": {
				const continer = new Container({
					label: node.name,
					alpha: node.alpha,
				});

				bgColor = node.background.colour.colour;
				root.addChild(continer);
				state.queueChildren(node.id, node.children, continer, {
					pageId: node.id,
					cellDiameter: node.grid.cellDiameter,
				});

				const graphics = new Graphics({
					label: "Background",
				});

				drawGrid(
					graphics,
					node.grid.variant,
					new Rectangle(0, 0, 1400, 1400),
					node.grid.cellDiameter,
					node.grid.sharedOptions.colour,
					node.grid.variant === "dots"
						? node.grid.dotsOptions.radius
						: node.grid.linesOptions.width,
				);

				continer.addChild(graphics);

				break;
			}
			case "IMAGES": {
				break;
			}
			case "TEMPLATE": {
				const container = new Container({
					label: node.name,
					alpha: node.alpha,
					visible: node.visible,
				});

				const shapeNodeId = node.template.dungeonShape
				const geoNode = map.state.document.nodes[shapeNodeId]
				if (geoNode.type !== "GEOMETRY")
					throw new Error("Failed get map bounds");

				const geo = map.data.geometry[geoNode.geometryId];

				const cellDiameter = state.getMetadata("cellDiameter");
				if (!cellDiameter) throw new Error("Failed to get cell diameter");

				const bounds = getBoundingBox(geo.polygons, cellDiameter);
				
				state.appendChild(node.parentId, container);
				state.queueChildren(node.id, node.children, container,{ bounds });

				break;
			}
			case "GEOMETRY": {
				const continer = new Container({
					label: node.name,
					alpha: node.alpha,
					visible: node.visible,
				});

				state.appendChild(node.parentId, continer);
				state.queueChildren(node.id, node.children, continer, {
					geomertyId: node.geometryId,
				});

				break;
			}
			case "FOLDER": {
				const container = new Container({
					label: node.name,
					alpha: node.alpha,
					visible: node.visible,
				});

				state.appendChild(node.parentId, container);
				state.queueChildren(node.id, node.children, container);
				break;
			}
			case "GRID": {
				if (!node.visible) break;
				if (node.gridType !== "square")
					throw new Error("non square maps not supported");

				const graphics = new Graphics({
					label: node.name,
					alpha: node.alpha,
					visible: node.visible,
				});
				state.appendChild(node.parentId, graphics);

				const pageId = state.getMetadata("pageId");
				if (!pageId) throw new Error("Failed to get pageId");
				const page = map.state.document.nodes[pageId];
				if (!page || page.type !== "PAGE") throw new Error("Invalid page");

				const cellDiameter = state.getMetadata("cellDiameter");
				if (!cellDiameter) throw new Error("Failed to get cell diameter");

				const bounds = state.getMetadata("bounds");
				if (!bounds) throw new Error("Failed to get bounds");

				const color =
					node.variant === "clean"
						? node.cleanOptions.colour
						: node.variant === "dots"
							? node.dotsOptions.colour
							: node.roughOptions.colour;
				const radiusOrwidth =
					node.variant === "dots"
						? node.dotsOptions.radius
						: node.variant === "clean"
							? node.cleanOptions.width
							: node.roughOptions.width;

				drawGrid(
					graphics,
					node.variant === "clean" ? "lines" : node.variant,
					bounds,
					cellDiameter,
					color,
					radiusOrwidth,
					node.roughOptions.roughness,
				);

				break;
			}
			case "MULTIPOLYGON": {
				const geomertyId = state.getMetadata("geomertyId");
				if (!geomertyId) throw new Error("Failed to get geomertyId");

				const graphics = new Graphics({
					alpha: node.alpha,
					visible: node.visible,
					label: node.name,
				});

				graphics.setStrokeStyle({
					width: node.stroke.width,
					color: node.stroke.colour.colour,
					alpha: node.stroke.colour.alpha,
				});
				graphics.setFillStyle({
					color: node.fill.colour.colour,
					alpha: node.fill.colour.alpha,
				});

				const parent = state.openGroupsStack.at(-1);
				if (!parent) throw new Error("Failed to get parent");

				parent.container.addChild(graphics);
				if (node.mask) {
					parent.container.setMask({
						mask: graphics,
					});
				}

				const geomerty = map.data.geometry[geomertyId];

				if (geomerty.polygons.length >= 1) {
					for (const polygon of geomerty.polygons) {
						const base = polygon.at(0);
						if (!base) continue;

						const basePoints: RoundedPoint[] = base.map((point) => ({
							x: point[0],
							y: point[1],
						}));
						basePoints.pop();

						graphics.roundShape(basePoints, node.mask ? 0 : 0.3, true, 1);

						if (node.fill.visible || node.mask) graphics.fill();
						if (node.stroke.visible && !node.mask) graphics.stroke();

						for (const points of polygon.slice(1)) {
							const roundedPoints: RoundedPoint[] = points.map((e) => ({
								x: e[0],
								y: e[1],
							}));
							roundedPoints.pop();
							graphics.roundShape(roundedPoints, 0.3, true, 1).cut();
						}
					}
				}

				break;
			}
			case "ASSET_GROUP":
				break;
			case "SHADOW": {
				if (!node.visible) break;

				const geomertyId = state.getMetadata("geomertyId");
				if (!geomertyId) throw new Error("Failed to get geomertyId");

				const geometry = map.data.geometry[geomertyId];
				if (!geometry) throw new Error("Failed to get geomerty");

				const graphics = new Graphics();
				graphics.label = "Shadow";

				for (const polygons of geometry.polygons) {
					for (const polygon of polygons) {
						let lastPoint: Point | undefined;

						for (const point of polygon) {
							if (!lastPoint) {
								lastPoint = point;
								continue;
							}
							const isHorizontal = isHorizontalLine(lastPoint, point);

							graphics
								.moveTo(lastPoint[0], lastPoint[1])
								.lineTo(point[0], point[1])
								.stroke({
									width: isHorizontal ? node.ty : node.tx,
									color: node.colour.colour,
									alpha: node.colour.alpha,
									alignment: isHorizontal
										? getHorizontalAligment(lastPoint[0], point[0])
										: getVerticalAligment(lastPoint[1], point[1]),
								});

							lastPoint = point;
						}
					}
				}

				const parent = state.openGroupsStack.at(-1);
				if (!parent) throw new Error("Failed to get parent");

				parent.container.addChild(graphics);

				break;
			}
		}

		state.popOpenGroup(node.id);
	}

	return {
		map: root,
		bgColor,
	};
};

