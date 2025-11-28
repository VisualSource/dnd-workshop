import { invoke } from "@tauri-apps/api/core";
import { once, type UnlistenFn } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const cancelSteamLogin = () => invoke("cancel_steam_login");

export const startSteamLogin = async () => {
	const { promise, resolve } = Promise.withResolvers<Record<
		string,
		string
	> | null>();

	let unlisten: UnlistenFn | undefined;
	let win: WebviewWindow | undefined;
	try {
		const port = await invoke<number>("start_steam_login");

		const query = new URLSearchParams({
			"openid.ns": "http://specs.openid.net/auth/2.0",
			"openid.return_to": `http://localhost:${port}`,
			"openid.mode": "checkid_setup",
			"openid.realm": `http://localhost:${port}`,
			"openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
			"openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
		});

		unlisten = await once<Record<string, string>>("steam-login", (ev) =>
			resolve(ev.payload),
		);
		win = new WebviewWindow("steam-login", {
			url: `https://steamcommunity.com/openid/login?${query.toString()}`,
			devtools: false,
			title: "Steam Login",
		});
		win.once("tauri://close-requested", () => resolve(null));

		const result = await promise;
		return result;
	} catch (error) {
		return new Error("steam login failed", { cause: error });
	} finally {
		await cancelSteamLogin();
		unlisten?.();
		await win?.destroy();
	}
};