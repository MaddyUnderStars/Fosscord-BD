import { webpack } from "ittai";
const { Dispatcher } = webpack;
import { DispatchHandler } from ".";

const handler: DispatchHandler = function (payload) {
	Dispatcher.dispatch({
		type: "RELATIONSHIP_REMOVE",
		relationship: {
			id: payload.d.id,
			type: payload.d.type
		}
		
	});
	this.relationships.delete(payload.d.id);
};

export default handler;