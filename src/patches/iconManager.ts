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

		return originalRet.replace(GLOBAL_ENV.CDN_HOST, client.instance?.cdnUrl);
	};


	let iconManager = webpack.findByProps("getUserAvatarURL", "hasAnimatedGuildIcon");
	for (let method of [
		"getUserAvatarURL",
		"getGuildMemberAvatarURLSimple",
		"getGuildIconURL",
		"getEmojiURL",
		"getGuildBannerURL",
		"getUserBannerURL",
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
			"getEmojiURL",
			"getUserBannerURL",
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

			return `${location.protocol}//${client.instance?.cdnUrl}/banners/${user.id}/${user.banner}?size=${size}`;
		}
	);

	patcher.instead(
		"fosscord",
		webpack.findByPrototype("getAvatarURL", "addGuildAvatarHash").prototype,
		"getAvatarURL",
		(args, original) => {
			const ret: any = original(...args);
			const client = this.findControllingClient([args[0], ...findIds(ret.split("/"))]);
			if (!client) return ret;

			return ret.replace(GLOBAL_ENV.CDN_HOST, client.instance!.cdnUrl);
		}
	);

	patcher.instead(
		"fosscord",
		webpack.findByProps("getStickerAssetUrl"),
		"getStickerAssetUrl",
		(args, original) => {
			const ret: any = original(...args);
			const client = this.findControllingClient(args[0].guild_id);
			if (!client) return ret;

			// why are there slashes in this???
			const media_proxy_endpoint = GLOBAL_ENV.MEDIA_PROXY_ENDPOINT.split("/").join("");
			return ret.replace(media_proxy_endpoint, client.instance!.cdnUrl);
		}
	)
}