import { Container, Graphics } from "pixi.js";
import { readZip } from "./zip-reader";
import type { DSFile } from "./types";
import type { UUID } from "node:crypto";

export const parseMapFile = (file: Uint8Array<ArrayBuffer>) => {
	const utf8decoder = new TextDecoder();
	const container = new Container();

	const zip = readZip(file);
	const map = JSON.parse(utf8decoder.decode(zip.map.content)) as DSFile;

	if (map.version !== 1) throw new Error("Unsupported ds file version");

	const doc = map.state.document.nodes[map.state.document.documentNodeId];
	const page = map.state.document.nodes[doc.selectedPage];

	if (page.type !== "PAGE") throw new Error("Was expecting a page node");

	const pageContainer = new Container();
	pageContainer.alpha = page.alpha;
	pageContainer.label = page.name;

	const queue = [...page.children];
	const groupStack: {
		container: Container;
		uuid: UUID;
		end: UUID;
		metadata: {
			geomertyId?: UUID;
		};
	}[] = [];

	const queueChildren = (
		nodeId: UUID,
		children: UUID[],
		metadata: { geomertyId?: UUID } = {},
	) => {
		if (children.length > 1) {
			queue.splice(0, 0, ...children);
			const endUUID = children.at(-1);
			if (!endUUID) throw new Error("Failed to end child uuid");
			groupStack.push({
				container,
				uuid: nodeId,
				end: endUUID,
				metadata,
			});
		}
	};

	while (queue.length !== 0) {
		const uuid = queue.shift();
		if (!uuid) throw new Error("Failed to get item uuid");
		const node = map.state.document.nodes[uuid];

		switch (node.type) {
			case "PAGE":
				throw new Error("TODO");
			case "IMAGES":
				break;
			case "TEMPLATE": {
				const container = new Container({
					label: node.name,
					alpha: node.alpha,
					visible: node.visible,
				});

				queueChildren(node.id, node.children);

				const group = groupStack.at(-1);
				if (group?.uuid === node.parentId) {
					group.container.addChild(container);
				}

				if (group?.end === node.id) {
					groupStack.pop();
				}

				break;
			}
			case "GEOMETRY": {
				const container = new Container({
					label: node.name,
					alpha: node.alpha,
					visible: node.visible,
				});

				queueChildren(node.id, node.children, { geomertyId: node.geometryId });

				const group = groupStack.at(-1);
				if (group?.uuid === node.parentId) {
					group.container.addChild(container);
				}

				if (group?.end === node.id) {
					groupStack.pop();
				}

				break;
			}
			case "FOLDER":
				break;
			case "GRID":
				break;
			case "MULTIPOLYGON": {
				const parent = groupStack.at(-1);
				if (parent?.uuid !== node.parentId)
					throw new Error("Failed to get parent");

				const graphics = new Graphics({
					alpha: node.alpha,
					visible: node.visible,
					label: node.name,
				});

				parent.container.addChild(graphics);

				const geomertyId = parent.metadata.geomertyId;
				if (!geomertyId) throw new Error("Failed to get geomertyId");

				const geomerty = map.data.geometry[geomertyId];
				if (!geomerty) throw new Error("Failed to get geomerty");

				graphics.setStrokeStyle({
					width: node.stroke.width,
					color: node.stroke.colour.colour,
					alpha: node.stroke.colour.alpha,
				});
				graphics.setFillStyle({
					color: node.fill.colour.colour,
					alpha: node.fill.colour.alpha,
				});

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

				if (node.id === parent.end) {
					groupStack.pop();
				}
				break;
			}
			case "ASSET_GROUP":
				break;
		}
	}

	return container;
};
