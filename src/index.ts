import { Plugin } from "ittai/entities";
import * as React from "react";
import SettingsPage from "./components/Settings";
import * as settings from "ittai/settings";

import { Client, ClientEvent } from "./client/Client";
import { logger, patcher, webpack } from "ittai";
import { Guild, makeGuild } from "./entities/Guild";
import { Channel, makeChannel } from "./entities/Channel";
import { Dispatcher } from "ittai/webpack";
import { APIRequest, APIResponse, HttpClient } from "./client/HttpClient";
import { findIds } from "./util/Snowflake";
import User from "./entities/User";

export default class FosscordPlugin extends Plugin {
	clients: Client[] = [];

	findControllingClient = (id: string[] | string) => {
		if (typeof id === "string") {
			id = [id];
		}

		return this.clients.find(x => x.controlledIds.any(...id));
	};

	start = async () => {
		this.setSettingsPanel(() => React.createElement(SettingsPage));

		const dispatchGuild = (guild: Guild, client: Client) => {
			guild = makeGuild(guild, client) as Guild;
			client.guilds.set(guild.id, guild);
			Dispatcher.dispatch({
				type: "GUILD_CREATE", guild: {
					presences: [],
					embedded_activities: [],
					emoji: [],

					...guild,
				}
			});
		};

		for (let instance of settings.get("instances", [])) {
			let client = new Client();
			await client.login(instance);

			client.addEventListener("READY", (e: ClientEvent) => {
				logger.log(`Ready on ${client.instance?.gatewayUrl} as ${client.user?.username}`);

				for (var [id, guild] of client.guilds!) {
					dispatchGuild(guild, client);
				}
			});

			client.addEventListener("GUILD_CREATE", (e: ClientEvent) => {
				dispatchGuild(e.data, client);
			});

			client.addEventListener("GUILD_DELETE", (e: ClientEvent) => {
				const id: string = e.data.id;
				client.guilds?.delete(id);
				Dispatcher.dispatch({
					type: "GUILD_DELETE", guild: { id: id },
				});
			});

			client.addEventListener("MESSAGE_CREATE", (e: ClientEvent) => {
				const data = e.data; //as Message;

				const messageInternal = ZLibrary.WebpackModules.getByProps("canEditMessageWithStickers") as any;
				const message = messageInternal.createMessageRecord(data);

				Dispatcher.dispatch({
					type: "MESSAGE_CREATE", channelId: data.channel_id, message: message
				});
			});

			// todo: presence/session, uhh everything else

			this.clients.push(client);
		}

		// Patches

		type originalApiMethod = (request: APIRequest) => Promise<APIResponse>;
		const redirectRequest = async (method: string, request: APIRequest, original: originalApiMethod) => {
			const {
				url,
				body,
			} = typeof request == "string" ? { url: request, body: undefined } : request;

			// this is dumb
			const IdsInRequest = [
				...(url || "").split("/").filter(x => !isNaN(parseInt(x))),
				...Object.values(body || {}).filter(x => !isNaN(parseInt(x))).flat(),
			];

			const client = this.findControllingClient(IdsInRequest);
			if (!client) {
				return await original(request);
			}

			if (url.indexOf("/ack") != -1) {
				logger.log(`Preventing request to /ack, not implemented in server`);
				return;
			}

			return await HttpClient.send(client, method, client.instance?.apiUrl + url, body);
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
				async (thisObject: any, args: any[], original: any) => {
					return await redirectRequest(method, args[0], original);
				}
			);
		}

		ZLibrary.Patcher.instead(
			"fosscord",
			ZLibrary.DiscordModules.ChannelStore,
			"getChannel",
			(thisObject: any, args: any[], original: any) => {
				if (!args || !args[0]) return;
				const [id] = args;

				const client = this.findControllingClient(id);
				if (!client) return original(id);

				const channel = client.channels.get(id);
				if (!channel) return null;

				return makeChannel(channel, client);
			}
		);

