import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";

export default function (this: FosscordPlugin) {
	// TODO: figure out why this experiment breaks when stopping/starting plugin from settings
	patcher.instead(
		"fosscord",
		webpack.findByProps("useIsAnyGuildInPassportGuildExperiment"),
		"useIsAnyGuildInPassportGuildExperiment",
		(args: any[], original: any) => {
			return false;
		}
	);
}