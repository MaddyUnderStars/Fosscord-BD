import { Client, GatewayPayload } from "../Client";

export type DispatchHandler = (this: Client, payload: GatewayPayload) => any;

import Ready from "./Ready";
import GuildCreate from "./GuildCreate";
import GuildDelete from "./GuildDelete";
import MessageCreate from "./MessageCreate";
import ChannelCreate from "./ChannelCreate";
import ChannelDelete from "./ChannelDelete";

const handlers: { [key: string]: DispatchHandler; } = {
	"READY": Ready,
	"MESSAGE_CREATE": MessageCreate,
	"GUILD_CREATE": GuildCreate,
	"GUILD_DELETE": GuildDelete,
	"CHANNEL_CREATE": ChannelCreate,
	"CHANNEL_DELETE": ChannelDelete,
};

export default handlers;