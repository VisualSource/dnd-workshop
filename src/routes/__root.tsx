import type { Nakama } from "@/lib/nakama";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface RouterContext {
	nakama: Nakama;
}

const RootLayout = () => (
	<>
		<Outlet />
		<TanStackRouterDevtools />
	</>
);

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});
