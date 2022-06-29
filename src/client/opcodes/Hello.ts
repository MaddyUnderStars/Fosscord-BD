import { OpcodeHandler } from ".";

const handler: OpcodeHandler = function(payload) {
	this.setHeartbeat(payload.d.heartbeat_interval);
}

export default handler;