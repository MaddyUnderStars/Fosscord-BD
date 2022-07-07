import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";

export default function (this: FosscordPlugin) {
	patcher.instead(
		"fosscord",
		webpack.findByProps("getLastEditableMessage"),
		"getLastEditableMessage",
		(args, original, thisArg) => {
			const channelId = args[0];
			const client = this.findControllingClient(channelId);
			if (!client) return original(channelId);

			const messages = thisArg.getMessages(channelId).toArray().reverse();
			const message = messages.find((message: any) => {
				return message.author.id == client.user?.id
					&& message.state == "SENT";
			});
			return message;
		}
	);
}