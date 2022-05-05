# FosscordBD ( WIP )
A BetterDiscord plugin that allows connections to multiple Fosscord instances.

## Build
In BetterDiscord plugin dir:
```
git clone https://github.com/MaddyUnderStars/Fosscord-BD.git
cd Fosscord-BD
npm run build
```
The output will be built in the plugin directory.

## Todo

* ~~Render guilds in the client~~ Done
* ~~Allow users to navigate to these guilds~~ done, render channels
* Handle dispatch events besides ready ( eg message create, etc )
* Patch Discord API to send requests to fosscord for IDs we control
* Lots more!