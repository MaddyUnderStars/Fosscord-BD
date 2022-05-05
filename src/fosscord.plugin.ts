//META{"name":"FosscordBD"}*//

import Plugin from "./types/Plugin";
import Instance from "./types/Instance";
import ClientSettings from "./types/ClientSettings";
import GatewayPayload from "./types/GatewayPayload";

import User from "./types/User";
import Guild from "./types/Guild";
import Channel from "./types/Channel";

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

class HttpClient {
	static send = (client: Client, method: string, path: string, body: any = undefined) => new Promise((resolve, reject) => {
		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = () => {
			if (xhttp.readyState !== 4) return;
			if (xhttp.status !== 200) reject(`Could not ${method} ${path}`);

			resolve({
				body: JSON.parse(xhttp.responseText),
			});
		};
		xhttp.open(method, path, true);
		xhttp.setRequestHeader("Authorization", client.instance!.token as string);
		xhttp.send(body);
	});
}

class Collection<T> extends Map<String, T> {
	// TODO: Might be useful to add methods similar to discord.js's here?

	find = (fn: (value: T, key: String, collection: Collection<T>) => any) => {
		for (var [id, value] of this) {
			if (fn(value, id, this))
				return this.get(id);
		}
	};
}

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
	instanceUrl?: string;
	#heartbeat?: any;
	#sequence: number = -1;

	get instance() {
		return this.#instance;
	}

	// TODO: Store this better
	user?: User;
	guilds?: Collection<Guild>;
	channels?: Collection<Channel>;
	controlledIds: Set<String> = new Set();

	#gatewayHandlers: { [key: number]: any; } = {
		[GatewayOpcode.Dispatch]: (payload: GatewayPayload) => {
			this.#sequence = payload.s!;	//Always present for dispatch

			const recursivelyFindIds = (obj: any) => {
				for (var [key, value] of Object.entries(obj)) {
					if (value && typeof value === "object")
						recursivelyFindIds(value);

					if (key.toLowerCase().indexOf("_id") == -1	// bad detection algo lets gooo
						|| key.toLowerCase().indexOf("id") == key.length - 3)
						continue;
					if (this.controlledIds.has(value as string)) continue;
					if (!value || value == "null" || value == "undefined") continue;
					// bad way of checking if it looks like a proper snowflake
					if (!Number(value)) continue;

					Log.msg(`${this.instanceUrl} controls ID ${key}:${value}`);
					this.controlledIds.add(value as string);
				}
			};

			recursivelyFindIds(payload.d);

			const handler = this.#dispatchHandlers[payload.t!];
			if (handler) {
				handler(payload);
			}

			this.dispatchEvent(new ClientEvent(payload.t as string, payload.d));
			this.dispatchEvent(new ClientEvent("dispatch", payload));
		},
		[GatewayOpcode.Hello]: (payload: GatewayPayload) => this.#setHeartbeat(payload.d.heartbeat_interval),
		[GatewayOpcode.HeartbeatAck]: () => { }
	};

	#dispatchHandlers: { [key: string]: any; } = {
		"READY": (payload: GatewayPayload) => {
			this.user = payload.d.user as User;;
			this.guilds = new Collection();
			for (let guild of payload.d.guilds) {
				this.guilds.set(guild.id, guild);
				this.controlledIds.add(guild.id);
			}

			this.channels = new Collection();
			for (let [id, guild] of this.guilds) {
				for (let channel of guild.channels) {
					this.channels.set(channel.id, channel);
					this.controlledIds.add(channel.id);
				}
			}
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
			Log.msg(`I have connected to gateway ( ${this.instanceUrl} )`);

			this.#identify();
		});

		this.#socket.addEventListener("message", this.#handleGatewayMessage);

		this.#socket.addEventListener("close", () => {
			clearInterval(this.#heartbeat);
			Log.msg(`Disconnected from gateway ( ${this.instanceUrl} )`);
			this.dispatchEvent(new ClientEvent("close"));
		});
	};

	#handleGatewayMessage = (e: MessageEvent) => {
		const payload: GatewayPayload = JSON.parse(e.data);
		// only log the first few
		if (this.#sequence < 0)
			Log.msg(`Recieved from gateway ( ${this.instanceUrl} )`, payload.op);

		const handler = this.#gatewayHandlers[payload.op];
		if (!handler) {
			Log.msg(`No handler for opcode`);
			return;
		}

		handler(payload);
	};

	// TODO: This function is dumb. Should it return anything?
	// Do we await the login methods?
	start = async (instance: Instance): Promise<boolean> => {
		this.#instance = instance;

		if (this.#instance.gatewayUrl
			&& this.#instance.token) {
			this.instanceUrl = new URL(this.#instance.gatewayUrl).host;
			this.#loginGateway();
			return true;
		}

		if (this.#instance.apiUrl
			&& this.#instance.username
			&& this.#instance.password) {
			return await this.#loginApi();
		}

		return false;
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

	makeGuild = (guild: Guild) => {
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
	};

	start = async () => {
		if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing", `The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
		ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "LINK_TO_RAW_CODE");

		this.loadClientSettings();

		ZLibrary.Patcher.instead("fosscord", ZLibrary.DiscordModules.Dispatcher, "dispatch", (thisObject: any, args: any[] | undefined, original: any) => {
			if (!args) return;
			const [event] = args;

			/*
				When a channel is selected, 2 events are fired: CHANNEL_SELECT and UPDATE_CHANNEL_LIST_DIMENSIONS

				CHANNEL_SELECT: {
					"type": "CHANNEL_SELECT",
					"guildId": string | null,
					"channelId": string | null,
					"messageId": string | null
				}

				Null is sent for all 3 when going to Home

				UPDATE_CHANNEL_LIST_DIMENSIONS: {
					"type": "UPDATE_CHANNEL_LIST_DIMENSIONS",
					"guildId": "",
					"scrollTop": 0
				}
			*/

			const client = this.clients?.find((c: Client) => c.guilds?.get(event.guildId));
			if (!client) {
				return original(event);
			}

			// This event seems to cause the server to kill our connection
			if (event.type === "GUILD_SUBSCRIPTIONS_FLUSH") {
				Log.msg(`Preventing ${event.type} for ${event.guildId}`, event);
				return;
			}

			if (event.type === "CHANNEL_SELECT" && !event.channelId) {
				const guildId = event.guildId;
				const guild = client.guilds?.get(guildId);
				if (guild) {
					Log.msg(`Redirecting CHANNEL_SELECT for ${guildId} with null channel to default channel`);
					return original({
						...event,
						channelId: guild.channels[0].id,
					});
				}
			}
		});


		ZLibrary.Patcher.instead("fosscord", ZLibrary.DiscordModules.ChannelStore, "getChannel", (thisObject: any, args: any[], original: any) => {
			if (!args) return;
			const [id] = args;
			if (!id) return;

			const client = this.clients!.find((c: Client) => c.channels?.get(id));
			if (!client) return original(id);

			const channel = client!.channels!.get(id);
			if (!channel) return null;
			// Log.msg(`Redirected getChannel for ${id} to`, channel);
			return {
				...channel,

				roles: {
					[channel.id]: {
						permissions: 4398046511103n,	// Magic number is admin perms. TODO: Is this format expected?
					}
				},
				rawRecipients: [],
				permissionOverwrites: {},

				getGuildId: () => channel.guild_id,
				isGuildStageVoice: () => false,
				isPrivate: () => false,
				isOwner: () => true,
				toJS: () => channel,	//what is this function?
				isForumChannel: () => false,
				isForumPost: () => false,
				isVocal: () => false,
				isThread: () => false,
				isDM: () => false,
				isNSFW: () => false,
				isGuildVoice: () => false,
				isDirectory: () => false,
				isSystemDM: () => false,
				isMultiUserDM: () => false,
				getRecipientId: () => client.user!.id,
				isArchivedThread: () => false,
				isCategory: () => false,
				isManaged: () => false,
				isGroupDM: () => false,
			};
		});

		ZLibrary.Patcher.instead(
			"fosscord",
			ZLibrary.DiscordModules.APIModule,
			"get",
			async (thisObject: any, args: any[], original: any) => {
				const [request] = args;
				const {
					url,
					query,
					retries,
					oldFormErrors,
				} = request;

				if (!this.clients || !args || !url) return await original(...args);

				for (var client of this.clients) {
					for (var id of client.controlledIds) {
						if (url.indexOf(id) == -1) continue;

						// dumb solution
						const apiUrl = "https://" + client.instanceUrl + "/api/v9";
						return await HttpClient.send(client, "GET", apiUrl + url);
					}
				}

				return await original(...args);
			});

		// Start our clients
		for (var instance of this.settings!.instances) {
			const client = new Client();
			client.addEventListener("READY", (e: ClientEvent) => {
				Log.msg(`Ready on ${client.instanceUrl} as ${client.user!.username}`);

				for (var [id, guild] of client.guilds!) {
					this.makeGuild(guild);
				}
			});

			client.addEventListener("GUILD_CREATE", (e: ClientEvent) => {
				const guild: Guild = e.data;
				this.makeGuild(guild);
			});

			client.addEventListener("MESSAGE_CREATE", (e: ClientEvent) => {
				const data = e.data; // as Message;
				ZLibrary.DiscordModules.Dispatcher.dispatch({
					type: "MESSAGE_CREATE", channelId: data.channel_id, message: data
				});
			});

			// TODO: This doesn't work and I haven't tested why but it sends things slightly differently than above
			// client.addEventListener("dispatch", (e: ClientEvent) => {
			// 	const data = e.data as GatewayPayload;
			// 	if (data.t?.indexOf("_CREATE") == -1) return;
			// 	if (data.t == "GUILD_CREATE") return;	//we handle this elsewhere

			// 	const test = data.t!.substring(0, data.t!.indexOf("_CREATE")).toLowerCase();

			// 	const test2 = {
			// 		type: data.t as string,
			// 		channelId: data.d.channel_id,
			// 		guildId: data.d.guild_id,
			// 		messageId: data.d.message_id,
			// 		[test]: data.d
			// 	};
			// 	Log.msg(test2);

			// 	ZLibrary.DiscordModules.Dispatcher.dispatch(test2)
			// })

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