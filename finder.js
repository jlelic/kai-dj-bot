import ytdl from '@distube/ytdl-core'
import fetch from 'node-fetch'

export async function findSongInfo(urlOrQuery) {
    let id, url
    if (urlOrQuery.match(/[yY][oO][uU][tT][uU][bB][eE]\./)
        || urlOrQuery.match(/[yY][oO][uU][tT][uU]\.[bB][eE]/)) {
        id = ytdl.getVideoID(urlOrQuery)
        url = urlOrQuery
    } else {
        const searchUrl = `https://www.youtube.com/results?search_query=${urlOrQuery.split(/\s/).join('+')}`
        console.log(`Looking for ${urlOrQuery} at ${searchUrl}`)
        const response = await fetch(searchUrl)
        const body = await response.text()
        const links = body.match(/watch\?v=[a-zA-Z0-9_-]+/g)
        if (!links) {
            throw `Nenasiel som take videa :( checkni sam: ${searchUrl}`
        }
        id = links[0].split('=')[1]
        if (!id) {
            throw `Neviem najst adresu videa z ${links[0]} na ${searchUrl}`
        }
        url = `https://www.youtube.com/watch?v=${id}`
    }

    try {
        const info = await ytdl.getInfo(url)
        const title = info.videoDetails.title
        return {
            title,
            id,
            url,
            // intro: chatResponse.text.replace(/"/g, ''),
            type: 'song',
            source: 'youtube'
        }
    } catch (error) {
        console.log(`Error getting video info`)
        console.log(error)
    }
}

