import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";
import { makeChannel } from "../../entities/Channel";

const handler: DispatchHandler = function (payload) {
	Dispatcher.dispatch({
		type: "CHANNEL_DELETE",
		channel: makeChannel(payload.d, this),
	})
};

export default handler;