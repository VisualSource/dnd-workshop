import type { ChannelMessage } from "@heroiclabs/nakama-js";

export class NakamaMessage extends Event {
	constructor(private data: ChannelMessage) {
		super("nakama-message");
	}

	get username() {
		return this.data.username as string;
	}

	get content() {
		return this.data.content as { msg: string };
	}

	get channelId() {
		return this.data.channel_id as string;
	}

	get messageId() {
		return this.data.message_id as string;
	}
}
