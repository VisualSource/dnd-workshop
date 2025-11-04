import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/home")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<Button asChild>
				<Link to="/create-session">Create Session</Link>
			</Button>
			<Button asChild>
				<Link to="/join-session">Join Session</Link>
			</Button>
			<Button asChild>
				<Link to="/editor-session">Editor</Link>
			</Button>
		</div>
	);
}
