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
		return args;
	},
	warn: (...args: any[]) => {
		console.warn("[Fosscord]", ...args);
		return args;
	},
	error: (...args: any[]) => {
		console.error("[Fosscord]", ...args);
		return args;
	}
};

const recursivelyFindIds = (obj: any): String[] => {
	var ret: String[] = [];
	for (var [key, value] of Object.entries(obj)) {
		if (value && typeof value === "object")
			ret = ret.concat(recursivelyFindIds(value));

		if (key.toLowerCase().indexOf("_id") == -1	// bad detection algo lets gooo
			&& key.toLowerCase().indexOf("id") != key.length - 2)
			continue;
		if (!value || value == "null" || value == "undefined") continue;
		// bad way of checking if it looks like a proper snowflake
		if (!Number(value)) continue;

		// Log.msg(`Fosscord controls ID ${value}`);
		ret.push(value as string);
	}
	return ret;
};

interface APIRequest {
	url: string,
	body: { [key: string]: any; },
	retries: number,
	oldFormErrors?: boolean,
};

interface APIResponse {
	body: { [key: string]: any; } | null,
	headers: { [key: string]: any; },
	ok: boolean,
	status: number,
	text: string,
}

class HttpClient {
	static send = (client: Client, method: string, path: string, body: any = undefined): Promise<APIResponse> => new Promise((resolve, reject) => {
		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = () => {
			if (xhttp.readyState !== 4) return;
			if (xhttp.status !== 200) reject(`Could not ${method} ${path}`);

			const headers: { [key: string]: string; } = {};
			xhttp.getAllResponseHeaders()
				.split(/[\r\n]+/)
				.forEach(x => {
					const parts = x.split(": ");
					const header = parts.shift();
					if (!header) return;
					headers[header] = parts.join(": ");
				});

			var json: { [key: string]: any; } | null = null;
			try {
				if (xhttp.responseText) {
					json = JSON.parse(xhttp.responseText);

					for (let id of recursivelyFindIds(json))
						client.controlledIds.add(id);
				}
			}
			catch (e) {
				Log.error(xhttp.responseText, e);
				return reject(e);
			}

			resolve({
				body: json,
				status: xhttp.status,
				text: xhttp.responseText,
				ok: xhttp.status == 200,
				headers: headers,
			});
		};
		xhttp.open(method, path, true);
		xhttp.setRequestHeader("Authorization", client.instance!.token as string);
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(body));
	});
}

class Collection<T> extends Map<String, T> {
	// TODO: Might be useful to add methods similar to discord.js's here?

