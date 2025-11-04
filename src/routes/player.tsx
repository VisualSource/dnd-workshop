import { Application } from "@pixi/react";
import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";

export const Route = createFileRoute("/player")({
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
