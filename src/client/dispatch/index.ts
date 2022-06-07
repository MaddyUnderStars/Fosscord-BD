import { Client, GatewayPayload } from "../Client";

export type DispatchHandler = (this: Client, payload: GatewayPayload) => any;

import Ready from "./Ready";

const handlers: { [key: string]: DispatchHandler; } = {
	"READY": Ready,
};

export default handlers;