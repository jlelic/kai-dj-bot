// Require the necessary discord.js classes
const { REST, Routes, Client, Events, GatewayIntentBits, Collection, SlashCommandBuilder } = require('discord.js')
require('dotenv').config()
const { createReadStream } = require('node:fs')
const path = require('path')
const fetch = require('node-fetch')
const {
    joinVoiceChannel,
    createAudioResource,
    AudioPlayerStatus,
    createAudioPlayer,
} = require('@discordjs/voice')

const { prepareYoutubeSong, waitTilReady, isSongCached } = require('./downloader')
const { findSongInfo } = require('./finder')


const PRODUCTION = false

const token = process.env.DISCORD_BOT_TOKEN

const playlist = []
let connection, subscription
const player = createAudioPlayer()


async function playNextSong() {
    const songInfo = playlist.shift()
    if(!songInfo) {
        console.log('The playlist is empty!')
    }
    const { interaction, id, title } = songInfo
    if(!isSongCached(id)) {
        interaction.followUp({content: `Stahujem ${title}`,ephemeral: PRODUCTION})
    }
    const songData = await waitTilReady(id)
    const resource = createAudioResource(createReadStream(songData.path))
    player.play(resource)
    const nextSongDescription = playlist.length ? ` Potom si vypocujeme ${playlist[0].title}` : ''
    return await interaction.followUp({ content: `Pome pome vsetci ruky hore ${songData.link}${nextSongDescription}`, ephemeral: false })
}


player.on('error', error => {
    console.error(`Player status: Error: ${error.message} with resource`)
    console.log(error)
})

player.on(AudioPlayerStatus.Idle, () => {
    console.log('Player status: Idle')
    playNextSong()
})

player.on(AudioPlayerStatus.Playing, () => {
    console.log('Player status: Playing')
})

player.on(AudioPlayerStatus.Paused, () => {
    console.log('Player status: Paused')
})

player.on(AudioPlayerStatus.AutoPaused, () => {
    console.log('Player status: AutoPaused')
})

player.on(AudioPlayerStatus.Buffering, () => {
    console.log('Player status: Buffering')
})

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates] })

client.commands = new Collection()


// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`)
})

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return

    //const command = interaction.client.commands.get(interaction.commandName)

    // if (!command) {
    //     console.error(`No command matching ${interaction.commandName} was found.`)
    //     return
    // }

    try {
        // await command.execute(interaction)
        // const channel =(await interaction.guild.channels.fetch(
        //         undefined, { cache: false, force: true })
        // ).find(
        //     c => c.isVoiceBased() && c.members.has(interaction.member.user.id)
        // )
        const channel = interaction.member?.voice.channel
        if (!channel) {
            return await interaction.reply({ content: 'Nie si na voice :reto:', ephemeral: PRODUCTION })
        }

        if (!channel.joinable) {
            return await interaction.reply({ content: 'Neviem joinut channel', ephemeral: PRODUCTION })
        }
        console.log(`${interaction.member.nickname} found in channel ${channel.name}`)

        const userInput = interaction.options.data[0].value
        await interaction.deferReply({ ephemeral: PRODUCTION })
        const songInfo = await findSongInfo(userInput)

        console.log(`Found video: "${songInfo.title}" at ${songInfo.url}, joining voice`)

        if (!connection) {
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            })
            subscription = connection.subscribe(player)
        }

        prepareYoutubeSong(songInfo.id)
        playlist.push({ ...songInfo, interaction })
        if(player.state.status === AudioPlayerStatus.Idle) {
            playNextSong()
        } else {
            interaction.followUp({content: `"${songInfo.title}" pridana do playlistu`})
        }
    } catch (error) {
        console.error(error)
        await interaction.followUp({ content: 'Niečo sa dojebalo', ephemeral: PRODUCTION })
    }
})

// Log in to Discord with your client's token
client.login(token)
