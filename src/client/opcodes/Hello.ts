import { OpcodeHandler } from ".";
import { Client, GatewayPayload } from "../Client";

const handler: OpcodeHandler = function(payload) {
	this.setHeartbeat(payload.d.heartbeat_interval);
}

export default handler;