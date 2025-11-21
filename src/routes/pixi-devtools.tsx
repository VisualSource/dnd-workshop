import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useReducer } from "react";
import { type Event, listen } from "@tauri-apps/api/event";

export const Route = createFileRoute("/pixi-devtools")({
	component: RouteComponent,
});

function RouteComponent() {
	const [state, dispatch] = useReducer((prev) => prev, {});
	const handleEvent = useEffectEvent((ev: Event<{ type: string }>) => {});

	useEffect(() => {
		const event = listen("pixi-devtools", handleEvent);

		return () => {
			event.then((unlisen) => unlisen()).catch((err) => console.error(err));
		};
	}, []);

	return (
		<div className="grid grid-rows-2 w-full h-full">
			<div className="row-span-1"></div>
			<section className="grid grid-cols-2 row-span-1 border-t divide-x">
				<div className="col-span-1"></div>
				<div className="col-span-1"></div>
			</section>
		</div>
	);
}
