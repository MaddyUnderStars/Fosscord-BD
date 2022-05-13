import BaseClass from "./BaseClass";
import Channel from "./Channel";
import Role from "./Role";
export default interface Guild extends BaseClass {
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
	members: [];
}