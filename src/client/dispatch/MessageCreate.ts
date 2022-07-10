import { webpack } from "ittai";
import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

// const MessageStore = webpack.findByProps("getMessage", "getRawMessages", "getLastEditableMessage");

const handler: DispatchHandler = function (payload) {
	const data = payload.d; //as Message;

	const messageInternal = webpack.findByProps("canEditMessageWithStickers") as any;
	const message = messageInternal.createMessageRecord(data);

	// if (data.message_reference) // huh?
		// message.referenced_message = MessageStore.getMessage(data.message_reference.channel_id, data.message_reference.message_id);

	Dispatcher.dispatch({
		type: "MESSAGE_CREATE", channelId: data.channel_id, message: message
	});
};

export default handler;