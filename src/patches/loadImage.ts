import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";
import { findIds } from "../util/Snowflake";

export default function (this: FosscordPlugin) {
	patcher.instead(
		"loadImage",
		webpack.findByProps("isImageLoaded", "loadImage", "getBestMediaProxySize"),
		"loadImage",
		(args, original) => {
			let [url, callback]: [string, any] = args;
			const client = this.findControllingClient(
				[
					...findIds(url.split(".").join("/").split("/")),
					...findIds(window.location.href.split("/")),
				]
			);
			if (!client) return original(...args);

			url = url.replace(GLOBAL_ENV.CDN_HOST, client.instance?.cdnUrl!);
			return original(url, callback);
		}
	);
}