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
	#heartbeat?: NodeJS.Timer;
	sequence: number = -1;
	#reconnectAttempt = 0;

	user?: User;
	guilds: Collection<Guild> = new Collection<Guild>();
	channels: Collection<Channel> = new Collection<Channel>();

	constructor() {
		super();
	}

	#_log = (type: string, ...value: any[]) => {
		const levels = [
			"log",
			"warn",
			"error",
		];

		const enabledLevel = settings.get("loggingLevel", "error");
		if (enabledLevel == "none" ||
			levels.indexOf(type) < levels.indexOf(enabledLevel))
			return;

		//@ts-ignore
		return logger[type](
			`[ ${this.instance?.info ?
				this.instance.info.name :
				new URL(this.instance!.apiUrl!).host} ]`,
			...value
		);
	};
	log = (...value: any[]) => this.#_log("log", ...value);
	warn = (...value: any[]) => this.#_log("warn", ...value);
	error = (...value: any[]) => this.#_log("error", ...value);

	login = async (instance: Instance) => {
		this.instance = instance;
		if (!this.instance.token) {
			// TODO: Login with username/password?

			throw new Error("Cannot login without token");
		}

		if (!this.instance.gatewayUrl) {
			if (!this.instance.apiUrl) {
				throw new Error("Cannot fetch gateway URL without API URL");
			}

			const response = await HttpClient.send(this, "GET", `${this.instance.apiUrl}/gateway/bot`);
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
			// This PR isn't merged on fosscord/fosscord-server but I don't care!
			// Get instance info from /ping route

			let body;
			try {
				body = (await HttpClient.send(this, "GET", `${this.instance.apiUrl}/ping`)).body;
			}
			catch (e) { }

			if (body?.instance) {
				this.instance.info = body.instance;
			}
		}

		// is there an API method to get this?
		this.instance.cdnUrl = "https://" + new URL(this.instance.gatewayUrl!).host;

		this.#socket = new WebSocket(this.instance.gatewayUrl!);

		this.#socket.addEventListener("open", (e) => {
			this.log(`Connected to gateway`);

			this.#reconnectAttempt = 0;

			this.#identity();
		});

		this.#socket.addEventListener("message", this.#handleGatewayMessage);

		this.#socket.addEventListener("close", () => {
			clearInterval(this.#heartbeat);
			this.log(`Disconnected from gateway`);
			this.dispatchEvent(new ClientEvent("close"));

			if (this.#reconnectAttempt > 5) return;
			this.log(`Attempting reconnection`);
			this.#reconnectAttempt++;
			this.login(instance);
		});
	};

	#handleGatewayMessage = (e: MessageEvent) => {
		const payload: GatewayPayload = recursiveDelete(JSON.parse(e.data));
		if (this.sequence < 0)
			this.log(`Received from gateway`, payload.op);

		const handler = OpcodeHandlers[payload.op];
		if (!handler) {
			this.warn(`No handler for opcode ${payload.op}`);
			return;
		}

		handler.call(this, payload);
	};

	#identity = () => {
		this.#send({
			op: GatewayOpcode.Identify,
			d: {
				token: this.instance?.token,
			}
		});
	};

	setHeartbeat = (interval: number) => {
		if (this.#heartbeat) clearInterval(this.#heartbeat);

		this.log(`set heartbeat interval to ${interval}`);
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
			return;
		}

		this.#socket?.send(JSON.stringify(data));
	};

	stop = () => {
		if (this.#socket) this.#socket.close();
		if (this.#heartbeat) clearInterval(this.#heartbeat);
		this.#reconnectAttempt = Infinity;
	};
}