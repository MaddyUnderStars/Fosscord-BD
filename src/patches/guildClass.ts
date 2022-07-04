import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";

export default function (this: FosscordPlugin) {
	patcher.instead(
		"fosscord",
		webpack.findByPrototype("hasCommunityInfoSubheader").prototype,
		"isOwner",
		(args: any[], original: any, thisArg: any) => {
			const client = this.findControllingClient(thisArg.id);
			if (!client) return original(...args);

			// const id = isNaN(args[0]) ? args[0].id : args[0];

			// this makes the client think you're the owner, sure
			// but it also makes it think every other member is the owner,
			// preventing you from acting on other users.
			// the first arg in this function is either a user object or user ID
			// but what gets me is that, for my test guild,
			// the user ID passed is NEVER the logged in user ( fosscord or discord.com ),
			// instead, the Slowcord bot user gets passed?
			return client.user?.id == thisArg?.ownerId;
		}
	);
}