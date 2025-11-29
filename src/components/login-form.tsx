import { GalleryVerticalEnd } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionState, useTransition } from "react";
import { Spinner } from "./ui/spinner";
import { useNavigate } from "@tanstack/react-router";
import { Nakama } from "@/lib/nakama";
import { startSteamLogin } from "@/lib/commands";

type FormState = {
	username?: string;
	form?: string;
};

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const navigate = useNavigate();
	const [errors, loginAction, isPending] = useActionState<FormState | null>(
		(async (_: FormState | null, formData: FormData) => {
			const username = formData.get("username")?.toString();
			if (!username) return { username: "Missing username" };
			if (username.length < 3)
				return { username: "Username must be more then 3 characters" };

			try {
				const nakama = Nakama.get();

				await nakama.login(username);
				await nakama.init();

				await navigate({ to: "/" });
			} catch (error) {
				console.error(error);

				return {
					form: Error.isError(error) ? error.message : "Unknown form error",
				};
			}

			return null;
		}) as never,
		null,
	);
	const [steamIsPending, startLogin] = useTransition();

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<form action={loginAction}>
				<FieldGroup>
					<div className="flex flex-col items-center gap-2 text-center">
						<div className="flex flex-col items-center gap-2 font-medium">
							<div className="flex size-8 items-center justify-center rounded-md">
								<GalleryVerticalEnd className="size-6" />
							</div>
							<span className="sr-only">Workshop</span>
						</div>
						<h1 className="text-xl font-bold">Welcome to the Workshop</h1>
					</div>
					<Field>
						<FieldLabel htmlFor="username">Username</FieldLabel>
						<Input
							name="username"
							id="username"
							type="text"
							placeholder="Joe"
							required
						/>
						{errors?.username ? (
							<FieldError>{errors.username}</FieldError>
						) : null}
					</Field>
					<Field>
						<Button disabled={isPending} type="submit">
							{isPending ? <Spinner /> : null} Login
						</Button>
					</Field>
					{errors?.form ? <FieldError>{errors.form}</FieldError> : null}
				</FieldGroup>
			</form>
			<FieldSeparator>Or</FieldSeparator>
			<Field className="grid gap-4">
				<Button
					disabled={steamIsPending}
					onClick={() =>
						startLogin(async () => {
							try {
								const result = await startSteamLogin();
								if (Error.isError(result)) throw result;
								if (!result) {
									console.log("Canceled");
									return;
								}

								const nakama = Nakama.get();

								const values = Object.entries(result).reduce(
									(prev, curr) => {
										prev[curr[0]] = decodeURIComponent(curr[1]);
										return prev;
									},
									{} as Record<string, string>,
								);

								await nakama.loginSteamWeb(values);
								await navigate({ to: "/" });

							} catch (error) {
								console.error(error);
							}
						})
					}
					variant="outline"
					type="button"
				>
					{steamIsPending ? <Spinner /> : null}
					Continue with Steam
				</Button>
			</Field>
		</div>
	);
}

// https://github.com/vikas5914/steam-auth/blob/master/src/SteamAuth.php
