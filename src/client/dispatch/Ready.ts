import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";
import { makeChannel } from "../../entities/Channel";
import { makeGuild } from "../../entities/Guild";
import Relationship from "../../entities/Relationship";
import User, { makeUser } from "../../entities/User";
import DispatchGuild from "../../util/DispatchGuild";
import { Collection } from "@discordjs/collection";

const handler: DispatchHandler = function (payload) {
	this.user = makeUser(payload.d.user, this) as User;
	this.guilds = new Collection();
	for (let guild of payload.d.guilds) {
		this.guilds.set(guild.id, makeGuild(guild, this) as any);
		this.controlledIds.add(guild.id);
	}

	this.channels = new Collection();
	for (let [id, guild] of this.guilds) {
		for (let channel of guild.channels) {
			this.channels.set(channel.id, makeChannel(channel, this) as any);
			this.controlledIds.add(channel.id);
		}
	}

	for (var relationship of payload.d.relationships as Relationship[] || []) {
		Dispatcher.dispatch({
			type: "RELATIONSHIP_ADD",
			relationship: {
				id: relationship.id,
				nickname: relationship.nickname,
				type: relationship.type,
				user: makeUser(relationship.user ?? {}, this),
			},
			shouldNotifiy: false,
		});
		this.relationships.set(relationship.id, relationship);
	}

	this.log(`Ready as ${this.user?.username}`);
	this.reconnectAttempt = 0;

	for (var [id, guild] of this.guilds!) {
		DispatchGuild(guild, this);
	}
};

export default handler;