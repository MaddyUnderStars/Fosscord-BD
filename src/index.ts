import { Plugin } from "ittai/entities";
import SettingsPage from "./components/Settings";
import * as settings from "ittai/settings";

import { Client } from "./client/Client";
import Instance from "./entities/Instance";
import { Dispatcher } from "ittai/webpack";

import { React } from "ittai/webpack";

import patches from "./patches";

export default class FosscordPlugin extends Plugin {
	clients: Client[] = [];

	findControllingClient = (id: string[] | string) => {
		if (!Array.isArray(id)) {
			id = [id];
		}

		return this.clients.find(x => x.controlledIds.any(...id));
	};

	// terrible method
	applySettingsChanges = async (instances: Instance[]) => {
		for (let client of this.clients) {
			let index = instances.findIndex(x => x.apiUrl === client.instance?.apiUrl);
			if (index == -1 || !instances[index].enabled) {
				// client has been deleted or disabled
				client.stop();
				for (let [id, guild] of client.guilds) {
					Dispatcher.dispatch({
						type: "GUILD_DELETE", guild: { id: id },
					});
				}
				this.clients.splice(index, 1);
				continue;
			}
		}

		for (let instance of instances) {
			if (!instance.enabled) continue;
			if (this.clients.find(x => x.instance?.apiUrl === instance.apiUrl)) continue;

			let client = new Client();
			await client.login(instance);
			this.clients.push(client);
		}
	};

	start = () => {
		this.setSettingsPanel(() => React.createElement(SettingsPage, { onReload: this.applySettingsChanges }));

		this.doPatches();

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

			for (let [id, guild] of client.guilds) {
				Dispatcher.dispatch({
					type: "GUILD_DELETE", guild: { id: id },
				});
			}
		}
	};

	doPatches = () => {
		for (const patch of patches) {
			patch.call(this);
		}
	};
}