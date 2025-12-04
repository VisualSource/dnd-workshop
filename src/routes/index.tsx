import { CurrentProfile } from "@/components/current-profile";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Nakama } from "@/lib/nakama";
import type { NakamaMessage } from "@/lib/nakama-events";

import Markdown from "react-markdown";

import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
	Send,
	Settings,
	Settings2,
	Sparkles,
} from "lucide-react";

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
		<div className="flex flex-col h-full p-4">
			<header className="flex justify-end"></header>
			<main className="h-full grow flex flex-col w-full gap-2 justify-center items-center">
				<div className="aspect-square min-w-12 min-h-12 flex items-center justify-center">
					<img
						src="/images/Square310x310Logo.png"
						alt="application logo"
						className="h-full w-full"
					/>
				</div>

				<div className="flex flex-col gap-2 max-w-52 w-48">
					<Button asChild className="w-full">
						<Link to="/join-session">Join Session</Link>
					</Button>
					<Button
						variant="secondary"
						disabled={isPending}
						onClick={() => {
							transition(async () => {
								const nakama = Nakama.get();
								const match = await nakama.socket.createMatch(
									crypto.randomUUID(),
								);
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

					<Button variant="secondary" asChild>
						<Link to="/editor-session">Editor</Link>
					</Button>
				</div>
			</main>

			<footer className="flex gap-2 items-center">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex gap-2 items-center shadow bg-secondary rounded p-2 max-w-52 hover:bg-accent/55 cursor-pointer"
						>
							<CurrentProfile />
							<ChevronsUpDown className="ml-auto size-4" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) max-w-52 rounded-lg"
						align="start"
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<CurrentProfile />
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />

						<DropdownMenuGroup>
							<DropdownMenuItem className="cursor-pointer">
								<Send />
								Feadback
							</DropdownMenuItem>
							<DropdownMenuItem className="cursor-pointer">
								<Settings />
								Settings
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem className="cursor-pointer">
								<LogOut />
								Logout
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<div className="ml-auto">
					<Button size="icon-sm">
						<Bell />
					</Button>
				</div>
			</footer>
		</div>
	);
}


/*
	const [messages, setMessages] = useState<
		{ msgId: string; msg: string; username: string }[]
	>([]);
	const [channelId, setChannelId] = useState<string | null>(null);

	useEffect(() => {
		const nakama = Nakama.get();
		const controller = new AbortController();

		nakama
			.joinDirectChat("307d8faa-a6f0-4408-a8fe-bd07d4f29584")
			.then((channel) => {
				if (controller.signal.aborted) return;
				setChannelId(channel.id);
				nakama.listChannelMessages(channel.id).then((messages) => {
					if (controller.signal.aborted) return;
					setMessages(
						messages.messages?.map(
							(e) =>
								({
									msgId: e.message_id,
									username: e.username,
									msg: (e.content as { msg: string }).msg,
								}) as never,
						) ?? [],
					);
				});
			});

		return () => {
			controller.abort();
		};
	}, []);

	useEffect(() => {
		const nakama = Nakama.get();

		const callback = (ev: NakamaMessage) => {
			setMessages((old) => [
				...old,
				{ msgId: ev.messageId, msg: ev.content.msg, username: ev.username },
			]);
		};
		nakama.addEventListener("nakama-message", callback as never);

		return () => {
			nakama.removeEventListener("nakama-message", callback as never);
		};
	}, []);


		<Drawer>
				<DrawerTrigger asChild>
					<Button>Messages</Button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Messages</DrawerTitle>
					</DrawerHeader>
					<div>
						<div className="max-h-72 overflow-y-auto">
							{}
							{messages.map((e) => (
								<div key={e.msgId} className="flex gap-2">
									<div>{e.username}</div>
									<Markdown>{e.msg}</Markdown>
								</div>
							))}
						</div>

						<form
							action={(data) => {
								const message = data.get("message")?.toString();
								if (!message) return;

								const nakama = Nakama.get();

								if (!channelId) return;
								nakama.socket
									.writeChatMessage(channelId, { msg: message })
									.catch((e) => {
										console.error(e);
									});
							}}
							className="flex gap-2"
						>
							<Input name="message" />
							<Button type="submit">Send</Button>
						</form>
					</div>
				</DrawerContent>
			</Drawer>

*/