import { webpack } from "ittai";
const { Dispatcher } = webpack;
import { DispatchHandler } from ".";

const MessageStore = webpack.findByProps("getMessage", "getRawMessages", "getLastEditableMessage");

const handler: DispatchHandler = function (payload) {
	const data = payload.d; //as Message;

	const messageInternal = webpack.findByProps("canEditMessageWithStickers") as any;
	const message = messageInternal.createMessageRecord(data);

	// TODO: server sends malformed embeds
	for (var embed of message.embeds) {
		embed.title = embed.title ?? embed.rawTitle;
		embed.description = embed.description ?? embed.rawDescription;
		for (var field of embed.fields) {
			field.name = field.name ?? field.rawName;
			field.value = field.value ?? field.rawValue;
		}
	}

	if (message.messageReference) { // huh?
		message.referenced_message = MessageStore.getMessage(message.messageReference.channel_id, message.messageReference.message_id);
		message.message_reference = message.messageReference; // huhhh???
	}

	Dispatcher.dispatch({
		type: "MESSAGE_CREATE", channelId: data.channel_id, message: message
	});
};

export default handler;