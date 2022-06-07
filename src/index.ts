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
				Dispatcher.dispatch({
					type: "MESSAGE_CREATE", channelId: data.channel_id, message: data
				});
			});

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
				if (!client)
					return original(event);

				switch (event.type) {
					case "TYPING_START_LOCAL":
						logger.log(`Preventing ${event.type}, not implemented in server`);
						return;
					case "GUILD_SUBSCRIPTIONS_FLUSH":
						logger.log(`Preventing ${event.type} for ${event.guildId}`, event);
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

				// logger.log(`No client dispatch handler implemented for fosscord, event ${event.type}`);
				return original(event);
			}
		);
	};

	stop = () => {
		for (let client of this.clients) {
			client.stop();
		}
	};
}