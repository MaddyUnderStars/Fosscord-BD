import { Client, GatewayOpcode, GatewayPayload } from "../Client";

import Hello from "./Hello";
import HeartbeatAck from "./HeartbeatAck";
import Dispatch from "./Dispatch"

export type OpcodeHandler = (this: Client, payload: GatewayPayload) => any;

const handlers: { [key: number]: OpcodeHandler; } = {
	0: Dispatch,
	10: Hello,
	11: HeartbeatAck,
};

export default handlers;