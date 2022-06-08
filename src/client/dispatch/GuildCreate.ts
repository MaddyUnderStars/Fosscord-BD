import { DispatchHandler } from ".";
import DispatchGuild from "../../util/DispatchGuild";

const handler: DispatchHandler = function(payload) {
	DispatchGuild(payload.d, this);
}

export default handler;