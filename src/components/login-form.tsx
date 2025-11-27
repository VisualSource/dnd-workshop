import { GalleryVerticalEnd } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
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
							onClick={() => {
								startSteamLogin()
							}}
							variant="outline"
							type="button"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<title>apple</title>
								<path
									d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
									fill="currentColor"
								/>
							</svg>
							Continue with Steam
						</Button>
					</Field>
			<FieldDescription className="px-6 text-center">
				By clicking continue, you agree to our <span>Terms of Service</span> and{" "}
				<span>Privacy Policy</span>.
			</FieldDescription>
		</div>
	);
}


	// https://github.com/vikas5914/steam-auth/blob/master/src/SteamAuth.php