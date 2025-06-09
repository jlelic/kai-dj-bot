import fs from 'fs'
import fetch from 'node-fetch'
import * as dotenv from 'dotenv'
dotenv.config()

globalThis.fetch = fetch
const CACHE_FOLDER = './cache/host'

import OpenAI from "openai";

const openai = new OpenAI();

export const textToSpeech = async (text) => {
    // const request = {
    //     "input": { text },
    //     "audioConfig": { "speakingRate": 1.1, "pitch": -10, "audioEncoding": "MP3" },
    //     "voice": { "name": "sk-SK-Wavenet-A", "languageCode": "sk-SK" }
    // }
    // const [response] = await textToSpeechClient.synthesizeSpeech(request)
    const introId = Math.random().toString(36).slice(2)
    const fileName = `${CACHE_FOLDER}/${introId}.mp3`

    console.time('text-to-speech')
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input: text,
    })
    console.timeEnd('text-to-speech')
    const buffer = Buffer.from(await mp3.arrayBuffer())
    await fs.promises.writeFile(fileName, buffer)

    return {
        file: fileName,
        text: text
    }
}