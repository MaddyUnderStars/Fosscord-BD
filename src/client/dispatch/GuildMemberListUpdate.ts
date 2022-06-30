import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";
import { makeUser } from "../../entities/User";

const handler: DispatchHandler = function (payload) {
	const data = payload.d;

	for (var ops of data.ops) {
		if (Array.isArray(ops.items))
			for (var item of ops.items) {
				if (item?.member?.user) {
					item.member.user = makeUser(item.member.user, this);
					delete item.member.user.user;	// too lazy to fix in the makeUser method 
				}
			}
	}

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