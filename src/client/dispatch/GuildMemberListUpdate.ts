import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";
import { makeUser } from "../../entities/User";

const handler: DispatchHandler = function (payload) {
	const data = payload.d;

	const presenceUpdates = [];

	for (var ops of data.ops) {
		if (Array.isArray(ops.items))
			for (var item of ops.items) {
				if (item?.member?.user) {
					item.member.user = makeUser(item.member.user, this);
					delete item.member.user.user;	// too lazy to fix in the makeUser method

					if (item.member.presence) {
						const presence = item.member.presence;
						presenceUpdates.push({
							activities: [],
							clientStatus: {},
							status: presence.status,
							user: presence.user,
							guildId: item.member.guild_id,
							id: presence.id,
						});
					}
				}
			}
	}

	Dispatcher.dispatch({
		type: "PRESENCE_UPDATES",
		updates: presenceUpdates
	});

	Dispatcher.dispatch({
		type: "GUILD_MEMBER_LIST_UPDATE",
		groups: data.groups,
		guildId: data.guild_id,
		id: data.id,
		memberCount: data.member_count,
		ops: data.ops,
	});
};

export default handler;