import { patcher } from "ittai";
import { Dispatcher } from "ittai/webpack";
import FosscordPlugin from "..";
import { makeUser } from "../entities/User";
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
					return original(...args);
			}

			// faster than recursively scanning event obj
			let client = this.findControllingClient(window.location.href.split("/"));
			if (!client) {
				// if we couldn't find a client that way try the slower method
				const ids = findIds(event);
				if (ids.length)
					client = this.findControllingClient(ids);
			}

			if (!client) {
				// this.log(`No client found for event`, event);
				return original(...args);
			}

			switch (event.type) {
				case "CHANNEL_LOCAL_ACK":
				case "TYPING_START_LOCAL":
				case "TRACK":
					client.debug(`Preventing ${event.type}`);
					return;

				case "CHANNEL_SELECT":
					if (event.channelId) return original(...args);
					const guildId = event.guildId;
					const guild = client.guilds?.get(guildId);
					if (guild) {
						client.debug(`Redirecting CHANNEL_SELECT for ${guildId} with null channel to default channel`);
						return original({
							...event,
							channelId: guild.channels[0].id,
						});
					}
					break;
				case "GUILD_MEMBER_PROFILE_UPDATE":
					if (!event.guildMember || !event.guildMember.user || !event.guildMember.id) {
						if (event.guildMember && event.user) event.guildMember.user = event.user;
						else return;
						break;
					}
					return original(event);

				case "MESSAGE_CREATE":
					if (!event.optimistic) break;
					event.message.author = makeUser(client.user!, client);
					break;

				case "USER_PROFILE_FETCH_SUCCESS":
					event.connected_accounts = event.connected_accounts ?? [];
					event.guild_member = event.guild_member ?? { joined_at: null, premium_since: event.premium_since };			// TODO: Fosscord doesn't send this
					// event.guild_member.roles = event.guild_member.roles ?? []	// TODO: How can I fetch our roles? fosscord doesn't send them ^
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