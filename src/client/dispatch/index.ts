import { Client, GatewayPayload } from "../Client";

export type DispatchHandler = (this: Client, payload: GatewayPayload) => any;

import Ready from "./Ready";
import GuildCreate from "./GuildCreate";
import GuildDelete from "./GuildDelete";
import MessageCreate from "./MessageCreate";

const handlers: { [key: string]: DispatchHandler; } = {
	"READY": Ready,
	"MESSAGE_CREATE": MessageCreate,
	"GUILD_CREATE": GuildCreate,
	"GUILD_DELETE": GuildDelete,
};

export default handlers;