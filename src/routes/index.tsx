import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: RouteComponent,
	pendingComponent: PendingComponent,
	beforeLoad: async ({ context, location }) => {
		if (context.nakama.isAuthenticated()) {
			return;
		}

		const didRestore = await context.nakama.restore();
		if (!didRestore) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}

		await context.nakama.init();
	},
});

function PendingComponent() {
	return (
		<div>
			<Spinner />
		</div>
	);
}

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
