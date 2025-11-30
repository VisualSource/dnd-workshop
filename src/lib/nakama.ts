import {
	Client,
	type Match,
	Session,
	type Socket,
} from "@heroiclabs/nakama-js";
import { NakamaMessage } from "./nakama-events";

export class Nakama extends EventTarget {
		static INSTANCE: Nakama | null = null;
		static get() {
			if (!Nakama.INSTANCE) {
				Nakama.INSTANCE = new Nakama();
			}

			return Nakama.INSTANCE;
		}

		private _client: Client;
		public _loading = false;
		private _session: Session | null = null;
		private _socket: Socket | null = null;

		public match: Match | null = null;

		public useSSL = false;

		private constructor() {
			super();
			this._client = new Client(
				import.meta.env.VITE_NAKAMA_SERVER_KEY,
				import.meta.env.VITE_NAKAMA_SERVER_HOST,
				import.meta.env.VITE_NAKAMA_SERVER_PORT,
				this.useSSL,
			);
		}

		async getAccount() {
			const user = await this._client.getAccount(this.session);

			return user;
		}

		async getUsers(ids: string[]) {
			const users = await this._client.getUsers(this.session, ids);
			return users;
		}

		async init() {
			this._socket = this._client.createSocket(this.useSSL);

			this._socket.onchannelmessage = (ev) => {
				this.dispatchEvent(new NakamaMessage(ev));
			};

			await this._socket.connect(this.session, true);
		}

		async listChannelMessages(channelId: string, cusror?: string) {
			const forward = cusror === undefined ? undefined : true;
			const messages = await this._client.listChannelMessages(
				this.session,
				channelId,
				10,
				forward,
				cusror,
			);
			return messages;
		}

		async joinDirectChat(targetUserId: string) {
			const result = await this.socket.joinChat(targetUserId, 2, true, false);
			return result;
		}

		async sendMessage(channelId: string, content: string) {
			const result = await this.socket.writeChatMessage(channelId, content);

			return result;
		}

		async loginSteamWeb(params: Record<string, string>) {
			this._session = await this._client.authenticateCustom(
				"steam_web",
				true,
				undefined,
				params,
			);

			localStorage.setItem(
				"auth",
				JSON.stringify({
					token: this._session.token,
					refreshToken: this._session.refresh_token,
				}),
			);
		}

		async login(username: string) {
			let id = localStorage.getItem("deviceId");
			if (!id) {
				id = crypto.randomUUID();
				localStorage.setItem("deviceId", id);
			}

			this._session = await this._client.authenticateDevice(id, true, username);

			localStorage.setItem(
				"auth",
				JSON.stringify({
					token: this._session.token,
					refreshToken: this._session.refresh_token,
				}),
			);
		}

		public isAuthenticated() {
			return this._session !== null;
		}

		public get session() {
			if (!this._session) throw new Error("no session");
			return this._session;
		}

		public get socket() {
			if (!this._socket) throw new Error("No socket");

			return this._socket;
		}

		public get client() {
			return this._client;
		}

		public async restore() {
			const auth = localStorage.getItem("auth");

			if (!auth) {
				return false;
			}

			const { token, refreshToken } = JSON.parse(auth) as {
				token: string;
				refreshToken: string;
			};

			const session = new Session(token, refreshToken, false);

			if (session.isexpired(Date.now() + 1)) {
				try {
					this._session = await this._client.sessionRefresh(session);
					localStorage.setItem(
						"auth",
						JSON.stringify({
							token: this._session.token,
							refreshToken: this._session.refresh_token,
						}),
					);

					return true;
				} catch (error) {
					localStorage.removeItem("auth");
					console.error(error);
				}

				return false;
			}

			this._session = session;
			return true;
		}
	}
