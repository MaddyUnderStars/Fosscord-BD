import { patcher, webpack } from "ittai";
import { Client } from "../client/Client";

const userInternal = webpack.findByPrototype("addGuildAvatarHash") as any;
export const makeUser = (user: Partial<User>, client: Client) => {
	user = new userInternal(user);

	patcher.instead(
		"fosscord",
		user,
		"getAvatarSource",
		(args, original) => {
			client.log(args);
			return original(...args);
		}
	);

	const member = user;
	member.user = user as User,
		member.permissionOverwrites = member.permissionOverwrites ?? [];
	member.roles = member.roles ?? [];

	// add to user store
	webpack.findByProps("getCurrentUser", "getUser").getUsers()[user.id!] = user;

	return member;
};

export const makeChannel = (channel: Partial<Channel>, client: Client): Channel => {
	const channelInternal = webpack.findByProps("fromServer") as any;
	if (!channel.member) channel.members = client.user;
	channel = new channelInternal(channel);

	if (!channel.id) {
		throw new Error("Can't makeChannel without ID");
	}

	return channel as Channel;
};

export const makeGuild = (guild: Partial<Guild>, client: Client): Guild => {

	// using this makes the guild create event stop working?
	// const guildInternal = webpack.findByPrototype("hasCommunityInfoSubheader") as any;
	// guild = new guildInternal(guild);

	if (guild.channels)
		for (var i in guild.channels) {
			if (guild.channels[i].id) //huh?
				guild.channels[i] = makeChannel(guild.channels[i], client) as Channel;	// TODO: this type is wrong
		}
	else guild.channels = [];

	if (!guild.members) {
		guild.members = [
			makeUser({
				id: client.user?.id,
				username: client.user?.username,
				avatar: client.user?.avatar,
				discriminator: client.user?.discriminator,
				bot: client.user?.bot,
			},
				client)
		];
	}
	else {
		for (var i in guild.members)
			guild.members[i] = makeUser(guild.members[i], client);
	}

	guild.guild_scheduled_events = guild.guild_scheduled_events ?? [];
	guild.embedded_activities = guild.embedded_activities ?? [];
	guild.presences = guild.presences ?? [];

	if (guild.roles)
		for (var i in guild.roles)
			if (!guild.roles[i].flags)
				guild.roles[i].flags = "0";

	return guild as Guild;
};