import { Plugin } from "ittai/entities";
import SettingsPage from "./components/Settings";
import * as settings from "ittai/settings";

import { Client } from "./client/Client";
import Instance from "./entities/Instance";
import { Dispatcher } from "ittai/webpack";

import { React } from "ittai/webpack";
import loadAll from "./util/loadAll";

export default class FosscordPlugin extends Plugin {
	clients: Client[] = [];

	findControllingClient = (id: string[] | string) => {
		if (!Array.isArray(id)) {
			id = [id];
		}

		return this.clients.find(x => x.controlledIds.any(...id));
	};

	// was being incredibly annoying so here we are
	applySettingsChanges = async (instances: Instance[]) => {
		this.stop();
		for (let instance of instances) {
			if (!instance.enabled) continue;

			let client = new Client();
			await client.login(instance);
			this.clients.push(client);
		}
	};

	// Called by BetterDiscord
	load = () => {
		this.setSettingsPanel(() => React.createElement(SettingsPage, { onReload: this.applySettingsChanges }));
	};

	start = () => {
		this.load();

		for (const patch of loadAll(require.context("./patches", true, /\.ts$/))) {
			patch.call(this);
		}

		for (let instance of settings.get("instances", [])) {
			if (!instance.enabled) continue;

			let client = new Client();
			client.login(instance);
			this.clients.push(client);
		}
	};

	stop = () => {
		for (let client of this.clients) {
			client.stop();

			// cleanup guilds we added
			for (let [id, guild] of client.guilds) {
				Dispatcher.dispatch({
					type: "GUILD_DELETE", guild: { id: id },
				});
			}

			// cleanup friends list
			for (let [id, relationship] of client.relationships) {
				Dispatcher.dispatch({
					type: "RELATIONSHIP_REMOVE",
					relationship: {
						type: 4,
						id: id,
					},
				})
			}
		}
	};
}