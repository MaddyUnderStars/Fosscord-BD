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
		},

		GuildChannelsStore: {
			getChannels(id: string): any;
		};

		ChannelStore: {
			getChannels(id: string): any;
		},
		
		GuildStore: {
			getGuild(id: string): any
		}

		APIModule: {
			get(url: string): any,
			post(url: string): any,
			put(url: string): any,
			patch(url: string): any,
			delete(url: string): any,
			getAPIBaseURL(): any,
		}
	};

	export var Patcher: {
		before(caller: string, module: any, func: string, callback: any): void;
		after(caller: string, module: any, func: string, callback: any): void;
		instead(caller: string, module: any, func: string, callback: any): void;
		unpatchAll(caller: string): void;
	};

	export var WebpackModules: {
		getByProps(...args: string[]): void;
	};

	export var PluginUpdater: {
		checkForUpdate(name: string, version: string, updateUrl: string): void;
	};
}