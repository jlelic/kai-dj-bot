import { REST, Routes } from 'discord.js'
import fs from 'node:fs'
import * as dotenv from 'dotenv'

dotenv.config()

const commands = []
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))


import hrajCommand from './commands/hraj.js'
commands.push(hrajCommand.data.toJSON())
import otazkaCommand from './commands/otazka.js'
commands.push(otazkaCommand.data.toJSON())
// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
// for (const file of commandFiles) {
//     import command from `./commands/${file}`
//     commands.push(command.data.toJSON())
// }

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`)

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, 1076160846528532611),
            { body: commands },
        )

        console.log(`Successfully reloaded ${data.length} application (/) commands.`)
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error)
    }
})()
