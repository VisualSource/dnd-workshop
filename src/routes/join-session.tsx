import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Nakama } from "@/lib/nakama";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useActionState } from "react";

type FormState = { errors: { code?: string } };

export const Route = createFileRoute("/join-session")({
	component: RouteComponent,
	beforeLoad({ context, location }) {
		if (!context.nakama.isAuthenticated()) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const [state, action, isPending] = useActionState<FormState | null, FormData>(
		async (_preState, formData: FormData) => {
			const matchId = formData.get("joinCode")?.toString();
			if (!matchId) return { errors: { code: "Invalid join code" } };

			try {
				const nakama = Nakama.get();

				const match = await nakama.socket?.joinMatch(matchId);
				nakama.match = match;

				if (!match) {
					return { errors: { code: "There was an error" } };
				}

				await navigate({
					to: "/player-session",
				});

				return null;
			} catch (error) {
				console.error(error);

				return {
					errors: {
						code: Error.isError(error)
							? error.message
							: error && typeof error === "object" && "message" in error
								? (error.message as string)
								: "Unknown Error",
					},
				};
			}
		},
		null,
	);

	return (
		<div className="grid place-items-center h-full relative">
			<Button className="absolute top-0 left-0">
				<Link to="/">Back</Link>
			</Button>

			<form action={action} className="flex p-2 gap-2">
				<Field>
					<Input placeholder="code" name="joinCode" />
					{state?.errors.code ? (
						<FieldError>{state?.errors.code}</FieldError>
					) : null}
				</Field>
				<Button disabled={isPending} type="submit">
					Join
				</Button>
			</form>
		</div>
	);
}
