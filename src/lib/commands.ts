import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const cancelSteamLogin = () => invoke("cancel_steam_login");

export const startSteamLogin = async () => {
	const { promise, resolve, reject } = Promise.withResolvers<unknown>();
	const unlisten = await listen<string>("steam-login", (ev) => {
		console.log(ev);
		resolve(ev.payload);
	});
	try {
		const port = await invoke("start_steam_login");

		const query = new URLSearchParams([
			["openid.ns", "http://specs.openid.net/auth/2.0"],
			["openid.return_to", `http://localhost:${port}`],
			["openid.mode", "checkid_setup"],
			["openid.realm", `http://localhost:${port}`],
			["openid.identity", "http://specs.openid.net/auth/2.0/identifier_select"],
			[
				"openid.claimed_id",
				"http://specs.openid.net/auth/2.0/identifier_select",
			],
		]);

		const window = new WebviewWindow("steam-login", {
			url: `https://steamcommunity.com/openid/login?${query.toString()}`,
			title: "Steam Login",
			devtools: false,
		});
		window.once("tauri://close-requested", () => reject());

		const result = await promise;
		await window.close();

		return result;
	} catch (error) {
		console.error(error);

		return null;
	} finally {
		await cancelSteamLogin();
		unlisten();
	}
};
