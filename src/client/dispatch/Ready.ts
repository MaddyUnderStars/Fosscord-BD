import { DispatchHandler } from ".";
import User, { makeUser } from "../../entities/User";
import DispatchGuild from "../../util/DispatchGuild";
import { Collection } from "../../util/Structures";

const handler: DispatchHandler = function (payload) {
	this.user = makeUser(payload.d.user, this) as User;
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

	this.log(`Ready as ${this.user?.username}`);
	this.reconnectAttempt = 0;

	for (var [id, guild] of this.guilds!) {
		DispatchGuild(guild, this);
	}
};

export default handler;