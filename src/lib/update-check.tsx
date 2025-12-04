import { error } from "@tauri-apps/plugin-log";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "react-toastify";
import { Toast, ToastAction, type ToastData } from "@/components/ui/toast";

export const checkforUpdate = async () => {
	if (import.meta.env.DEV) return;
	try {
		const result = await check();
		if (!result) return;

		const id = toast.info<ToastData>(<Toast />, {
			data: {
				title: "Update avaiable",
				description: `Update ${result.version}`,
				action: (
					<ToastAction
						onClick={() => {
							toast.update(id, {
								isLoading: true,
								progress: 0,
								closeButton: false,
								type: "default",
								render: "Starting Update",
							});
							let contentLength = 0;
							let progress = 0;

							result
								.downloadAndInstall((ev) => {
									switch (ev.event) {
										case "Started":
											contentLength = ev.data.contentLength ?? 0;
											toast.update(id, { render: "Updating..." });
											break;
										case "Progress": {
											progress += ev.data.chunkLength ?? 0;

											toast.update(id, {
												progress: progress / contentLength,
											});

											break;
										}
										case "Finished": {
											toast.update(id, {
												render: <Toast />,
												autoClose: 5000,
												closeButton: true,
												data: {
													title: "Update finished",
													description: "Restart to finish",
													action: (
														<ToastAction onClick={() => relaunch()}>
															Restart
														</ToastAction>
													),
												},
											});
											break;
										}
									}
								})
								.catch((err) => {
									error(err, { file: "file-check", line: 31 });
									console.error(err);
									toast.update(id, {
										render: <Toast />,
										autoClose: 5000,
										closeButton: true,
										data: {
											title: "Update Failed",
											description: err?.message ?? "Unknown Error",
										},
									});
								});
						}}
					>
						Update
					</ToastAction>
				),
			},
		});
	} catch (err) {
		const message = Error.isError(err) ? err.message : JSON.stringify(err);
		console.error(err);
		error(message, { file: "update-check", line: 10 });
	}
};
