declare module global {
	export var ZeresPluginLibrary: boolean;
}

declare module ZLibrary {
	export var DiscordModules: {
		Dispatcher: {
			dispatch(event: {
				type: string,
				channelId: string,
				message: any;	// TODO: Message object
				optimistic?: boolean;
				isPushNotification?: boolean;
			}): void;
		}
	};

	export var PluginUpdater: {
		checkForUpdate(name: string, version: string, updateUrl: string): void;
	}
}