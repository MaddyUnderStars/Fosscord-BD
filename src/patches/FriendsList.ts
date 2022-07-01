import { patcher, webpack } from "ittai";
import { React } from "ittai/webpack";
import FosscordPlugin from "..";

export default function (this: FosscordPlugin) {
	patcher.instead(
		"fosscord",
		webpack.findByDisplayName("FriendRow").prototype,
		"render",
		(args, original) => {
			const ret: any = original(...args);
			const user = ret.props.user;

			const client = this.findControllingClient(user.id);
			if (!client) return ret;

			patcher.instead(
				"fosscord",
				ret.props,
				"children",
				(innerArgs, innerOriginal) => {
					const ret: any = innerOriginal(...innerArgs);
					const children: React.ReactElement[] = ret.props.children;

					children[0].props.subText = client.instance!.info?.name ?? new URL(client.instance!.apiUrl!).host;

					return ret;
				}
			);

			return ret;
		}
	);
}