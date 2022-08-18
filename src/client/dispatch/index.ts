import { Client, GatewayPayload } from "../Client";

export type DispatchHandler = (this: Client, payload: GatewayPayload) => any;

import Ready from "./Ready";
import MessageCreate from "./MessageCreate";
import MessageUpdate from "./MessageUpdate";
import GuildCreate from "./GuildCreate";
import GuildDelete from "./GuildDelete";
import GuildUpdate from "./GuildUpdate";
import ChannelCreate from "./ChannelCreate";
import ChannelDelete from "./ChannelDelete";
import UserNoteUpdate from "./UserNoteUpdate";
import GuildMemberListUpdate from "./GuildMemberListUpdate";
import GuildMemberUpdate from "./GuildMemberUpdate";
import RelationshipRemove from "./RelationshipRemove";
import TypingStart from "./TypingStart";
import SessionPresenceUpdate from "./SessionPresenceUpdate";;

const handlers: { [key: string]: DispatchHandler; } = {
	"READY": Ready,
	"MESSAGE_CREATE": MessageCreate,
	"MESSAGE_UPDATE": MessageUpdate,
	"GUILD_CREATE": GuildCreate,
	"GUILD_DELETE": GuildDelete,
	"GUILD_UPDATE": GuildUpdate,
	"CHANNEL_CREATE": ChannelCreate,
	"CHANNEL_DELETE": ChannelDelete,
	"USER_NOTE_UPDATE": UserNoteUpdate,
	"GUILD_MEMBER_LIST_UPDATE": GuildMemberListUpdate,
	"GUILD_MEMBER_UPDATE": GuildMemberUpdate,
	"RELATIONSHIP_REMOVE": RelationshipRemove,
	"TYPING_START": TypingStart,

	"PRESENCE_UPDATE": SessionPresenceUpdate,
	"SESSIONS_REPLACE": SessionPresenceUpdate,
};

export default handlers;