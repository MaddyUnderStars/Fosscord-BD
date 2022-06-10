import { Client } from "../client/Client";
import BaseClass from "./BaseClass";
import { Channel, makeChannel } from "./Channel";
import Role from "./Role";
import { makeUser } from "./User";

export interface Guild extends BaseClass {
	topic: string,
	afk_channel_id: string;
	afk_timeout: number;
	banner: string | null;
	default_message_notifications: number;
	description: string | null;
	discovery_splash: string | null;
	explicit_content_filter: number;
	features: string[];
	primary_category_id: string | null;
	icon: string | null;
	large: null;	//what is this?
	max_members: number;
	max_presences: number;
	max_video_channel_users: number;
	member_count: number;
	precense_count: number;
	template_id: string | null;
	mfa_level: number;
	name: string;
	owner_id: string | null;	//fosscord has ownerless guilds
	preferred_locale: string;
	premium_subscription_count: 0;
	premium_tier: number;
	public_updates_channel_id: string | null;
	rules_channel_id: string | null;
	region: string;
	splash: string | null;
	system_channel_id: string | null;
	system_channel_flags: number;
	unavailable: boolean;
	verification_leveL: number;
	welcome_screen: {
		enabled: boolean;
		description: string | null;
		welcome_channels: Channel[];
	};
	widget_channel_id: string | null;
	widget_enabled: boolean;
	nsfw_level: number;
	nsfw: boolean;
	parent: string | null;	//what is this?
	channels: Channel[];
	emojis: [];		// TODO: Emoji class
	roles: Role[];		// TODO: roles
	stickers: [];	// TODO: Stickers
	joined_at: string;
	guild_hashes: {};	//what is this?
	guild_scheduled_events: [];	// TODO: guild events
	threads: [];	// TODO: threads
	members: any[];	// TODO: member type
}

export interface EventGuild {
	// TODO, Discord internally uses different names than the ones sent over gateway
}

export const makeGuild = (guild: Partial<Guild>, client: Client): EventGuild => {
	
	// using this makes the guild create event stop working?
	// const guildInternal = ZLibrary.WebpackModules.getByPrototypes("hasCommunityInfoSubheader") as any;
	// guild = new guildInternal(guild);

	if (guild.channels)
		for (var i in guild.channels)
			guild.channels[i] = makeChannel(guild.channels[i], client) as Channel;	// TODO: this type is wrong
	else guild.channels = [];

	if (!guild.members) {
		guild.members = [{
			id: client.user?.id,
			username: client.user?.username,
			avatar: client.user?.avatar,
			discriminator: client.user?.discriminator,
			bot: client.user?.bot,
			user: client.user,
			permissionOverwrites: [],
			roles: guild.channels.length ? [guild.id] : [],
		}];
	}
	else {
		for (var i in guild.members)
			guild.members[i] = makeUser(guild.members[i], client);
	}

	guild.guild_scheduled_events = [];

	if (guild.roles)
		for (var i in guild.roles)
			if (!guild.roles[i].flags)
				guild.roles[i].flags = "0";

	// return guild;

	return Object.assign({
		name: "",
		topic: "",
		description: null,
		ownerId: null,
		icon: null,
		splash: null,
		banner: null,
		features: [],
		preferredLocale: "en-US",
		roles: [],
		members: [],
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
		hubType: null,
	}, guild);
};