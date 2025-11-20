import { Engine } from "@/lib/engine";
import { useEffect, useRef } from "react";

export const ApplicationWindow: React.FC<{ className?: string }> = ({
	className,
}) => {
	const container = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const engine = useRef<Engine | null>(null);
	if (engine.current === null) {
		engine.current = new Engine();
	}

	useEffect(() => {
		engine.current?.mount(canvas.current, container.current);
		return () => {
			engine.current?.unmount();
		};
	}, []);

	return (
		<div ref={container} className={className}>
			<canvas ref={canvas} className="h-full w-full bg-black" />
		</div>
	);
};
