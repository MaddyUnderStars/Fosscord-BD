import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function(payload) {
	const id: string = payload.d.id;
	this.guilds?.delete(id);
	Dispatcher.dispatch({
		type: "GUILD_DELETE", guild: { id: id },
	});
}

export default handler;