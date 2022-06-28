// Note: Handles both session and presence updates

import { Dispatcher } from "ittai/webpack";
import { DispatchHandler } from ".";

const handler: DispatchHandler = function (payload) {
	const updates = [];

	// TODO: this should not be here
	// there's most likely a different dispatch event for this
	if (payload.t == "SESSIONS_REPLACE") {
		for (var update of payload.d) {
			updates.push({
				activities: update.activities,
				clientStatus: update.client_info,
				id: update.id,
				guildId: update.guild_id,
				user: { id: update.user_id },
			});
		}
	}
	else if (payload.t == "PRESENCE_UPDATE") {
		updates.push({
			activities: payload.d.activities,
			clientStatus: payload.d.client_status,
			status: payload.d.status,
			user: payload.d.user,
			guildId: payload.d.guild_id,	// not always available
			id: payload.d.idea,				// ^
		})
	}

	Dispatcher.dispatch({
		type: "PRESENCE_UPDATES",
		updates: updates
	});
};

export default handler;