import type { Nakama } from "@/lib/nakama";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";
interface RouterContext {
	nakama: Nakama;
}

const RootLayout = () => (
	<>
		<Outlet />
		<TanStackRouterDevtools position="top-right" />
	</>
);

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
	onEnter() {
		if (import.meta.env.DEV) return;
		check()
			.then((update) => {
				if (!update) return;
				toast(`Update avaiable`, {
					description: `${update.date} | Update ${update.version}`,
					action: {
						label: "Update",
						onClick: () => {
							toast.promise(
								() =>
									update.downloadAndInstall((progress) => {
										console.log(progress);
									}),
								{
									loading: "Downloading Update",
									error: (err) => ({
										message: "Update failed",
										description: Error.isError(err) ? err.message : err,
									}),
									success: {
										message: "Update ready",
										description: "Restart to apply update",
										action: {
											label: "Restart",
											onClick: () => relaunch(),
										},
									},
								},
							);
						},
					},
				});
			})
			.catch((err) => console.error(err));

		console.log("Enter");
	},
});
