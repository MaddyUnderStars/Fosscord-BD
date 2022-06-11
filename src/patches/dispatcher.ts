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
					return original(...args);
			}

			// faster than recursively scanning event obj
			let client = this.findControllingClient(window.location.href.split("/"));
			if (!client) {
				// if we couldn't find a client that way try the slower method
				const ids = findIds(event);
				client = this.findControllingClient(ids);
			}

			if (!client) {
				return original(...args);
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
					if (event.channelId) return original(...args);
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
					break;
			}

			const ret = original(...args);
			client.log(`No client dispatch handler implemented for fosscord, event ${event.type}`, event);
			return ret;
		}
	);
}