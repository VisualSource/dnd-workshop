import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/join-session")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<Button>
				<Link to="/home">Back</Link>
			</Button>
		</div>
	);
}
