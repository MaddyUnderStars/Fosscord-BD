# FosscordBD ( WIP )
A Discord plugin built with [Ittai](https://git.catvibers.me/Ittai/ittai) that allows connections to multiple [Fosscord](https://github.com/fosscord/fosscord-server) instances.

# Installation
## Powercord/Replugged:
In your plugins folder:
```
git clone https://github.com/MaddyUnderStars/Fosscord-BD.git
cd Fosscord-BD
npm i
npm run release:pc
```

## BetterDiscord
Anywhere:
```
git clone https://github.com/MaddyUnderStars/Fosscord-BD.git
cd Fosscord-BD
npm i
npm run release:bd
```
And then copy `build/fosscord.plugin.js` to your plugins folder.
On Windows, you can use `npm run release:bd:install` to do it for you.

# Usage
To start using the plugin, add a Fosscord instance to the plugin settings. See the "New Instance" dropdown. You must include:
* The API URL of the instance ( ie: `https://slowcord.understars.dev/api` )
* Your login credentials
* * Login token
* * Username and password by clicking "Login with password"
* **DO NOT PROVIDE DISCORD.COM LOGIN CREDENTIALS UNLESS LOGGING INTO DISCORD.COM ONLY PROVIDE CREDS FOR THE INSTANCE YOU'RE USING.**

You may add as many instances as you like.

## Pitfalls
* Uploading attachments does not currently work, due to servers not implementing desktop uploads.
* You cannot create guilds through the plugin yet, you must join/create them on the web client first.
* DMs don't populate properly yet, you can instead right click -> message to open the DM
* Lots more, probably. Core functionality is there, though.

## Configuration
Some instances are misconfigured, or don't support every feature of the plugin. You can manually correct for these cases by editing the plugin config file. Below is an example config:
```js
"settings": {
	"instances": [{
		"enabled": true,
		"apiUrl": "https://slowcord.understars.dev/api",
		"token": "login token",
		"gatewayUrl": "wss://slowcord.understars.dev",	// some instances may have javascript here. replace it.
		"cdnUrl": "slowcord.understars.dev",	// see above. Do not include http/https
		"info": {
			// Instance metadata. Does not effect functionality
		},
		"useExperimentalFeatures": true		// Some instances don't support these. Slowcord always will :p
	}]
}
```

Current 'experimental features' include:
* Rich presence - Eg. Games and Spotify