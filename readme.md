# Kai DJ

Proprietary discord music bot written in node.js, uses discord.js. Features:
 - Can play YouTube video if provided url to `/hraj` command
 - If instead of url a text is provided the bot will search the text on youtube and play the first result
 - If more songs are requested the bot will add them to playlist and play one by one
 - Downloads and caches music clips to reuse later to save bandwith

## Run
1. If you don't have a bot, in Discord developer portal create a new app and add a bot user to it
2. Set environment variables:
   - `DISCORD_APPLICATION_ID` - discord application id
   - `DISCORD_GUILD_ID` - id of the server where you want to run the bot
   - `DISCORD_BOT_TOKEN` - your discord app bot token
3. If you're running the bot for the fist time run you need to deploy it's slash commands by running:
    > npm run deploy
4. To start the actual bot run:
   > npm run dj

Make sure the bot is on your discord server before you try to use it. You can check for it by typing `/hraj` to see 

