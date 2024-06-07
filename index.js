import fetch from 'node-fetch'

globalThis.fetch = fetch
import { REST, Routes, Client, Events, GatewayIntentBits, Collection, SlashCommandBuilder } from 'discord.js'
import * as dotenv from 'dotenv'

dotenv.config()
import { createReadStream } from 'node:fs'
import 'libsodium-wrappers'
import {
    joinVoiceChannel,
    createAudioResource,
    AudioPlayerStatus,
    createAudioPlayer, VoiceConnectionStatus, EndBehaviorType,
} from '@discordjs/voice'

import { prepareYoutubeSong, waitTilReady, isSongCached } from './downloader.js'
import { findSongInfo } from './finder.js'
import { getSongIntroOutro, textToSpeechClient } from './host.js'
import fs from 'fs'

const PRODUCTION = false

const token = process.env.DISCORD_BOT_TOKEN

const playlist = []
let connection, subscription
const player = createAudioPlayer()
let playingIntro = false
let introFinished
let lastSong
let isLoading = false

async function playIntroOutro(songInfo) {
    const { introFile, introText } = await getSongIntroOutro(songInfo, lastSong)
    lastSong = songInfo
    const playIntroPromise = new Promise((resolve, reject) => {
        playingIntro = true
        introFinished = { resolve, reject }
    })
    player.play(createAudioResource(createReadStream(introFile)))
    await playIntroPromise
    return introText
}

async function playNextSong() {
    const songInfo = playlist.shift()
    if (!songInfo) {
        console.log('The playlist is empty!')
        await playIntroOutro()
        return
    }
    isLoading = true
    const { interaction, id, title } = songInfo
    if (!isSongCached(id)) {
        interaction.followUp({ content: `Stahujem ${title}`, ephemeral: PRODUCTION })
    }
    const introText = await playIntroOutro(songInfo)
    const songData = await waitTilReady(id)
    const resource = createAudioResource(createReadStream(songData.path))
    player.play(resource)
    const nextSongDescription = playlist.length ? ` Next in queue ${playlist[0].title}` : ''
    isLoading = false
    return await interaction.followUp({
        content: `${introText}\n${songData.link}${nextSongDescription}`,
        ephemeral: false
    })
}


player.on('error', error => {
    console.error(`Player status: Error: ${error.message} with resource`)
    if (playingIntro) {
        introFinished.reject()
        playingIntro = false
        return
    }
    console.log(error)
})

player.on(AudioPlayerStatus.Idle, () => {
    console.log('Player status: Idle')
    if (playingIntro) {
        introFinished.resolve()
        playingIntro = false
        return
    }
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
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates] })
discordClient.commands = new Collection()


// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
discordClient.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`)
})

let readyNaVolby = false
let poslednyUpdate = ''


discordClient.on(Events.InteractionCreate, async interaction => {
    // await executeListen(interaction)
    // return
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
                selfDeaf: false,
            })

            // setupListener(connection)

            connection.on("stateChange", (oldState, newState) => {
                if (
                    oldState.status === VoiceConnectionStatus.Ready &&
                    newState.status === VoiceConnectionStatus.Connecting
                ) {
                    connection.configureNetworking()
                }
            })
            subscription = connection.subscribe(player)
        }

        prepareYoutubeSong(songInfo.id)
        playlist.push({ ...songInfo, interaction })
        if (player.state.status === AudioPlayerStatus.Idle && !isLoading) {
            playNextSong()
        } else {
            interaction.followUp({ content: `"${songInfo.title}" pridana do playlistu` })
        }
    } catch (error) {
        console.error(error)
        await interaction.followUp({ content: 'Niečo sa dojebalo', ephemeral: PRODUCTION })
    }
})


// Log in to Discord with your client's token
discordClient.login(token)
