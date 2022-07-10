import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";

const { getCurrentUser } = webpack.findByProps("getCurrentUser");

export default function (this: FosscordPlugin) {
	patcher.instead(
		"fosscord",
		webpack.findByPrototype("hasCommunityInfoSubheader").prototype,
		"isOwner",
		(args: any[], original: any, thisArg: any) => {
			const client = this.findControllingClient(thisArg.id);
			if (!client) return original(...args);

			const requestId = isNaN(args[0]) ? args[0].id : args[0];

			const stockUser = getCurrentUser();
			const id = requestId == stockUser.id ? client.user?.id : requestId; 

			return id == thisArg.ownerId;
		}
	);

	// patcher.instead(
	// 	"fosscord",
	// 	webpack.findByProps("getGuildPermissions", "can"),
	// 	"can",
	// 	(args, original) => {
	// 		console.log(args);
	// 		const ret = original(...args);
	// 		console.log(ret);
	// 		return ret;
	// 	}
	// )
}