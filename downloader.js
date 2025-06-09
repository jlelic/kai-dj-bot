import fs from 'fs'
import ytdl from '@distube/ytdl-core'
import ffmpeg from '@ffmpeg-installer/ffmpeg'
import FFmpeg from 'fluent-ffmpeg'

FFmpeg.setFfmpegPath(ffmpeg.path)

import { finished } from 'stream'
import { promisify } from 'util'

const CACHE_FOLDER = './cache/songs'

const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi
const cached = new Map()
const queue = []
const promises = {}

if (!fs.existsSync(CACHE_FOLDER)) {
    fs.mkdirSync(CACHE_FOLDER)
}

fs.readdirSync(CACHE_FOLDER)
    .filter(f => f.endsWith('mp3'))
    .forEach(file => {
        const id = file.split('.')[0]
        cached.set(id, {
            path: `${CACHE_FOLDER}/${file}`,
            link: `https://www.youtube.com/watch?v=${id}`
        })
    })
let downloading = false

export function prepareYoutubeSong(youtubeId) {
    if (cached.has(youtubeId)) {
        return true
    }
    if (downloading) {
        queue.push(youtubeId)
    } else {
        downloadYoutubeSong(youtubeId)
    }
    return false
}

export async function downloadYoutubeSong(youtubeId) {
    downloading = true
    do {
        const url = `https://www.youtube.com/watch?v=${youtubeId}`

        try {
            const info = await ytdl.getInfo(youtubeId)
            const videoStream = ytdl(url, {
                videoFormat: 'mp4',
                filter: 'audioonly',
            })
            const path = `${CACHE_FOLDER}/${youtubeId}.mp3`
            const audioStream = new FFmpeg(videoStream)
                .format('mp3')
                .pipe(fs.createWriteStream(path))
            console.log(`Downloading ${youtubeId}`)
            await promisify(finished)(audioStream)
            const cachedData = {
                path,
                link: url
            }
            cached.set(youtubeId, cachedData)
            console.log(`Downloaded ${youtubeId}`)
            if (promises[youtubeId]) {
                promises[youtubeId].resolve(cachedData)
            }
        } catch (e) {
            if (promises[youtubeId]) {
                promises[youtubeId].reject(e)
            }
        } finally {
            youtubeId = queue.shift()
            console.log('Next in download queue:', youtubeId)
        }
    } while(youtubeId)
    downloading = false
}

export function isSongCached(youtubeId) {
    return cached.has(youtubeId)
}

export function waitTilReady(youtubeId) {
    if (cached.has(youtubeId)) {
        return cached.get(youtubeId)
    }
    return new Promise((resolve, reject) => {
        promises[youtubeId] = { resolve, reject }
    })
}