	find = (fn: (value: T, key: String, collection: this) => any) => {
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

			for (let id of recursivelyFindIds(payload.d))
				this.controlledIds.add(id);

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
	clients: Client[] = [];

	loadClientSettings = () => {
		this.settings = {
			instances: BdApi.loadData("fosscord", "instances"),
		};
	};

	makeGuild = (guild: Guild) => {
		const client = this.clients?.find(x => x.guilds?.get(guild.id));
		const user = client?.user;

		for (var i = 0; i < guild.channels.length; i++) {
			guild.channels[i] = {
				...guild.channels[i],

				getGuildId: () => guild.id,
				isGuildStageVoice: () => false,
				isPrivate: () => false,
				isOwner: () => false,
				toJS: () => guild.channels[i],	//what is this function?
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
				getRecipientId: () => null,
				isArchivedThread: () => false,
				isCategory: () => false,
				isManaged: () => false,
				isGroupDM: () => false,
			};
		}

		for (var role of guild.roles) {
			if (!role.flags)
				role.flags = "0";
		}

		guild = Object.assign({}, {
			id: "",
			name: "",
			description: null,
			ownerId: null,
			icon: null,
			splash: null,
			banner: null,
			features: [],
			preferredLocale: "en-US",
			roles: null,
			afkChannelId: null,
			afkTimeout: null,
			systemChannelId: null,
			verificationLevel: null,
			joinedAt: null,
			defaultMessageNotifications: "ALL_MESSAGES",
			mfaLevel: "NONE",
			application_id: null,
			explicitContentFilter: "DISABLED",
			vanityURLCode: null,
			premiumTier: "NONE",
			premiumSubscriberCount: 0,
			premiumProgressBarEnabled: false,
			systemChannelFlags: null,
			discoverySplash: null,
			rulesChannelId: null,
			publicUpdatesChannelId: null,
			maxVideoChannelUsers: -1,
			maxMembers: -1,
			nsfwLevel: 0,
			applicationCommandsCounts: {},
			hubType: null
		}, guild);

		ZLibrary.DiscordModules.Dispatcher.dispatch({
			type: "GUILD_CREATE", guild: {
				...guild,
				channels: [],
				members: [{
					id: user?.id,
					username: user?.username,
					avatar: user?.avatar,
					discriminator: user?.discriminator,
					bot: user?.bot,
					user: user,
					permissionOverwrites: [],
					roles: [],
				}],
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

		const permissionsChecker = ZLibrary.WebpackModules.getByProps("getGuildPermissionProps", "can", "getGuildPermissions");
		ZLibrary.Patcher.instead("fosscord", permissionsChecker, "can", (thisObject: any, args: any[] | undefined, original: any) => {
			// if (!args) return;
			// const [permission, obj] = args;

			// const client = this.clients?.find((c: Client) => c.channels?.get(obj.id));
			// if (!client) return original(...args);

			return true;
		});

		ZLibrary.Patcher.instead("fosscord", ZLibrary.DiscordModules.Dispatcher, "dispatch", (thisObject: any, args: any[] | undefined, original: any) => {
			if (!args) return;
			const [event] = args;

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

			return original(event);
		});


		ZLibrary.Patcher.instead("fosscord", ZLibrary.DiscordModules.ChannelStore, "getChannel", (thisObject: any, args: any[], original: any) => {
			if (!args) return;
			const [id] = args;
			if (!id) return;

			const client = this.clients!.find((c: Client) => c.channels?.get(id));
			if (!client)
				return original(id);

			let channel = client!.channels!.get(id) as Channel;
			if (!channel) return null;
			// Log.msg(`Redirected getChannel for ${id} to`, channel);

			let guild = client!.guilds?.get(channel.guild_id);

			channel = Object.assign({}, {
				type: "GUILD_TEXT",
				name: "",
				topic: "",
				position: 0,
				guild_id: "",
				recipients: [],
				rawRecipients: [],
				permissionOverwrites: {},
				bitrate: null,
				videoQualityMode: null,
				rtcRegion: null,
				userLimit: 0,
				ownerId: null,
				icon: null,
				application_id: null,
				nicks: {},
				nsfw: false,
				parent_id: null,
				memberListId: null,
				rateLimitPerUser: 0,
				defaultAutoArchiveDuration: null,
				flags: 0,
				originChannelId: null,
				lastMessageId: null,
				lastPinTimestamp: null,
				messageCount: 0,
				memberCount: 0,
				memberIdsPreview: [],
				member: null,
				threadMetadata: {},
				availableTags: [],
				appliedTags: [],
				parentChannelThreadType: null,
				template: null,
			}, channel);

			return {
				...channel,

				roles: {
					[channel.id]: {
						permissions: 4398046511103n,	// Magic number is admin perms. TODO: Is this format expected?
						requireSendMessages: false,
					}
				},
				rawRecipients: [],
				permissionOverwrites: {},

				getGuildId: () => channel.guild_id,
				isGuildStageVoice: () => false,
				isPrivate: () => false,
				isOwner: () => false,
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

		type originalApiMethod = (request: APIRequest) => Promise<APIResponse>;
		const redirectRequest = async (method: string, request: APIRequest, original: originalApiMethod) => {
			const {
				url,
				body,
			} = request;

			// this is dumb
			const IdsInRequest = [
				...(url || "").split("/").filter(x => !isNaN(parseInt(x))),
				...Object.values(body || {}).filter(x => !isNaN(parseInt(x))).flat(),
			];

			const hasAny = (set: Set<String>, ...args: string[]) => {
				for (var str of args) {
					if (set.has(str)) return true;
				}
			};

			const client = this.clients.find(x => hasAny(x.controlledIds, ...IdsInRequest));
			if (!client) return await original(request);

			const apiUrl = "https://" + client.instanceUrl + "/api/v9";
			return await HttpClient.send(client, method, apiUrl + url, body);
		};

		for (let method of [
			"get",
			"post",
			"patch",
			"put",
			"options",
			"delete",
		]) {
			ZLibrary.Patcher.instead(
				"fosscord",
				ZLibrary.DiscordModules.APIModule,
				method,
				async (thisArg: any, args: any[], original: any) => {
					return await redirectRequest(method, args[0], original);
				}
			);
		}

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