import { patcher } from "ittai";
import { Dispatcher } from "ittai/webpack";
import FosscordPlugin from "..";
import { HttpClient } from "../client/HttpClient";
import { makeUser } from "../util/Builders";
import { findIds } from "../util/Snowflake";

export default function (this: FosscordPlugin) {
	patcher.instead(
		"fosscord",
		Dispatcher,
		"dispatch",
		(args: any[] | undefined, original: any) => {
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
				case "GUILD_MEMBER_LIST_UPDATE":
				case "GUILD_SUBSCRIPTIONS_MEMBERS_ADD":
				case "GUILD_SUBSCRIPTIONS_MEMBERS_REMOVE":
				case "PRESENCE_UPDATES":
				case "CHANNEL_SELECT":
					return original(...args);
			}

			switch (event.type) {
				case "LOAD_RELATIONSHIPS_SUCCESS":
					//friends list, inject our own

					(async () => {
						for (let client of this.clients) {
							let ret;
							try {
								ret = await HttpClient.send({
									path: `${client.instance!.apiUrl}/users/@me/relationships`,
									method: "GET",
									client: client
								});
								event.relationships.push(...ret.body);
							}
							catch (e) {
								continue;
							}
						}

						return original(event);
					})();

					return;
			}

			const ids = findIds(event);
			if (ids.length)
				var client = this.findControllingClient(ids);

			if (!client) {
				// this.log(`No client found for event`, event);
				return original(...args);
			}

			switch (event.type) {
				case "TRACK":
				case "GUILD_MEMBERS_REQUEST":	// TODO
				case "APPLICATION_SUBSCRIPTIONS_FETCH_ENTITLEMENTS": // not implemented serverside
				case "APPLICATION_SUBSCRIPTIONS_FETCH_ENTITLEMENTS_SUCCESS":
					client.debug(`Preventing ${event.type}`);
					return;

				// case "CHANNEL_SELECT":
				// 	if (event.channelId) return original(...args);
				// 	const guildId = event.guildId;
				// 	const guild = client.guilds?.get(guildId);
				// 	if (guild) {
				// 		client.debug(`Redirecting CHANNEL_SELECT for ${guildId} with null channel to default channel`);
				// 		return original({
				// 			...event,
				// 			channelId: guild.channels[0].id,
				// 		});
				// 	}
				// 	break;
				case "GUILD_MEMBER_PROFILE_UPDATE":
					if (!event?.user?.id) {
						event.user = event?.guildMember?.user;
						if (!event?.user?.id) return;
					}
					return original(event);

				case "MESSAGE_CREATE":
					if (!event.optimistic) break;

					event.message.author = makeUser(client.user!, client);
					client.stopTyping();
					break;

				case "USER_PROFILE_FETCH_SUCCESS":
					event.connected_accounts = event.connected_accounts ?? [];
					// this PR isn't merged yet
					event.guild_member = event.guild_member ?? { joined_at: null, premium_since: event.premium_since };
					event.guild_member.roles = event.guild_member.roles ?? [];

					const guild_id = window.location.pathname.split("/")[2]; // actually disgusting. can't get it elsewhere tho
					Dispatcher.dispatch({ type: "GUILD_MEMBER_PROFILE_UPDATE", guildId: guild_id, guildMember: event.guild_member });

					break;

				case "GUILD_SUBSCRIPTIONS_CHANNEL": // lazy guild member request op 14
					client.sendLazyRequest(event.guildId, event.channelId, event.ranges);
					return;

				case "GUILD_SUBSCRIPTIONS_FLUSH":
					// afaik a flush is just a mass remove
					// TODO: Fosscord does not yet unsubscribe clients, so this is a waste to do right now
					// for (var channel in event.subscriptions.channels) {
					// client.sendLazyRequest(event.guildId, channel, []);
					// }
					return;

				case "TYPING_START_LOCAL":
					return client.startTyping(event.channelId);

				case "TYPING_START":
					if (event.userId == client.user!.id) return;
					return original(event);

				/*
					TODO: Handle
					* GUILD_MEMBER_LIST_UPDATE,				// lazy guilds, has `ops` prop though not sure how to handle that

					* GUILD_SUBSCRIPTIONS_MEMBERS_ADD 		// member subscriptions when viewing user popups
					* GUILD_SUBSCRIPTIONS_MEMBERS_REMOVE
					* GUILD_MEMBERS_REQUEST					// { guildIds: [], userIds: [] }, may help fix member list
				*/
			}

			const ret = original(...args);
			client.debug(`No client dispatch handler implemented for fosscord, event ${event.type}`, event);
			return ret;
		}
	);
}