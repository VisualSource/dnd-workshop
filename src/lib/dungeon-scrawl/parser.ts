import { Container, GpuRenderTarget, Graphics, RenderLayer } from "pixi.js";
import { readZip } from "./zip-reader";
import type { DSFile } from "./types";
import type { UUID } from "node:crypto";

type ParserState = {
	pageId: UUID;
	queue: UUID[];
	openGroupsStack: {
		container: Container;
		nodeId: UUID;
		lastChildUUID: UUID;
		metadata: {
			pageId?: UUID;
			geomertyId?: UUID;
		};
	}[];
	getMetadata(key: "geomertyId" | "pageId"): UUID | null;
	popOpenGroup(nodeId: UUID): void;
	queueChildren(
		nodeId: UUID,
		children: UUID[],
		container: Container,
		metadata?: { pageId?: UUID; geomertyId?: UUID },
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
				});

				const graphics = new Graphics({
					label: "Background",
				});

				for (let x = 0; x < 10_000; x += node.grid.cellDiameter) {
					for (let y = 0; y < 10_000; y += node.grid.cellDiameter) {
						graphics.circle(x, y, node.grid.dotsOptions.radius).fill({
							color: node.grid.sharedOptions.colour.colour,
							alpha: node.grid.sharedOptions.colour.alpha,
						});
					}
				}

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

				state.appendChild(node.parentId, container);
				state.queueChildren(node.id, node.children, container);
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

				graphics.setStrokeStyle({
					color: node.cleanOptions.colour.colour,
					alpha: node.cleanOptions.colour.alpha,
					width: node.cleanOptions.width,
					pixelLine: true,
				});
				graphics.setFillStyle({});

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
					pixelLine: true,
				});
				graphics.setFillStyle({
					color: node.fill.colour.colour,
					alpha: node.fill.colour.alpha,
				});

				const parent = state.openGroupsStack.at(-1);
				if (!parent) throw new Error("Failed to get parent");

				if (!node.mask) {
					parent.container.addChild(graphics);
				}

				const geomerty = map.data.geometry[geomertyId];

				if (geomerty.polygons.length >= 1) {
					for (const polygon of geomerty.polygons) {
						for (const inner of polygon) {
							for (let idx = 0; idx < inner.length; idx++) {
								const element = inner[idx];

								if (idx === 0) {
									graphics.moveTo(element[0], element[1]);
								} else {
									graphics.lineTo(element[0], element[1]);
								}
							}

							if (node.fill.visible) graphics.fill();
							if (node.stroke.visible) graphics.stroke();
						}
					}
				}

				if (node.mask) {
					parent.container.setMask({
						inverse: true,
						mask: graphics,
					});
				}

				break;
			}
			case "ASSET_GROUP":
		}

		state.popOpenGroup(node.id);
	}

	return {
		map: root,
		bgColor,
	};
};
