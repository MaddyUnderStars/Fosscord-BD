import { OpcodeHandler } from ".";

const handler: OpcodeHandler = function(payload) {
	this.error("Invalid session", payload);
}

export default handler;