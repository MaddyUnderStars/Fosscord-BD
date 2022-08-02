import { webpack } from "ittai";
const { Dispatcher } = webpack;
import { DispatchHandler } from ".";

const handler: DispatchHandler = function(payload) {
	Dispatcher.dispatch({
		type: "USER_NOTE_UPDATE", note: payload.d.note, id: payload.d.id,
	});
}

export default handler;