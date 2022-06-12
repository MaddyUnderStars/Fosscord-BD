import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function(payload) {
	Dispatcher.dispatch({
		type: "USER_NOTE_UPDATE", note: payload.d.note, id: payload.d.id,
	});
}

export default handler;