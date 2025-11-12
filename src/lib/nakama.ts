import { Client, Match, Session, type Socket } from "@heroiclabs/nakama-js";

export class Nakama extends EventTarget {
	static INSTANCE: Nakama | null = null;
	static get() {
		if (!Nakama.INSTANCE) {
			Nakama.INSTANCE = new Nakama();
		}

		return Nakama.INSTANCE;
	}

	private client: Client;
	public _loading = false;
	private _session: Session | null = null;
	private _socket: Socket | null = null;

	public match: Match | null = null;

	public useSSL = false;

	private constructor() {
		super();
		this.client = new Client(
			import.meta.env.VITE_NAKAMA_SERVER_KEY,
			import.meta.env.VITE_NAKAMA_SERVER_HOST,
			import.meta.env.VITE_NAKAMA_SERVER_PORT,
			this.useSSL,
		);
	}

	async init() {
		this._socket = this.client.createSocket(this.useSSL);
		await this._socket.connect(this.session, true);
	}

	async login(username: string) {
		let id = localStorage.getItem("deviceId");
		if (!id) {
			id = crypto.randomUUID();
			localStorage.setItem("deviceId", id);
		}

		this._session = await this.client.authenticateDevice(id, true, username);

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
				this._session = await this.client.sessionRefresh(session);
				localStorage.setItem(
					"auth",
					JSON.stringify({
						token: this._session.token,
						refreshToken: this._session.refresh_token,
					}),
				);
			} catch (error) {
				localStorage.removeItem("token");
				localStorage.removeItem("refresh-token");
				console.error(error);
			}

			return false;
		}

		this._session = session;
		return true;
	}
}
