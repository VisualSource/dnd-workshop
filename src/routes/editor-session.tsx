import { Button } from "@/components/ui/button";
import { Application } from "@pixi/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";

export const Route = createFileRoute("/editor-session")({
	component: RouteComponent,
	onLeave: async () => {},
});

function RouteComponent() {
	const containerRef = useRef(null);

	return (
		<div className="flex h-full w-full relative">
			<section className="absolute z-1 bg-background">
				<Button>
					<Link to="/home">Back</Link>
				</Button>
			</section>
			<div ref={containerRef} className="h-full w-full flex flex-1">
				<Application resizeTo={containerRef} autoStart sharedTicker />
			</div>
		</div>
	);
}
