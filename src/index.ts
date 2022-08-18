import { Plugin } from "ittai/entities";
import SettingsPage from "./components/Settings";
import * as settings from "ittai/settings";

import { Client } from "./client/Client";
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

	// was being incredibly annoying so here we are
	applySettingsChanges = async (instances: Instance[]) => {
		const compareInstance = (left: Instance, right: Instance) => left.token == right.token && left.apiUrl == right.apiUrl;
		const intersection = (curr: Instance[], prev: Instance[]) => curr.filter(x => !prev.some(y => compareInstance(x, y)));
		const old = this.clients.map(x => x.instance) as Instance[];

		for (let instance of intersection(old, instances)) {
			const index = this.clients.findIndex(x => x.instance?.apiUrl == instance.apiUrl && x.instance?.token == instance.token);
			this.cleanupClient(this.clients[index]);
			this.clients.splice(index, 1);
		}

		for (let instance of intersection(instances, old).filter(x => x.enabled)) {
			if (!instance) continue;
			this.log(`Starting instance ${instance.apiUrl}`);
			const client = new Client();
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

		for (const patch of patches) {
			patch.call(this);
		}

		for (let instance of settings.get("instances", [])) {
			if (!instance.enabled) continue;

			let client = new Client();
			client.login(instance);
			this.clients.push(client);
		}
	};

	cleanupClient = (client: Client) => {
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
			});
		}
	};

	stop = () => {
		while (this.clients.length) {
			this.cleanupClient(this.clients.shift()!);
		}
	};
}