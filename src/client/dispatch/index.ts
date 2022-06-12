import { Client, GatewayPayload } from "../Client";

export type DispatchHandler = (this: Client, payload: GatewayPayload) => any;

const handlers: { [key: string]: DispatchHandler; } = {
	"READY": require("./Ready").default,
	"MESSAGE_CREATE": require("./MessageCreate").default,
	"GUILD_CREATE": require("./GuildCreate").default,
	"GUILD_DELETE": require("./GuildDelete").default,
	"GUILD_UPDATE": require("./GuildUpdate").default,
	"CHANNEL_CREATE": require("./ChannelCreate").default,
	"CHANNEL_DELETE": require("./ChannelDelete").default,
};

export default handlers;