import { Dispatcher } from "ittai/webpack";
import { Client } from "../client/Client";
import { Guild, makeGuild } from "../entities/Guild";

export default (guild: Guild, client: Client) => {
	guild = makeGuild(guild, client) as Guild;
	client.guilds.set(guild.id, guild);
	Dispatcher.dispatch({
		type: "GUILD_CREATE", guild: {
			presences: [],
			embedded_activities: [],
			emoji: [],

			...guild,
		}
	});
};