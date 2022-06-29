import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function (payload) {
	Dispatcher.dispatch({
		type: "RELATIONSHIP_REMOVE",
		relationship: {
			id: payload.d.id,
			type: payload.d.type
		}
		
	})
};

export default handler;