import { Client, GatewayPayload } from "../Client";

export type DispatchHandler = (this: Client, payload: GatewayPayload) => any;

const handlers: { [key: string]: DispatchHandler; } = {
	"READY": require("./Ready").default,
	"MESSAGE_CREATE": require("./MessageCreate").default,
	"MESSAGE_UPDATE": require("./MessageUpdate").default,
	"GUILD_CREATE": require("./GuildCreate").default,
	"GUILD_DELETE": require("./GuildDelete").default,
	"GUILD_UPDATE": require("./GuildUpdate").default,
	"CHANNEL_CREATE": require("./ChannelCreate").default,
	"CHANNEL_DELETE": require("./ChannelDelete").default,
	"USER_NOTE_UPDATE": require("./UserNoteUpdate").default,
	"GUILD_MEMBER_LIST_UPDATE": require("./GuildMemberListUpdate").default,
	"GUILD_MEMBER_UPDATE": require("./GuildMemberUpdate").default,
	"RELATIONSHIP_REMOVE": require("./RelationshipRemove").default,

	"PRESENCE_UPDATE": require("./SessionPresenceUpdate").default,
	"SESSIONS_REPLACE": require("./SessionPresenceUpdate").default,
};

export default handlers;