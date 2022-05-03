declare module global {
	export var ZeresPluginLibrary: boolean;
}

declare module ZLibrary {
	export var DiscordModules: {
		Dispatcher: {
			dispatch(event: {
				type: string,
				[key: string]: any;
			}): void;
		}
	};

	export var PluginUpdater: {
		checkForUpdate(name: string, version: string, updateUrl: string): void;
	}
}