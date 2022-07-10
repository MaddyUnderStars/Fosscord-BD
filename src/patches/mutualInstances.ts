import { patcher, webpack } from "ittai";
import { React } from "ittai/webpack"
import FosscordPlugin from "..";

import MutualInstances from "../components/MutualInstances";

export default function (this: FosscordPlugin) {
	// patcher.instead(
	// 	"fosscord",
	// 	webpack.find(x => x.default?.displayName == "UserProfileModal"),
	// 	"default",
	// 	(args, original) => {
	// 		const modalRet = original(...args);

	// 		// yuck
	// 		const tabBar = modalRet.props.children.props.children.props.children[0].props.children[1];

	// 		patcher.instead(
	// 			"fosscord",
	// 			tabBar,
	// 			"type",
	// 			(args, original) => {
	// 				const tabsRet = original(...args);
	// 				const tabs = tabsRet.props.children.props.children;

	// 				tabs.push(React.createElement(MutualInstances));
	// 			}
	// 		);

	// 		return modalRet;
	// 	}
	// );

	// patcher.after("UserBannerPatch", webpack.find(m => m.default?.displayName === "UserBanner"), "default", ([props]: [user: any], res, _this) => {
    //     res.props.children.push(React.createElement(MutualInstances));
    // })
}