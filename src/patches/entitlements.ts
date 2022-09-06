import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";

export default function (this: FosscordPlugin) {
	// Anti tracking stuff
	patcher.instead(
		"fosscord",
		webpack.findByProps("fetchEntitlementsForGuild"),
		"fetchEntitlementsForGuild",
		(args: any[], original: any) => {
			const guild_id = args[0];
			const client = this.findControllingClient(guild_id);

			if (!client)
				return original(...args);

			client.debug("Preventing fetchEntitlementsForGuild, not impl serverside");
			return;
		}
	);
}