import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function (payload) {
	const data = payload.d;

	console.log(data);

	Dispatcher.dispatch({
		type: "MESSAGE_DELETE",
		id: data.id,
		channelId: data.channel_id,
	});
};

export default handler;