import { webpack } from "ittai";
const { Dispatcher } = webpack;
import { DispatchHandler } from ".";
import { makeGuild } from "../../util/Builders";

const handler: DispatchHandler = function(payload) {
	Dispatcher.dispatch({
		type: "GUILD_UPDATE", guild: makeGuild(payload.d, this),
	});
}

export default handler;