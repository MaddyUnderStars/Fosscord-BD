# FosscordBD ( WIP )
A Discord plugin built with [Ittai](https://git.catvibers.me/Ittai/ittai) that allows connections to multiple Fosscord instances.

# Installation
```
git clone https://github.com/MaddyUnderStars/Fosscord-BD.git
cd Fosscord-BD
npm i
npm run release
```

Afterwhich the `build` directory should contain the plugin files.
* BetterDiscord users can simply copy `build/fosscord.plugin.js` to your plugins folder ( or on Windows `npm run release:bd` to copy there for you ).
* Powercord users will need to create a folder in their `plugins` directory called `fosscord` and copy both `manifest.json` and `fosscord.plugin.js` to it, renaming the latter to just `index.js`
* Goosemod is not currently supported

## Todo
* ~~Render guilds in the client~~ Done
* ~~Allow users to navigate to these guilds~~ Done
* ~~Render messages from guilds~~ Done
* ~~Patch Discord API to send requests to fosscord for IDs we control~~ Half done?
*   * I need a method of determining which IDs Fosscord controls. Currently I just add them to a list of controlled IDs, but it's not guaranteed that I'll receive every ID I need to use from the server first. Is this a contrived issue?
* ~~Render channels in guilds~~ Done!
* ~~Find a way to get images to load properly~~ Done, mostly!
* ~~Fix the Settings screen~~ Mostly done!
* * Bug: deleting a instance breaks the ordering
* ~~Allow message sending~~ ~~Half done! It breaks after the first message :(~~ Done done!
* ~~The move to Ittai broke DMs?~~ Fixed
* ~~Make a PR to Ittai that fixes patching so I don't need to use Zere's library.~~
* ~~Moving to Ittai patching broke guilds without icons ( the flavour text doesn't render )~~
* Handle more dispatch events
* Much more!