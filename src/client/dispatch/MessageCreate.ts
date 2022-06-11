import { webpack } from "ittai";
import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function (payload) {
	const data = payload.d; //as Message;

	const messageInternal = webpack.findByProps("canEditMessageWithStickers") as any;
	const message = messageInternal.createMessageRecord(data);

	Dispatcher.dispatch({
		type: "MESSAGE_CREATE", channelId: data.channel_id, message: message
	});
};

export default handler;