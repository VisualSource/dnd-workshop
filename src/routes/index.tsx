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

			<div className="flex gap-2">
				<CurrentProfile />
			</div>
		</div>
	);
}
