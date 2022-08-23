import { OpcodeHandler } from ".";

const handler: OpcodeHandler = function (payload) {
	if (this.sequence < 0)
		this.debug(`Heartbeat ack, ${Date.now() - this.heartbeatSendDt}ms`);
};

export default handler;