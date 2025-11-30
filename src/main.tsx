import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { Nakama } from "./lib/nakama";
import { Toaster } from "./components/ui/sonner";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		nakama: undefined!,
	},
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const queryClient = new QueryClient();
const nakama = Nakama.get();

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} context={{ nakama }} />
			</QueryClientProvider>
			<Toaster />
		</StrictMode>,
	);
}
