import { Application } from "@pixi/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRef } from "react";

export const Route = createFileRoute("/player-session/$match-id")({
	beforeLoad({ context }) {
		if (!context.nakama.isAuthenticated()) {
			throw redirect({
				to: "/login",
			})
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const containerRef = useRef(null);

	return (
		<div ref={containerRef} className="h-full w-full">
			<Application resizeTo={containerRef} autoStart sharedTicker />
		</div>
	)
}
