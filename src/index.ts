import { Plugin } from "ittai/entities";
import * as React from "react";
import SettingsPage from "./components/Settings";
import * as settings from "ittai/settings";

import { Client } from "./client/Client";
import { makeChannel } from "./entities/Channel";
import { APIRequest, APIResponse, HttpClient } from "./client/HttpClient";
import { findIds } from "./util/Snowflake";
import User from "./entities/User";
import Instance from "./entities/Instance";
import { Dispatcher } from "ittai/webpack";

export default class FosscordPlugin extends Plugin {
	clients: Client[] = [];

	findControllingClient = (id: string[] | string) => {
		if (!Array.isArray(id)) {
			id = [id];
		}

		return this.clients.find(x => x.controlledIds.any(...id));
	};

	applySettingsChanges = async (instances: Instance[]) => {
		for (let curr of instances) {
			if (this.clients.find(x => x.instance?.apiUrl == curr.apiUrl)) continue;

			let client = new Client();
			await client.login(curr);
			this.clients.push(client);
		}
	};

	start = async () => {
		this.setSettingsPanel(() => React.createElement(SettingsPage, { onReload: this.applySettingsChanges }));

		for (let instance of settings.get("instances", [])) {
			let client = new Client();
			await client.login(instance);
			this.clients.push(client);
		}

		// Patches

		type originalApiMethod = (request: APIRequest) => Promise<APIResponse>;
		const redirectRequest = async (method: string, request: APIRequest, original: originalApiMethod) => {
			const {
				url,
				body,
				query,
			} = typeof request == "string" ? { url: request, body: undefined, query: undefined } : request;

			// this is dumb
			const IdsInRequest = [
				...(url || "").split("/").filter(x => !isNaN(parseInt(x))),
				...Object.values(body || {}).filter(x => !isNaN(parseInt(x))).flat(),
				...Object.values(query || {}).filter(x => !isNaN(parseInt(x))).flat(),
			];

			const client = this.findControllingClient(IdsInRequest);
			if (!client) {
				return await original(request);
			}

			if (url.indexOf("/ack") != -1) {
				client.log(`Preventing request to /ack, not implemented in server`);
				return;
			}

			return await HttpClient.send(client, method, client.instance?.apiUrl + url, body, query);
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

				// pass through events TODO: remove because this was a stupid idea
				switch (event.type) {
					case "WINDOW_FOCUS":
					case "SELF_PRESENCE_STORE_UPDATE":
					case "EXPERIMENT_TRIGGER":
					case "GUILD_DELETE":
					case "UPDATE_CHANNEL_DIMENSIONS":
					case "USER_PROFILE_MODAL_OPEN":
					case "USER_PROFILE_FETCH_START":
					case "USER_PROFILE_FETCH_SUCCESS":
					case "GUILD_SUBSCRIPTIONS_MEMBERS_REMOVE":
					case "GUILD_SUBSCRIPTIONS_MEMBERS_ADD":
					case "NOW_PLAYING_UNMOUNTED":
					case "ENABLE_AUTOMATIC_ACK":
					case "DISABLE_AUTOMATIC_ACK":
					case "CHANNEL_PRELOAD":
					case "UPDATE_CHANNEL_LIST_DIMENSIONS":
					case "DRAFT_SAVE":
					case "DRAFT_CHANGE":
					case "TYPING_STOP_LOCAL":
					case "LOAD_MESSAGES":
					case "LOAD_MESSAGES_SUCCESS":
					case "DELETE_PENDING_REPLY":
					case "CLEAR_STICKER_PREVIEW":
					case "POGGERMODE_UPDATE_COMBO":
					case "STICKER_PACKS_FETCH_START":
					case "STICKER_PACKS_FETCH_SUCCESS":
						return original(event);
				}

				// faster than recursively scanning event obj
				let client = this.findControllingClient(window.location.href.split("/"));
				if (!client) {
					// if we couldn't find a client that way try the slower method
					const ids = findIds(event);
					client = this.findControllingClient(ids);
				}

				if (!client) {
					return original(event);
				}

				switch (event.type) {
					case "CHANNEL_LOCAL_ACK":
					case "TYPING_START_LOCAL":
						client.log(`Preventing ${event.type}, not implemented in server`);
						return;
					case "GUILD_SUBSCRIPTIONS_FLUSH":
					case "TRACK":
						client.log(`Preventing ${event.type}`);
						return;
					case "CHANNEL_SELECT":
						if (event.channelId) return original(event);
						const guildId = event.guildId;
						const guild = client.guilds?.get(guildId);
						if (guild) {
							client.log(`Redirecting CHANNEL_SELECT for ${guildId} with null channel to default channel`);
							return original({
								...event,
								channelId: guild.channels[0].id,
							});
						}
					case "GUILD_MEMBER_PROFILE_UPDATE":
						if (!event.guildMember && event.user) {
							event.guildMember = event.user;
						}
						return original(event);
					case "MESSAGE_CREATE":
						if (!event.optimistic) break;
						event.message.author = client.user;
						return original(event);
				}

				const ret = original(event);
				client.log(`No client dispatch handler implemented for fosscord, event ${event.type}`, event);
				return ret;
			}
		);

		for (let method of [
			"getUserAvatarURL",
			"getGuildMemberAvatarURLSimple",
			"getGuildIconURL",
			"getEmojiURL",
			"getGuildBannerURL",
		]) {
			ZLibrary.Patcher.instead(
				"fosscord",
				//@ts-ignore
				ZLibrary.WebpackModules.getByProps("getUserAvatarURL", "hasAnimatedGuildIcon").default,
				method,
				(thisObject: any, args: any[], original: any) => {
					const data = args[0];
					const client = this.findControllingClient(findIds(data));
					const originalRet = original(...args);
					if (!client || !originalRet) return originalRet;

					return originalRet.replace("https://cdn.discordapp.com", client.instance?.cdnUrl);
				}
			);
		}

		ZLibrary.Patcher.instead(
			"fosscord",
			ZLibrary.WebpackModules.getByProps("getUserBannerURLForContext"),
			"getUserBannerURLForContext",
			(thisObject: any, args: any[], original: any) => {
				const { user, guildMember, size } = args[0];
				const client = this.findControllingClient(findIds(user));
				if (!client) return original(...args);

				return `${client.instance?.cdnUrl}/banners/${user.id}/${user.banner}?size=${size}`;
			}
		);

		// Anti tracking stuff
		ZLibrary.Patcher.instead(
			"fosscord",
			ZLibrary.WebpackModules.getByProps("track", "setSystemAccessibilityFeatures"),
			"track",
			(thisObject: any, args: any[], original: any) => {
				// let client = this.findControllingClient(window.location.href.split("/"));
				// if (!client) return original(...args);
				// client.log("Blocking track");
				return;
			}
		);
	};

	stop = () => {
		for (let client of this.clients) {
			client.stop();

			for (let [id, guild] of client.guilds) {
				Dispatcher.dispatch({
					type: "GUILD_DELETE", guild: { id: id },
				});
			}
		}

		ZLibrary.Patcher.unpatchAll("fosscord");
	};
}