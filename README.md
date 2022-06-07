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
  * I need a method of determining which IDs Fosscord controls. Currently I just add them to a list of controlled IDs, but it's not guaranteed that I'll receive every ID I need to use from the server first. Is this a contrived issue?
* Make a PR to Ittai that fixes patching so I don't need to use Zere's library.
* Fix the Settings screen 
* Render channels in guilds
* Handle more dispatch events
* Find a way to get images to load properly
* The move to Ittai broke DMs?
* Much more!