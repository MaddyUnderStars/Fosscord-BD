import { OpcodeHandler } from ".";
import { findIds } from "../../util/Snowflake";
import { ClientEvent } from "../Client";
import DispatchHandlers from "../dispatch";

const handler: OpcodeHandler = function (payload) {
	this.sequence = payload.s!;

	for (let id of findIds(payload.d))
		this.controlledIds.add(id);

	const handler = DispatchHandlers[payload.t!];
	if (handler) {
		handler.call(this, payload);
	}

	this.dispatchEvent(new ClientEvent(payload.t!, payload.d));
	this.dispatchEvent(new ClientEvent("dispatch", payload));
};

export default handler;