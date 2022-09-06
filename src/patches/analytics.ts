import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";

export default function (this: FosscordPlugin) {
	// Anti tracking stuff
	patcher.instead(
		"analytics",
		webpack.findByProps("track", "setSystemAccessibilityFeatures"),
		"track",
		(args: any[], original: any) => {
			// let client = this.findControllingClient(window.location.href.split("/"));
			// if (!client) return original(...args);
			// client.log("Blocking track");
			return;
		}
	);
}