import { Client, GatewayOpcode, GatewayPayload } from "../Client";

export type OpcodeHandler = (this: Client, payload: GatewayPayload) => any;

const handlers: { [key: number]: OpcodeHandler; } = {
	0: require("./Dispatch").default,
	9: require("./InvalidSession").default,
	10: require("./Hello").default,
	11: require("./HeartbeatAck").default,
};

export default handlers;