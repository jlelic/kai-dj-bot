import * as dotenv from 'dotenv'

dotenv.config()
import fetch from 'node-fetch'

globalThis.fetch = fetch
import textToSpeech from '@google-cloud/text-to-speech'
import { ChatGPTAPI } from 'chatgpt'
import fs from 'fs'

const textToSpeecClient = new textToSpeech.TextToSpeechClient()

const chatGptApi = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY
})

const CACHE_FOLDER = './cache/host'

const descriptionTypes = [
    'funny',
    'funky',
    'chill',
    'groovy',
    'sweet',
    'dramatic',
    'smart',
    'cool',
    'scary',
    'creepy',
    'interesting',
    'hilarious',
    'amazing',
    'outrageous',
    'anger-inducing',
    'outrageously fake',
    'total bullshit',
    'completely made-up'
]

export async function getSongIntroOutro(nextSongInfo, prevSongInfo) {
    const nextSongName = nextSongInfo && nextSongInfo.title.split('(')[0]
    const prevSongName = prevSongInfo && prevSongInfo.title.split('(')[0]
    const descriptionType = descriptionTypes[(Math.random() * descriptionTypes.length) | 0]
    const outro = prevSongInfo ? (`He just played song "${prevSongName}" so he says few words about it` + (nextSongName ? ' and then goes on to introduce' : ' and since')) : ''
    const intro = nextSongInfo ? `The next song he's about to play is "${nextSongName}". DJ Kai gives a very short ${descriptionType} description with fun fact about the song to hype it up.` : `There are no songs to play for now DJ Kai tells a joke and reminds audience to choose the next song.`
    console.log(`ChatGPT query:`)
    const chatGptQuery = [`Slovak DJ Kai, a.k.a. DJ Kai, is energetic Slovak DJ working in radio Kai and is live on air.`,
        outro,
        intro,
        `He says in slovak language:\n`].join(' ')
    console.log(chatGptQuery)
    const chatResponse = await chatGptApi.sendMessage(chatGptQuery, {
        promptPrefix: '',
        promptSuffix: ''
    })
    // const chatResponse = {text: "I'm DJ Kai and you're listening to Radio KAI!"}
    console.log(chatResponse.text)
    const introText = chatResponse.text.replace(/"/g, '')

    const request = {
        "input": { text: introText },
        "audioConfig": { "speakingRate": 1.1, "pitch": -10, "audioEncoding": "MP3" },
        "voice": { "name": "sk-SK-Wavenet-A", "languageCode": "sk-SK" }
    }
    const [response] = await textToSpeecClient.synthesizeSpeech(request)
    const introId = Math.random().toString(36).slice(2)
    const fileName = `${CACHE_FOLDER}/${introId}.mp3`
    fs.writeFileSync(fileName, response.audioContent, 'binary')
    return {
        introFile: fileName,
        introText
    }
}