import { Client } from "@heroiclabs/nakama-js";
import os from "node:os";
import { createInterface } from "node:readline/promises";
/*
VITE_NAKAMA_SERVER_HOST="127.0.0.1"
VITE_NAKAMA_SERVER_PORT=7350
VITE_NAKAMA_SERVER_KEY="defaultkey"

*/

try {
	const client = new Client(
		process.env.VITE_NAKAMA_SERVER_KEY,
		process.env.VITE_NAKAMA_SERVER_HOST,
		process.env.VITE_NAKAMA_SERVER_PORT,
		false,
	);

	const deviceId = Buffer.from(
		`${os.type()}-${os.arch()}-${os.hostname()}-${os.version()}`,
		"utf8",
	).toString("base64url");
	const session = await client.authenticateDevice(
		deviceId,
		true,
		"DIRECT_DM_TEST_USER",
	);

	const socket = client.createSocket(false);
	await socket.connect(session, true);

	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const userId = await rl.question("Enter UserId> ");
	socket.onchannelmessage = (ev) => {
		console.log(`[${ev.username}|${ev.code}] ${ev.content.msg}`);
	};
	const dm = await socket.joinChat(userId, 2, true, false);

	while (true) {
		const data = await rl.question(">");
		try {
			await socket.writeChatMessage(dm.id, { msg: data, details: "" });
		} catch (error) {
			console.error(error);
		}
	}
} catch (error) {
	if (error instanceof Response) {
		const body = await error.text();
		console.log(body);
	} else if (error instanceof Error) {
		if (!("code" in error && error.code === "ABORT_ERR")) {
			console.error(error);
		}
	} else {
		console.error(error);
	}
}
