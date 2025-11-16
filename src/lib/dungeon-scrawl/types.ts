import type { UUID } from "node:crypto";

export type DSFile = {
	version: number;
	state: {
		document: {
			documentNodeId: "document";
			nodes: {
				document: DSDocument;
				[uuid: UUID]:
					| DSNodePage
					| DSNodeImages
					| DSNodeTemplate
					| DSNodeGeometry
					| DSNodeFolder
					| DSNodeGrid
					| DSNodeMultiPolygon
					| DSNodeAssetGroup;
			};
			undoStack: unknown[];
			undoHistoryPaused: boolean;
			undoStackPointer: number;
		};
	};
	data: {
		geometry: Record<
			UUID,
			{
				polygons: [number, number][][][];
				polylines: number[];
			}
		>;
		assets: Record<string, unknown>;
	};
	errors: unknown[];
};

type Color = {
	colour: number;
	alpha: number;
};

type DSDocument = {
	type: "DOCUMENT";
	id: "document";
	name: string;
	selectedPage: UUID;
	children: UUID[];
};

type DSNodePage = {
	type: "PAGE";
	id: UUID;
	parentId: UUID | "document";
	name: string;
	children: UUID[];
	selection: UUID[];
	alpha: number;
	objectSelection: unknown[];
	pageTransform: string;
	templateLocked: boolean;
	grid: {
		type: "square";
		cellDiameter: number;
		variant: "lines";
		visible: boolean;
		dotsOptions: {
			radius: number;
		};
		linesOptions: {
			width: number;
		};
		sharedOptions: {
			colour: Color;
		};
	};
	background: {
		colour: Color;
	};
	lighting: {
		enabled: boolean;
		ambientLight: Color;
		blur: number;
	};
	texture: {
		enabled: boolean;
		scale: number;
		alpha: number;
	};
};

type DSNodeImages = {
	type: "IMAGES";
	id: UUID;
	alpha: number;
	parentId: UUID;
	name: string;
	visible: boolean;
	children: UUID[];
};

type DSNodeTemplate = {
	type: "TEMPLATE";
	id: UUID;
	alpha: number;
	parentId: UUID;
	name: string;
	visible: boolean;
	children: UUID[];
	template: {
		type: "CLASSIC";
		dungeonShape: UUID;
		floor: UUID;
		grid: UUID;
		walls: UUID;
	};
};

type DSNodeGeometry = {
	type: "GEOMETRY";
	id: UUID;
	alpha: number;
	parentId: UUID;
	name: string;
	visible: boolean;
	children: UUID[];
	backgroundEffect: Record<string, unknown>;
	geometryId: UUID;
};

type DSNodeFolder = {
	type: "FOLDER";
	id: UUID;
	alpha: number;
	parentId: UUID;
	name: string;
	visible: boolean;
	children: UUID[];
};

type DSNodeGrid = {
	type: "GRID";
	id: UUID;
	alpha: number;
	name: string;
	parentId: UUID;
	visible: boolean;
	gridType: "square";
	variant: "clean";
	cleanOptions: {
		width: number;
		colour: Color;
	};
	roughOptions: {
		width: number;
		colour: Color;
		roughness: {
			segmentSizeMin: number;
			segmentSizeMax: number;
			segmentSkipScale: number;
			noDotRate: number;
			scribbleScale: number;
			scribbleAmplitude: number;
			shiftRate: number;
			shiftAmountMin: number;
			shiftAmountMax: number;
			majorNoiseScale: number;
			majorNoiseAmplitude: number;
			majorNoiseShift: number;
		};
	};
	dotsOptions: {
		radius: number;
		colour: Color;
	};
};

type DSNodeMultiPolygon = {
	type: "MULTIPOLYGON";
	id: UUID;
	alpha: number;
	name: string;
	parentId: UUID;
	mask: boolean;
	visible: boolean;
	blendMode: string;
	stroke: {
		visible: boolean;
		width: number;
		colour: Color;
		roughOptions: string;
	};
	fill: {
		visible: boolean;
		colour: Color;
	};
};

type DSNodeAssetGroup = {
	type: "ASSET_GROUP";
	id: UUID;
	alpha: number;
	name: string;
	parentId: UUID;
	children: UUID[];
	visible: boolean;
	transform: number[];
};
