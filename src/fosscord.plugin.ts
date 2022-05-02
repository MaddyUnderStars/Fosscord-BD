//META{"name":"FosscordBD"}*//

import Plugin from "./types/Plugin";
import Instance from "./types/Instance";
import ClientSettings from "./types/ClientSettings";
import GatewayPayload from "./types/GatewayPayload";

import User from "./types/User";
import Guild from "./types/Guild";

enum GatewayOpcode {
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

const Log = {
	msg: (...args: any[]) => {
		console.log("[Fosscord]", ...args);
	},
	warn: (...args: any[]) => {
		console.warn("[Fosscord]", ...args);
	},
	error: (...args: any[]) => {
		console.error("[Fosscord]", ...args);
	}
};

class ClientEvent extends Event {
	data?: any;
	constructor(type: string, props: any) {
		super(type);
		this.data = props;
	}
}

class Client extends EventTarget {
	constructor() {
		super();
	}

	#socket?: WebSocket;
	#instance?: Instance = {};
	#heartbeat?: any;
	#sequence: number = -1;

	get instance() {
		return this.#instance;
	}

	// TODO: Store this better
	user?: User;
	guilds?: Guild[];

	#gatewayHandlers: { [key: number]: any; } = {
		[GatewayOpcode.Dispatch]: (payload: GatewayPayload) => {
			this.#sequence = payload.s!;	//Always present for dispatch

			const handler = this.#dispatchHandlers[payload.t!];
			if (!handler) {
				Log.warn(`No handler for dispatch ${payload.t}`);
				return;
			}

			return handler(payload);
		},
		[GatewayOpcode.Hello]: (payload: GatewayPayload) => this.#setHeartbeat(payload.d.heartbeat_interval),
		[GatewayOpcode.HeartbeatAck]: () => {}
	};

	#dispatchHandlers: { [key: string]: any; } = {
		"READY": (payload: GatewayPayload) => {
			this.user = payload.d.user as User;;
			this.guilds = payload.d.guilds as Guild[];

			this.dispatchEvent(new Event("ready"));
		},
		"MESSAGE_CREATE": (payload: GatewayPayload) => {
			this.dispatchEvent(new ClientEvent("messageCreate", payload.d));
		}
	};

	#send = (data: GatewayPayload): void => {
		if (this.#socket?.readyState !== WebSocket.OPEN) {
			Log.error("Attempted to send data to closed socket");
			return;
		}

		this.#socket?.send(JSON.stringify(data));
	};

	#identify = () => {
		this.#send({
			op: GatewayOpcode.Identify,
			d: {
				token: this.#instance?.token,
				capabilities: 125,
				compress: false,
			}
		});
	};

	#setHeartbeat = (interval: number) => {
		if (this.#heartbeat) clearInterval(this.#heartbeat);

		Log.msg(`set heartbeat interval to ${interval}`);
		this.#heartbeat = setInterval(() => {
			this.#send({
				op: GatewayOpcode.Heartbeat,
				d: this.#sequence >= 0 ? this.#sequence : null,
			});
		}, interval);
	};

	#loginApi = async (): Promise<boolean> => {
		// TODO: implement logging in through API
		// Do not save username/password in config

		return false;
	};

	#loginGateway = () => {
		this.#socket = new WebSocket(this.#instance!.gatewayUrl!);

		this.#socket.addEventListener("open", (e) => {
			Log.msg(`I have connected to gateway ( ${this.#instance?.gatewayUrl} )`);

			this.#identify();
		});

		this.#socket.addEventListener("message", this.#handleGatewayMessage);

		this.#socket.addEventListener("close", () => {
			clearInterval(this.#heartbeat);
			Log.msg(`Disconnected from gateway ( ${this.#instance?.gatewayUrl} )`);
			this.dispatchEvent(new Event("close"));
		});
	};

	#handleGatewayMessage = (e: MessageEvent) => {
		const payload: GatewayPayload = JSON.parse(e.data);
		// only log the first few
		if (this.#sequence < 0)
			Log.msg(`Recieved from gateway ( ${this.#instance?.gatewayUrl} )`, payload.op);

		const handler = this.#gatewayHandlers[payload.op];
		if (!handler) {
			Log.msg(`No handler for opcode`);
			return;
		}

		handler(payload);
	};

	start = async (instance: Instance): Promise<boolean> => {
		this.#instance = instance;

		if (!this.#instance.gatewayUrl) {
			Log.error("Cannot login without gateway endpoint");
			return false;
		}

		if (!this.#instance.token) {
			if (!this.#instance.apiUrl ||
				!this.#instance.username ||
				!this.#instance.password) {
				Log.error("Cannot login through API without api endpoint, username and password");
				return false;
			}

			return await this.#loginApi();
		}

		this.#loginGateway();
		return true;
	};

	stop = () => {
		this.#socket?.close();
	};
}

class FosscordBD implements Plugin {
	getName = () => "Fosscord-BD";
	getDescription = () => "Allows connections to Fosscord instances";
	getVersion = () => "1.0.0";
	getAuthor = () => "MaddyUnderStars";

	settings?: ClientSettings;
	clients?: Client[] = [];

	loadClientSettings = () => {
		this.settings = {
			instances: BdApi.loadData("fosscord", "instances"),
		};
	};

	start = async () => {
        if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing",`The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
        ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "LINK_TO_RAW_CODE");

		this.loadClientSettings();

		// Start our clients
		for (var instance of this.settings!.instances) {
			Log.msg(`Attempting ${instance.gatewayUrl}`);
			const client = new Client();
			client.addEventListener("ready", (e: Event) => {
				Log.msg(`Ready on ${client.instance?.gatewayUrl} as ${client.user!.username}`);

				// TODO: Spoof GuildStore, UserStore, etc to also fetch our custom data?
				// -> Briefly tested in console, client still tried to send request to discord.com?
				
				// TODO: Forward specific events ( message create, guild create, etc ) to client Dispatcher
				// ZLibrary.DiscordModules.Dispatcher.dispatch({  })
			});

			client.addEventListener("messageCreate", (e: ClientEvent) => {
				Log.msg(e.data);
			})

			client.start(instance);
			this.clients!.push(client);
		}

	};

	stop = async () => {
		for (var i = 0; i < this.clients!.length; i++) {
			const client = this.clients![i];
			client.stop();
		}
	};
}