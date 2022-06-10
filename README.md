# FosscordBD ( WIP )
A Discord plugin built with [Ittai](https://git.catvibers.me/Ittai/ittai) that allows connections to multiple Fosscord instances.

## installation
```bash
git clone git@github.com:MaddyUnderStars/Fosscord-BD.git
cd Fosscord-BD
npm i
npm run build
```

`build` will compile the plugin for BetterDiscord in the `build` directory, which you can then copy to your plugins folder.
On Windows, you can alternatively use `build:windows` to build and install to your BD plugins folder. 

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
* Make a PR to Ittai that fixes patching so I don't need to use Zere's library.
* Handle more dispatch events
* The move to Ittai broke DMs?
* Much more!