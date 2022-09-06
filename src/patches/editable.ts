import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";

export default function (this: FosscordPlugin) {
	patcher.instead(
		"lastEditableMessage",
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

	patcher.instead(
		"messageToolbar",
		webpack.findByProps("useConnectedUtilitiesProps").default,
		"type",
		(args, original) => {
			const e = args[0];
			const author_id = e?.message?.author.id;
			const client = this.findControllingClient(author_id);
			if (!client) return original(...args);

			if (e.message.author.id == client.user!.id) {
				const currentUser = webpack.findByProps("getCurrentUser", "getUser").getCurrentUser();
				e.message.author.id = currentUser.id; 
			}

			const ret = original(e);

			e.message.author.id = author_id;

			return ret;
		}
	)
}