import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";
import { findIds } from "../util/Snowflake";

export default function (this: FosscordPlugin) {
	let iconManager = webpack.findByProps("getUserAvatarURL", "hasAnimatedGuildIcon");
	if (iconManager.default) iconManager = iconManager.default;		// BetterDiscord ????
	for (let method of [
		"getUserAvatarURL",
		"getGuildMemberAvatarURLSimple",
		"getGuildIconURL",
		"getEmojiURL",
		"getGuildBannerURL",
	]) {
		patcher.instead(
			"fosscord",
			iconManager,
			method,
			(args: any[], original: any) => {
				const data = args[0];
				const client = this.findControllingClient(findIds(data));
				let originalRet = original(...args);
				if (!client || !originalRet) return originalRet;

				if (originalRet.indexOf("/guilds/") != -1) {
					// fosscord doesn't yet support this
					const parsed = new URL(originalRet);
					const split = parsed.pathname.split("/");
					const userId = split[4];
					const avatar = split[6];
					parsed.pathname = `/avatars/${userId}/${avatar}`;
					originalRet = parsed.toString();
				}

				return originalRet.replace("https://cdn.discordapp.com", client.instance?.cdnUrl);
			}
		);
	}

	patcher.instead(
		"fosscord",
		webpack.findByProps("getUserBannerURLForContext"),
		"getUserBannerURLForContext",
		(args: any[], original: any) => {
			const { user, guildMember, size } = args[0];
			const client = this.findControllingClient(findIds(user));
			if (!client) return original(...args);

			return `${client.instance?.cdnUrl}/banners/${user.id}/${user.banner}?size=${size}`;
		}
	);
}