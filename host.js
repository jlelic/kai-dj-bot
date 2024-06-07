import * as dotenv from 'dotenv'

dotenv.config()
import fetch from 'node-fetch'

globalThis.fetch = fetch
import textToSpeech from '@google-cloud/text-to-speech'
import fs from 'fs'
import GptClient from './gpt-client.js'

export const textToSpeechClient = new textToSpeech.TextToSpeechClient()

const gptClient = new GptClient(process.env.OPENAI_API_KEY)

const CACHE_FOLDER = './cache/host'

const descriptionTypes = [
    'vtipne',
    'srdcervúco',
    'vystrašene',
    'nevhodne',
    'agresívne',
    'drzo',
    'šušľavo',
    'kyslo',
    'nahnevane',
]

const fillerTypes = [
    'vtip',
    'vtip',
    'vtip',
    'spicy novinku z Košíc',
    'vymyslené slovenské porekadlo',
]

export async function getSongIntroOutro(nextSongInfo, prevSongInfo) {
    const nextSongName = nextSongInfo && nextSongInfo.title.split('(')[0]
    const prevSongName = prevSongInfo && prevSongInfo.title.split('(')[0]
    const descriptionType = descriptionTypes[(Math.random() * descriptionTypes.length) | 0]
    const filler = fillerTypes[(Math.random() * fillerTypes.length) | 0]
    const outro = prevSongInfo ? (`Práve dohrala pieseň "${prevSongName}" a tak povedz pár slov o nej` + (nextSongName ? ' a potom krátko predstav' : ' a keďže')) : ''
    const intro = nextSongInfo ? `Nasledujúca pieseň ktorú zahráš je "${nextSongName}", tak pre poslucháčov ${descriptionType} opíš pieseň dvoma vetami a povedz o nej fun fact aby si naladil poslúchačov.` : `Nemáš ďalšie piesne na zahranie, takže povedz ${filler} a pripomeň poslucháčom, aby vybrali nasledujúcu pesničku.`
    console.log(`ChatGPT query:`)
    const chatGptQuery = [//'DJ Kai je energetický DJ na rádiu Kai.',//`Slovak DJ Kai, a.k.a. DJ Kai, is energetic Slovak DJ working in radio Kai and is live on air.`,
        outro,
        intro].join(' ')
    console.log(chatGptQuery)
    const chatResponse = await gptClient.generate(chatGptQuery)
    // const chatResponse = {text: "I'm DJ Kai and you're listening to Radio KAI!"}
    const introText = chatResponse.replace(/"/g, '')

    const request = {
        "input": { text: introText },
        "audioConfig": { "speakingRate": 1.1, "pitch": -10, "audioEncoding": "MP3" },
        "voice": { "name": "sk-SK-Wavenet-A", "languageCode": "sk-SK" }
    }
    const [response] = await textToSpeechClient.synthesizeSpeech(request)
    const introId = Math.random().toString(36).slice(2)
    const fileName = `${CACHE_FOLDER}/${introId}.mp3`
    fs.writeFileSync(fileName, response.audioContent, 'binary')
    return {
        introFile: fileName,
        introText
    }
}