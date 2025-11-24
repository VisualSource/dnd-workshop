import { ApplicationWindow } from "@/components/application-window";
import { AppSidebar } from "@/components/dm/app-sidebar";
import { NavActions } from "@/components/dm/nav-actions";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { createFileRoute, redirect, useBlocker } from "@tanstack/react-router";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";

export const Route = createFileRoute("/dm-session/$match-id")({
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
	component: RouteComponent,
	onLeave: async ({ context }) => {
		const matchId = context.nakama.match?.match_id;

		if (!matchId) return;

		await context.nakama.socket.leaveMatch(matchId);
		context.nakama.match = null;
	},
});

function RouteComponent() {
	useBlocker({
		shouldBlockFn: async () => {
			const result = await confirm(
				"Are you sure? This action will end the session",
				{ kind: "warning", title: "End Session" },
			);
			return !result;
		},
	});

	const onTransitionEnd = useCallback(() => {
		window.dispatchEvent(new Event("workshopt::pixi-resize"));
	}, []);

	return (
		<SidebarProvider onTransitionEnd={onTransitionEnd}>
			<AppSidebar />
			<SidebarInset className="dm-sidebar-content overflow-hidden @container">
				<header className="flex row-start-1 row-end-1 items-center">
					<div className="flex flex-1 items-center gap-2 px-3">
						<SidebarTrigger />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbPage className="line-clamp-1">
										Project Management & Task Tracking
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<div className="ml-auto px-3">
						<NavActions />
					</div>
				</header>
				<ApplicationWindow className="h-full w-full row-start-2 row-end-2 bg-amber-200 overflow-hidden" />
			</SidebarInset>
		</SidebarProvider>
	);
}

// h-14 shrink-0
