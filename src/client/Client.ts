import { logger } from "ittai";
import { Channel } from "../entities/Channel";
import { Guild } from "../entities/Guild";
import Instance from "../entities/Instance";
import User from "../entities/User";
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
	#heartbeat?: number;
	sequence: number = -1;

	user?: User;
	guilds: Collection<Guild> = new Collection<Guild>();
	channels: Collection<Channel> = new Collection<Channel>();

	constructor() {
		super();
	}

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

		this.#socket = new WebSocket(this.instance.gatewayUrl!);

		this.#socket.addEventListener("open", (e) => {
			logger.log(`Connected to gateway at ${this.instance?.gatewayUrl}`);

			this.#identity();
		});

		this.#socket.addEventListener("message", this.#handleGatewayMessage);

		this.#socket.addEventListener("close", () => {
			clearInterval(this.#heartbeat);
			logger.log(`Disconnected from gateway ( ${this.instance?.gatewayUrl} )`);
			this.dispatchEvent(new ClientEvent("close"));
		});
	};

	#handleGatewayMessage = (e: MessageEvent) => {
		// Fosscord often sends null/undefined values which the client doesn't enjoy
		const recursiveDelete = (obj: any) => {
			for (let key in obj) {
				if (obj[key] && typeof obj[key] === "object")
					obj[key] = recursiveDelete(obj[key]);

				if (obj[key] == null) delete obj[key];
			}

			return obj;
		};

		const payload: GatewayPayload = recursiveDelete(JSON.parse(e.data));
		if (this.sequence < 0)
			logger.log(`Received from gateway ( ${this.instance?.gatewayUrl} )`, payload.op);

		const handler = OpcodeHandlers[payload.op];
		if (!handler) {
			logger.warn(`No handler for opcode ${payload.op}`);
			return;
		}

		handler.call(this, payload);
	};

	#identity = () => {
		this.#send({
			op: GatewayOpcode.Identify,
			d: {
				token: this.instance?.token,
				// capabilities: 125,
				// compress: false,
			}
		});
	};

	setHeartbeat = (interval: number) => {
		if (this.#heartbeat) clearInterval(this.#heartbeat);

		logger.log(`set heartbeat interval to ${interval}`);
		this.#heartbeat = setInterval(() => {
			this.#send({
				op: GatewayOpcode.Heartbeat,
				d: this.sequence >= 0 ? this.sequence : null,
			});
		}, interval);
	};

	#send = (data: GatewayPayload): void => {
		if (this.#socket?.readyState !== WebSocket.OPEN) {
			logger.error(`Attempted to send data to closed socket. OP ${data.op}, S ${data.s}`);
			return;
		}

		this.#socket?.send(JSON.stringify(data));
	};

	stop = () => {
		if (this.#socket) this.#socket.close();
		if (this.#heartbeat) clearInterval(this.#heartbeat);
	};
}