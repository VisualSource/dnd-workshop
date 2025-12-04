import type { Nakama } from "@/lib/nakama";
import { checkforUpdate } from "@/lib/update-check";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

interface RouterContext {
	nakama: Nakama;
}

const RootLayout = () => (
	<>
		<Outlet />
	</>
);

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
	onEnter() {
		checkforUpdate();
	},
});
