import { logger, settings, webpack } from "ittai";
import recursiveDelete from "../util/RecursivelyDelete";
import { ExtendedSet } from "../util/Structures";
import { HttpClient } from "./HttpClient";
import OpcodeHandlers from "./opcodes";
import { Collection } from "@discordjs/collection";

const { getSuperProperties } = webpack.findByProps("getSuperProperties");
const { getLocalPresence } = webpack.findByProps("getLocalPresence");
// const capabilities = webpack.findByIndex(604778).default;	// method doesn't exist in Ittai yet

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
	guilds: Collection<string, Guild> = new Collection();
	channels: Collection<string, Channel> = new Collection();
	relationships: Collection<string, Relationship> = new Collection();

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

		if (this.instance.apiUrl && !this.instance.info) {
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
		this.instance.cdnUrl = new URL(this.instance.gatewayUrl!).host;

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
		const presence = getLocalPresence();
		if (presence.activities) {
			for (var activity of presence.activities) {
				// Fosscord doesn't have Spotify integration, and doesn't allow these in IDENTIFY schema
				delete activity.metadata;
				delete activity.sync_id;
				
				activity.flags = "" + activity.flags; // fosscord assumes this is string
			}
		}
		this.#send({
			op: GatewayOpcode.Identify,
			d: {
				token: this.instance?.token,
				capabilities: 509,
				compress: false,
				presence: presence,
				properties: getSuperProperties(),
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
		// if (this.#socket?.readyState !== WebSocket.OPEN) {
		// 	this.error(`Attempted to send data to closed socket. OP ${data.op}, S ${data.s}`);
		// 	// this.#onClose(new CloseEvent("close"));
		// 	return;
		// }

		try {
			this.#socket?.send(JSON.stringify(data));
		}
		catch (e) {
			this.error(`Send failed for ${data.op}`, e);
		}
	};

	stop = () => {
		if (this.#socket) this.#socket.close();
		if (this.#heartbeat) clearInterval(this.#heartbeat);
		this.reconnectAttempt = Infinity;
	};

	#subscribedRanges: { [key: string]: [number, number]; } = {};

	sendLazyRequest = (guild_id: string, channelId: string, ranges: [number, number]) => {
		const subbed = this.#subscribedRanges[channelId];
		if (subbed && subbed[0] == ranges[0] && subbed[1] == ranges[1]) return;
		this.#subscribedRanges[channelId] = ranges;

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

	lastTypingStart = 0;
	typingCooldown = 10 * 1000;	// 10 seconds between each call. same behaviour as discord client
	startTyping = (channelId: string) => {
		if (Date.now() < this.lastTypingStart + this.typingCooldown) return;
		this.lastTypingStart = Date.now()
		HttpClient.send({
			method: "POST",
			path: `${this.instance!.apiUrl}/channels/${channelId}/typing`,
			client: this,
		})
	}
}