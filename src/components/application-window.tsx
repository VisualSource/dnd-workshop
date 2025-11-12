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
		const resizer = new ResizeObserver(() =>
			engine.current?.app?.queueResize(),
		);

		if (container.current) resizer.observe(container.current);
		engine.current?.mount(canvas.current);
		return () => {
			resizer.disconnect();
			engine.current?.unmount();
		};
	}, []);

	return (
		<div ref={container} className={className}>
			<canvas ref={canvas} className="h-full w-full bg-black" />
		</div>
	);
};
