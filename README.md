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