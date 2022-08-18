import { Client, GatewayPayload } from "../Client";

export type OpcodeHandler = (this: Client, payload: GatewayPayload) => any;

import Dispatch from "./Dispatch";
import InvalidSession from "./InvalidSession";
import Hello from "./Hello";
import HeartbeatAck from "./HeartbeatAck";

const handlers: { [key: number]: OpcodeHandler; } = {
	0: Dispatch,
	9: InvalidSession,
	10: Hello,
	11: HeartbeatAck,
};

export default handlers;