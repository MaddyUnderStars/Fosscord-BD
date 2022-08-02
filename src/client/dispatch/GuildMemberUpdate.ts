import { webpack } from "ittai";
const { Dispatcher } = webpack;
import { DispatchHandler } from ".";

const handler: DispatchHandler = function (payload) {
	const data = payload.d;
	Dispatcher.dispatch({
		type: "GUILD_MEMBER_UPDATE",
		avatar: data.user.avatar,
		communicationDisabledUntil: null,	// TODO: not implemented server-side
		flags: Number(data.user.flags),
		guildId: data.guild_id,
		isPending: data.pending,
		joinedAt: data.joined_at,
		nick: data.nick,
		premiumSince: data.premium_since,
		roles: data.roles || [],
		user: data.user,
	});

	for (var role of data.roles || []) {
		Dispatcher.dispatch({
			type: "GUILD_ROLE_MEMBER_ADD",
			guildId: data.guild_id,
			roleId: role,
			userId: data.user.id,
		});
	}
};

export default handler;