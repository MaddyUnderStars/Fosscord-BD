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
  * Guild avatars/profiles aren't supported in fosscord and so avatars also break ( only sometimes, though )
* ~~Fix the Settings screen~~ Mostly done!
* * ~~Bug: deleting a instance breaks the ordering~~ Fixed
* * ~~Logging in with username/password~~ Done
* * Settings screen kinda sucks
* ~~Allow message sending~~ ~~Half done! It breaks after the first message :(~~ Done done!
* ~~The move to Ittai broke DMs?~~ Fixed
* ~~Make a PR to Ittai that fixes patching so I don't need to use Zere's library.~~
* ~~Moving to Ittai patching broke guilds without icons ( the flavour text doesn't render )~~
* Member list is broken, and sometimes also breaks on discord.com guilds
* Friends lists
* Creating a DM doesn't find an existing DM, it creates a new one each time
* Loading weird channel types or messages breaks guild navigation ( looking at you znw.social )
* Embeds sometimes don't display properly, but after reloading they do
* Fosscord invite rendering
* Presences
* User notes
* Perhaps rendering your current fosscord account in place of the discord account in bottom left would be a good idea
* Sending emoji works, but users must be in the same fosscord instance and possibily even guild to render them. Perhaps just send the link?
* Handle more dispatch events
* Much more!
* Maybe I should move this list to github issues