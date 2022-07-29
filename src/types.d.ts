type InstanceGeneralInfo = Nullable<{
	id: string;
	name: string;
	description: string;
	image: string;

	correspondenceEmail: string,
	correspondenceUserID: string,

	frontPage: string,
	tosPage: string,
}>;

declare interface Instance {
	username?: string;
	password?: string;
	token?: string;
	gatewayUrl?: string;
	cdnUrl?: string;
	apiUrl?: string;
	info?: InstanceGeneralInfo;
	enabled?: boolean;
}

declare interface ClientSettings {
	instances: Instance[];
}

declare interface WithId {
	id: string;
}

// Copied from fosscord/fosscord-server
declare enum CHANNEL_TYPES {
	GUILD_TEXT = 0, // a text channel within a guild
	DM = 1, // a direct message between users
	GUILD_VOICE = 2, // a voice channel within a guild
	GROUP_DM = 3, // a direct message between multiple users
	GUILD_CATEGORY = 4, // an organizational category that contains zero or more channels
	GUILD_NEWS = 5, // a channel that users can follow and crosspost into a guild or route
	GUILD_STORE = 6, // a channel in which game developers can sell their things
	ENCRYPTED = 7, // end-to-end encrypted channel
	ENCRYPTED_THREAD = 8, // end-to-end encrypted thread channel
	TRANSACTIONAL = 9, // event chain style transactional channel
	GUILD_NEWS_THREAD = 10, // a temporary sub-channel within a GUILD_NEWS channel
	GUILD_PUBLIC_THREAD = 11, // a temporary sub-channel within a GUILD_TEXT channel
	GUILD_PRIVATE_THREAD = 12, // a temporary sub-channel within a GUILD_TEXT channel that is only viewable by those invited and those with the MANAGE_THREADS permission
	GUILD_STAGE_VOICE = 13, // a voice channel for hosting events with an audience
	DIRECTORY = 14, // guild directory listing channel
	GUILD_FORUM = 15, // forum composed of IM threads
	TICKET_TRACKER = 33, // ticket tracker, individual ticket items shall have type 12
	KANBAN = 34, // confluence like kanban board
	VOICELESS_WHITEBOARD = 35, // whiteboard but without voice (whiteboard + voice is the same as stage)
	CUSTOM_START = 64, // start custom channel types from here
	UNHANDLED = 255 // unhandled unowned pass-through channel type
}

declare interface Channel extends WithId {
	[key: string]: any; // todo
}

declare interface Guild extends WithId {
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
	embedded_activities: any[];
	presences: any[];
}

declare interface Role extends WithId {
	// TODO

	flags: string;

	[key: string]: any;	//todo
}

declare interface User extends WithId {
	avatar: string | null;
	discriminator: string;
	email: string;
	flags: string;
	mfa_enabled: boolean;
	nsfw_allowed: boolean;
	phone: string | null;
	premium: boolean;
	premium_type: number;
	public_flags: number;
	username: string;
	verified: boolean;
	bot: boolean;
	accent_color: number;
	banner: string | null;
	bio: string;
	premium_since: string;

	user?: User;
	permissionOverwrites?: any[];
	roles?: any[];
}

declare interface Relationship extends WithId {
	type: number,
	user?: User,
	nickname?: string,
}