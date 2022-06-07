import { logger } from "ittai";
import { Client } from "../client/Client";
import BaseClass from "./BaseClass";
export interface Channel extends BaseClass {
	[key: string]: any;	//todo
}

export interface EventChannel {
	// TODO, Discord internally uses different names than the ones sent over gateway
}

export const makeChannel = (channel: Partial<Channel>, client: Client): EventChannel => {
	if (!channel.id) {
		throw new Error("Can't makeChannel without ID");
	}

	return Object.assign({
		id: channel.id!,
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
		member: client.user,
		threadMetadata: {},
		availableTags: [],
		appliedTags: [],
		parentChannelThreadType: null,
		template: null,

		roles: {
			[channel.id!]: {
				permissions: 8n,
			}
		},

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

		set: (args: any) => {
			logger.msg("Set was called", args);
			return channel;
		},
	}, channel);
}