import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";
import { findIds } from "../util/Snowflake";

export default function (this: FosscordPlugin) {
	const iconManagerPatch = (args: any[], original: any) => {
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
	};


	let iconManager = webpack.findByProps("getUserAvatarURL", "hasAnimatedGuildIcon");
	for (let method of [
		"getUserAvatarURL",
		"getGuildMemberAvatarURLSimple",
		"getGuildIconURL",
		"getEmojiURL",
		"getGuildBannerURL",
	]) {
		if (!iconManager[method]) continue;	// just in case
		patcher.instead(
			"fosscord",
			iconManager,
			method,
			iconManagerPatch,
		);
	}

	// I can't remember if this is also available in Powercord
	// It should but idk
	if (iconManager.default) {
		for (let method of [
			"getGuildMemberAvatarURLSimple",
			"getGuildIconURL",
			"getGuildBannerURL",
			"getUserAvatarURL",
			"getEmojiURL"
		]) {
			if (!iconManager.default[method]) continue;	// just in case
			patcher.instead(
				"fosscord",
				iconManager.default,
				method,
				iconManagerPatch,
			);
		}
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

	patcher.instead(
		"fosscord",
		webpack.findByPrototype("getAvatarURL", "addGuildAvatarHash").prototype,
		"getAvatarURL",
		(args, original) => {
			let ret = original(...args);
			const client = this.findControllingClient(args[0]);
			if (!client) return ret;

			return ret.replace("https://cdn.discordapp.com", client.instance!.cdnUrl);
		}
	);
}