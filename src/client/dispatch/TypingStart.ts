import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function (payload) {
	Dispatcher.dispatch({
		type: "TYPING_START",
		channelId: payload.d.channel_id,
		userId: payload.d.user_id
	})
};

export default handler;