		ZLibrary.Patcher.instead(
			"fosscord",
			ZLibrary.DiscordModules.Dispatcher,
			"dispatch",
			(thisObject: any, args: any[] | undefined, original: any) => {
				if (!args) return;
				const [event] = args;

				const ids = findIds(event);
				const client = this.findControllingClient(ids);
				if (!client) {
					return original(event);
				}

				switch (event.type) {
					case "CHANNEL_LOCAL_ACK":
					case "TYPING_START_LOCAL":
						logger.log(`Preventing ${event.type}, not implemented in server`);
						return;
					case "GUILD_SUBSCRIPTIONS_FLUSH":
					case "TRACK":
						logger.log(`Preventing ${event.type} for ${event.guildId}`);
						return;
					case "CHANNEL_SELECT":
						if (event.channelId) break;
						const guildId = event.guildId;
						const guild = client.guilds?.get(guildId);
						if (guild) {
							logger.log(`Redirecting CHANNEL_SELECT for ${guildId} with null channel to default channel`);
							return original({
								...event,
								channelId: guild.channels[0].id,
							});
						}
				}

				const ret = original(event);
				logger.log(`No client dispatch handler implemented for fosscord, event ${event.type}`);
				return ret;
			}
		);


		// Image stuff below

		// //@ts-ignore
		// for (var func in ZLibrary.WebpackModules.getByProps("getUserAvatarURL", "hasAnimatedGuildIcon").default) {
		// 	ZLibrary.Patcher.instead(
		// 		"fosscord",
		// 		//@ts-ignore
		// 		ZLibrary.WebpackModules.getByProps("getUserAvatarURL", "hasAnimatedGuildIcon").default,
		// 		func,
		// 		(thisObject: any, args: any[], original: any) => {
		// 			let ret: string = original(...args);
		// 			if (!ret) return ret;
		// 			const ids = findIds(Object.assign({}, [...args].concat(ret.split("/"))));	// bad lol
		// 			const client = this.findControllingClient(ids);
		// 			if (!client) return ret;

		// 			if (ret.indexOf("/guilds/") !== -1) {
		// 				// Fosscord doesn't yet support guild specific profiles?

		// 				let split = ret.split("/");
		// 				split.splice(split.indexOf("guilds"), 2);
		// 				ret = split.join("/");
		// 			}

		// 			ret = ret.replace("https://cdn.discordapp.com", client.instance?.cdnUrl!);

		// 			logger.log(ret);
		// 			return ret;
		// 		}
		// 	);
		// }

		ZLibrary.Patcher.instead(
			"fosscord",
			//@ts-ignore
			ZLibrary.WebpackModules.getByProps("getUserAvatarURL", "hasAnimatedGuildIcon").default,
			"getUserAvatarURL",
			(thisObject: any, args: any[], original: any) => {
				const user = args[0] as User;
				const client = this.findControllingClient(user.id);
				if (!client) return original(...args);

				return `${client.instance?.cdnUrl}/avatars/${user.id}/${user.avatar}.png?size=${80}`;
			}
		);

		ZLibrary.Patcher.instead(
			"fosscord",
			//@ts-ignore
			ZLibrary.WebpackModules.getByProps("getUserAvatarURL", "hasAnimatedGuildIcon").default,
			"getGuildMemberAvatarURLSimple",
			(thisObject: any, args: any[], original: any) => {
				const { guildId, avatar, userId } = args[0];
				const client = this.findControllingClient(userId);
				if (!client) return original(...args);

				// https://cdn.discordapp.com/guilds/566944268703236117/users/280874280504262657/avatars/16b8179b1231d83afb188ca642018cbc.webp?size=128
				// return `${client.instance?.cdnUrl}/guilds/${guildId}/users/${userId}/avatars/${avatar}.png?size={128}`; // TODO: not implemented in server?
				return `${client.instance?.cdnUrl}/avatars/${userId}/${avatar}.png?size=${80}`;
			}
		);

		// TODO: Doesn't work. It doesn't even get called - none of the banner ones do, actually?
		ZLibrary.Patcher.instead(
			"fosscord",
			//@ts-ignore
			ZLibrary.WebpackModules.getByProps("getUserAvatarURL", "hasAnimatedGuildIcon").default,
			"getUserBannerURL",
			(thisObject: any, args: any[], original: any) => {
				const ret = original(...args);
				logger.log(args, ret);
				return ret;
			}
		);

		/*
			// this is disgusting
			const NativeImage = Image;
			const getCurrentClients = () => this.clients;	// work around because I can't access the plugin this in proxyimage
			class ProxyImage extends NativeImage {
				set src(value: string) {
					let client = getCurrentClients().find(x => x.controlledIds.any(...value.split("/")));

					if (client) {
						logger.log(`Replacing image request for 'cdn.discordapp.com' to '${client?.instance?.cdnUrl}'`);
						value = value.replace("cdn.discordapp.com", client.instance!.cdnUrl!);
					}
				}
			}
			Image = ProxyImage;
		*/
	};

	stop = () => {
		for (let client of this.clients) {
			client.stop();
		}

		ZLibrary.Patcher.unpatchAll("fosscord");
	};
}