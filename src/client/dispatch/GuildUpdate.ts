import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";
import { makeGuild } from "../../entities/Guild";

const handler: DispatchHandler = function(payload) {
	Dispatcher.dispatch({
		type: "GUILD_UPDATE", guild: makeGuild(payload.d, this),
	});
}

export default handler;