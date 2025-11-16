import * as pixi from "pixi.js";
// https://github.com/pixijs/devtools/blob/main/packages/frontend/src/App.tsx
const chrome = {
	event: new EventTarget(),
	runtime: {
		connect: () => ({
			postMessage: () => {},
			onMessage: {
				addListener: (listener: (message: unknown) => void) => {
					chrome.event.addEventListener("event", listener);
				},
			},
		}),
	},
	devtools: {
		inspectedWindow: {
			tabId: 0,
			eval: (code: string, cb: () => void) => {
				// biome-ignore lint/security/noGlobalEval: devtools only
				eval(code);
				cb();
			},
		},
	},
};

const mockBridge = (code: string): Promise<unknown> => {
	// biome-ignore lint/security/noGlobalEval: devtools only
	eval(code);
	return Promise.resolve();
};

export const initDevtools = (app: pixi.Application) => {
	window.__PIXI_DEVTOOLS__ = {
		pixi: pixi,
		app,
	};
};
