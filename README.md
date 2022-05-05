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
* ~~Allow users to navigate to these guilds~~ Done
* ~~Render messages from guilds~~ Done
* Render channels
* Handle dispatch events besides ready ( eg message create, etc )
* ~~Patch Discord API to send requests to fosscord for IDs we control~~ Half done?
  * I need a method of determining which IDs Fosscord controls. Currently I just add them to a list of controlled IDs, but it's not guaranteed that I'll receive every ID I need to use from the server first. Is this a contrived issue?
* Lots more!