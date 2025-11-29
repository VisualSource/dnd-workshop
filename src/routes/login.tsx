import { LoginForm } from "@/components/login-form";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
	async beforeLoad({ context }) {
		if (context.nakama.isAuthenticated()) {
			throw redirect({
				to: "/",
			});
		}

		const didRestore = await context.nakama.restore();
		if (didRestore) {
			throw redirect({
				to: "/",
			});
		}
	},
});

function RouteComponent() {
	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<LoginForm />
			</div>
		</div>
	);
}
