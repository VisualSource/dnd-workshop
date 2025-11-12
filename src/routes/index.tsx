import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Nakama } from "@/lib/nakama";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useTransition } from "react";

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
	const navigate = useNavigate();
	const [isPending, transition] = useTransition();

	return (
		<div>
			<Button
				disabled={isPending}
				onClick={() => {
					transition(async () => {
						const nakama = Nakama.get();
						const match = await nakama.socket.createMatch(crypto.randomUUID());
						nakama.match = match;
						await navigate({
							to: "/dm-session/$match-id",
							params: {
								"match-id": match.match_id,
							},
						});
					});
				}}
			>
				Start Session
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
