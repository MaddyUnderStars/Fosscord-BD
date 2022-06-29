import { logger, settings } from "ittai";
import { Channel } from "../entities/Channel";
import { Guild } from "../entities/Guild";
import Instance from "../entities/Instance";
import User from "../entities/User";
import recursiveDelete from "../util/RecursivelyDelete";
import { Collection, ExtendedSet } from "../util/Structures";
import { HttpClient } from "./HttpClient";
import OpcodeHandlers from "./opcodes";

export interface GatewayPayload {
	op: number;
	d?: any;
	s?: number;
	t?: string;
}

export enum GatewayOpcode {
	Dispatch = 0,
	Heartbeat = 1,
	Identify = 2,
	PresenceUpdate = 3,
	VoiceStateUpdate = 4,
	Resume = 6,
	Reconnect = 7,
	RequestGuildMembers = 8,
	InvalidSession = 9,
	Hello = 10,
	HeartbeatAck = 11,
	LazyRequest = 14,
}

export class ClientEvent extends Event {
	data?: any;
	constructor(type: string, props?: any) {
		super(type);
		this.data = props;
	}
}

export class Client extends EventTarget {
	instance?: Instance;
	controlledIds: ExtendedSet<string> = new ExtendedSet<string>();
	#socket?: WebSocket;
	#heartbeat?: number;
	sequence: number = -1;
	reconnectAttempt = 0;

	user?: User;
	guilds: Collection<Guild> = new Collection<Guild>();
	channels: Collection<Channel> = new Collection<Channel>();

	constructor() {
		super();
	}

	#_log = (type: string, ...value: any[]) => {
		type = type.toLowerCase();
		const levels = [
			"debug",
			"log",
			"warn",
			"error",
		];

		const enabledLevel = settings.get("loggingLevel", "error");
		if (enabledLevel == "none" ||
			levels.indexOf(type) < levels.indexOf(enabledLevel))
			return;

		if (type == "debug") type = "log";

		//@ts-ignore
		return logger[type](
			`[ ${this.instance?.info ?
				this.instance.info.name :
				new URL(this.instance!.apiUrl!).host} ]`,
			...value
		);
	};
	debug = (...value: any[]) => this.#_log("debug", ...value);
	log = (...value: any[]) => this.#_log("log", ...value);
	warn = (...value: any[]) => this.#_log("warn", ...value);
	error = (...value: any[]) => this.#_log("error", ...value);

	login = async (instance: Instance) => {
		this.instance = instance;
		if (!this.instance.token) {
			throw new Error("Cannot login without token");
		}

		if (!this.instance.gatewayUrl) {
			if (!this.instance.apiUrl) {
				throw new Error("Cannot fetch gateway URL without API URL");
			}

			const response = await HttpClient.send({
				client: this,
				method: "GET",
				path: `${this.instance.apiUrl}/gateway/bot`,
			});
			if (!response || !response.body) throw new Error("Could not fetch gatway URL");
			this.instance.gatewayUrl = response.body!.url;
		}


		// We can't connect to insecure protocols because we're in a secure context
		const parsedGateway = new URL(this.instance.gatewayUrl!);
		if (parsedGateway.protocol == "ws:") {
			parsedGateway.protocol = "wss:";
			this.instance.gatewayUrl = parsedGateway.toString();
		}

		if (this.instance.apiUrl) {
			// Get instance info from /ping route

			let body;
			try {
				body = (await HttpClient.send({
					client: this,
					method: "GET",
					path: `${this.instance.apiUrl}/ping`
				})).body;
			}
			catch (e) { }

			if (body?.instance) {
				// Current default value server-side
				if (body.instance.name == "Fosscord Instance")
					body.instance.name = new URL(this.instance.gatewayUrl!).host;

				this.instance.info = body.instance;
			}
		}

		// is there an API method to get this?
		this.instance.cdnUrl = "https://" + new URL(this.instance.gatewayUrl!).host;

		this.#socket = new WebSocket(this.instance.gatewayUrl!);

		this.#socket.addEventListener("open", (e) => {
			this.log(`Connection established`);

			this.#identity();
		});

		this.#socket.addEventListener("message", this.#handleGatewayMessage);

		this.#socket.addEventListener("close", this.#onClose);
	};

	#onClose = (close: CloseEvent) => {
		clearInterval(this.#heartbeat);
		this.log(`Disconnected from gateway ${close.code} : ${close.reason}`);
		this.dispatchEvent(new ClientEvent("close"));

		if (this.reconnectAttempt >= 5) return;
		this.log("Will attempt reconnection");
		setTimeout(() => {
			if (this.reconnectAttempt >= 5) return;	// we stopped while waiting for timeout
			this.log(`Attempting reconnection try ${this.reconnectAttempt}`);
			this.reconnectAttempt++;
			this.login(this.instance!);
		}, 5000);
	};

	#handleGatewayMessage = (e: MessageEvent) => {
		const payload: GatewayPayload = recursiveDelete(JSON.parse(e.data));
		if (this.sequence < 0)
			this.debug(`Received from gateway`, payload.op);

		const handler = OpcodeHandlers[payload.op];
		if (!handler) {
			this.debug(`No handler for opcode ${payload.op}`);
			return;
		}

		handler.call(this, payload);
	};

	#identity = () => {
		this.#send({
			op: GatewayOpcode.Identify,
			d: {
				token: this.instance?.token,
				capabilities: 509,
				compress: false,
				presence: { status: "online", since: 0, activities: [], afk: false },
				// properties: {
				// 	"$os": "Windows",
				// 	"$browser": "test client",
				// 	"$device": "test client",
				// }
			}
		});
	};

	setHeartbeat = (interval: number) => {
		if (this.#heartbeat) clearInterval(this.#heartbeat);

		this.#send({
			op: GatewayOpcode.Heartbeat,
			d: this.sequence >= 0 ? this.sequence : null,
		});

		this.debug(`set heartbeat interval to ${interval}`);
		this.#heartbeat = setInterval(() => {
			this.#send({
				op: GatewayOpcode.Heartbeat,
				d: this.sequence >= 0 ? this.sequence : null,
			});
		}, interval);
	};

	#send = (data: GatewayPayload): void => {
		if (this.#socket?.readyState !== WebSocket.OPEN) {
			this.error(`Attempted to send data to closed socket. OP ${data.op}, S ${data.s}`);
			this.#onClose(new CloseEvent("close"));
			return;
		}

		this.#socket?.send(JSON.stringify(data));
	};

	stop = () => {
		if (this.#socket) this.#socket.close();
		if (this.#heartbeat) clearInterval(this.#heartbeat);
		this.reconnectAttempt = Infinity;
	};

	sendLazyRequest = (guild_id: string, channelId: string, ranges: number[][]) => {
		return this.#send({
			op: GatewayOpcode.LazyRequest,
			d: {
				guild_id,
				channels: { [channelId]: ranges },
				// both typing and activities are unused in fosscord currently
				typing: false,
				activities: false,
			}
		});
	};
}