import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function(payload) {
	const data = payload.d;
	Dispatcher.dispatch({
		type: "GUILD_MEMBER_LIST_UPDATE",
		groups: data.groups,
		guildId: data.guild_id,
		id: data.id,
		memberCount: data.member_count,
		ops: data.ops,
	})
}

export default handler;