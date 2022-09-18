import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";
import { makeUser, makeGuild, makeChannel } from "../../util/Builders";
import DispatchGuild from "../../util/DispatchGuild";
import { Collection } from "@discordjs/collection";

const handler: DispatchHandler = function (payload) {
	this.user = makeUser(payload.d.user, this) as User;
	this.guilds = new Collection();
	for (let guild of payload.d.guilds) {
		this.guilds.set(guild.id, makeGuild(guild, this) as any);
		this.controlledIds.add(guild.id);
		for (var channel of guild.channels) {
			this.controlledIds.add(channel.id);
		}
	}

	// this.channels = new Collection();
	// for (let [id, guild] of this.guilds) {
	// 	for (let channel of guild.channels) {
	// 		console.log(channel);
	// 		this.channels.set(channel.id, makeChannel(channel, this) as any);
	// 		this.controlledIds.add(channel.id);
	// 	}
	// }

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

	for (var channel of payload.d.private_channels) {
		channel.recipients = channel.recipients.map((x: any) => {
			makeUser(x, this);	// adds to store
			return x.id;
		});
		channel.recipients.push(this.user.id);	// todo: fix serverside
		Dispatcher.dispatch({
			type: "CHANNEL_CREATE",
			channel: makeChannel(channel, this)
		});
	}

	this.log(`Ready as ${this.user?.username}`);
	this.reconnectAttempt = 0;

	for (var [id, guild] of this.guilds!) {
		DispatchGuild(guild, this);
	}
};

export default handler;