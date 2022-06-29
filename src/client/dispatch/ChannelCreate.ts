import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";
import { makeChannel } from "../../entities/Channel";

const handler: DispatchHandler = function (payload) {
	// TODO: Fosscord sends User objects instead of user ID array as intended.
	if (payload.d.recipients) {
		var newRecipients = [];
		for (var recipient of payload.d.recipients) {
			if (recipient.id) newRecipients.push(recipient.id);
			else if (!isNaN(recipient)) newRecipients.push(recipient)
		}
		payload.d.recipients = newRecipients;
	}

	Dispatcher.dispatch({
		type: "CHANNEL_CREATE",
		channel: makeChannel(payload.d, this),
	})
};

export default handler;