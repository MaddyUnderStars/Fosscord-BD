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
	constructor(type: string, props?: any) {
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
			if (handler) {
				handler(payload);
			}

			this.dispatchEvent(new ClientEvent(payload.t as string, payload.d));
		},
		[GatewayOpcode.Hello]: (payload: GatewayPayload) => this.#setHeartbeat(payload.d.heartbeat_interval),
		[GatewayOpcode.HeartbeatAck]: () => { }
	};

	#dispatchHandlers: { [key: string]: any; } = {
		"READY": (payload: GatewayPayload) => {
			this.user = payload.d.user as User;;
			this.guilds = payload.d.guilds as Guild[];
		},
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
				// capabilities: 125,
				// compress: false,
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
			this.dispatchEvent(new ClientEvent("close"));
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

	// Dispatch fake guild information
	makeGuild = (guild: Guild, client: Client) => {
		// TODO: It seems dispatching channels is not enough to render them.

		// for (var channel of guild.channels) {
		// 	channel = {
		// 		...channel,

		// 		rawRecipients: [],

		// 		getGuildId: () => guild.id,
		// 		isGuildStageVoice: () => false,
		// 		isPrivate: () => false,
		// 		isOwner: () => true,
		// 	};
		// }

		ZLibrary.DiscordModules.Dispatcher.dispatch({
			type: "GUILD_CREATE", guild: {
				...guild,
				channels: [],
				members: [],
				presences: [],
				embedded_activities: [],
				emoji: [],
			}
		});

		// for (var channel of guild.channels) {
		// 	ZLibrary.DiscordModules.Dispatcher.dispatch({
		// 		type: "CHANNEL_CREATE",
		// 		// guildHashes: {},
		// 		channel: {
		// 			...channel,
		// 			rawRecipients: [],
		// 			getGuildId: () => guild.id,
		// 			isGuildStageVoice: () => false,
		// 			isPrivate: () => false,
		// 			isOwner: () => true,
		// 			toJS: () => channel,	//what is this function?
		// 		}
		// 	});
		// }
	};

	start = async () => {
		if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing", `The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
		ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "LINK_TO_RAW_CODE");

		this.loadClientSettings();
		
		ZLibrary.Patcher.before("fosscord", ZLibrary.DiscordModules.Dispatcher, "dispatch", (thisObject: any, args: any[] | undefined, retVal: any) => {
			if (!args) return;
			const [event] = args;
			
			// Prevent this method for 'fake' guilds allows us to view them
			if (event.type === "GUILD_SUBSCRIPTIONS_FLUSH") {
				if (this.clients!.find((c: Client) => c.guilds!.find((g: Guild) => g.id == event.guildId))) {
					Log.msg(`Preventing GUILD_SUBSCRIPTIONS_FLUSH for ${event.guildId}`);
					args[0] = undefined; // TODO: this isn't how you do this properly
				}
			}
		});

		// Start our clients
		for (var instance of this.settings!.instances) {
			Log.msg(`Attempting ${instance.gatewayUrl}`);
			const url = new URL(instance.gatewayUrl!);
			const client = new Client();
			client.addEventListener("READY", (e: ClientEvent) => {
				Log.msg(`Ready on ${client.instance?.gatewayUrl} as ${client.user!.username}`);

				for (var guild of client.guilds!) {
					this.makeGuild(guild, client);
				}
			});

			client.addEventListener("GUILD_CREATE", (e: ClientEvent) => {
				const guild: Guild = e.data;
				this.makeGuild(guild, client);
			});

			client.addEventListener("MESSAGE_CREATE", (e: ClientEvent) => {
				const { data } = e;
				ZLibrary.DiscordModules.Dispatcher.dispatch({
					type: "MESSAGE_CREATE", channelId: data.channel_id, message: {
						...data,
						// type: data.type,
						// content: data.content,
						// channel_id: "970961374631051308",	// change this ID to whatever you want the messages to be forwarded to
						// guild_id: "970961374631051305",		// TODO: create a fake guild object, prevent discord resetting gateway when it tries to load it
						// id: data.id,
						// author: {
						// 	id: data.author.id,
						// 	username: `${data.author.username}@${url.hostname}`,
						// 	discriminator: data.author.discriminator,
						// 	bot: data.author.bot
						// },
						// mentions: data.mentions,
						// timestamp: data.timestamp,
						// embeds: data.embeds,
					}
				});
			});

			client.start(instance);
			this.clients!.push(client);
		}
	};

	stop = async () => {
		for (var i = 0; i < this.clients!.length; i++) {
			const client = this.clients![i];
			client.stop();
		}

		ZLibrary.Patcher.unpatchAll("fosscord");
	};
}