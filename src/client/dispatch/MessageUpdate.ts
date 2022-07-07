import { webpack } from "ittai";
import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function (payload) {
	const data = payload.d; //as Message;

	const messageInternal = webpack.findByProps("canEditMessageWithStickers") as any;
	// TODO: Theres a updateMessageRecord function as well
	// might be good to use that instead?
	// this works though
	const message = messageInternal.createMessageRecord(data);

	Dispatcher.dispatch({
		type: "MESSAGE_UPDATE", message: message,
	});
};

export default handler;