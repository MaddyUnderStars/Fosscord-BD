import { DispatchHandler } from ".";
import User from "../../entities/User";
import { Collection } from "../../util/Structures";

const handler: DispatchHandler = function (payload) {
	this.user = payload.d.user as User;
	this.guilds = new Collection();
	for (let guild of payload.d.guilds) {
		this.guilds.set(guild.id, guild);
		this.controlledIds.add(guild.id);
	}

	this.channels = new Collection();
	for (let [id, guild] of this.guilds) {
		for (let channel of guild.channels) {
			this.channels.set(channel.id, channel);
			this.controlledIds.add(channel.id);
		}
	}
};

export default handler;