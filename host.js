import { textToSpeech } from './text-to-speech.js'
import { gptClient } from './gpt-client.js'

const descriptionTypes = [
    'vtipne',
    'vystrašene',
    'nevhodne',
    'agresívne',
    'drzo',
    'smutne',
    'kyslo',
    'nahnevane',
]

const fillerTypes = [
    'vtip',
    'vtip',
    'vtip',
    'vtip',
    'vtip',
    'spicy novinku z Košíc',
    'vymyslené slovenské porekadlo',
]

const get5secondQuestion = (channel) => {
    const size = channel.members.size
    const target = channel.members.at(Math.floor(size * Math.random())).nickname
    return `že poslucháč "${target}" má 5 sekúnd na odpovedani troch vecí na ktoré mu položíš otázku. Potom vymysli otázku na štýl hry "5 seconds" a povedz ju. Otázka musí začať že "Vymenuj 3 veci..."`
}

export async function getSongIntroOutro(nextSongInfo, prevSongInfo, channel) {
    const nextSongName = nextSongInfo && nextSongInfo.title.split('(')[0]
    const prevSongName = prevSongInfo && prevSongInfo.title.split('(')[0]
    const descriptionType = descriptionTypes[(Math.random() * descriptionTypes.length) | 0]
    // const filler = fillerTypes[(Math.random() * fillerTypes.length) | 0]
    const filler = get5secondQuestion(channel)
    const outro = prevSongInfo ? (`Práve dohrala pieseň "${prevSongName}" a tak povedz pár slov o nej` + (nextSongName ? ' a potom krátko predstav' : ' a keďže')) : ''
    const intro = nextSongInfo ? `Nasledujúca pieseň ktorú zahráš je "${nextSongName}", tak pre poslucháčov ${descriptionType} opíš pieseň dvoma vetami a povedz o nej fun fact aby si naladil poslúchačov.` : `Nemáš ďalšie piesne na zahranie, takže povedz ${filler}.`
    console.log(`ChatGPT query:`)
    const chatGptQuery = [//'DJ Kai je energetický DJ na rádiu Kai.',//`Slovak DJ Kai, a.k.a. DJ Kai, is energetic Slovak DJ working in radio Kai and is live on air.`,
        outro,
        intro].join(' ')
    console.log(chatGptQuery)
    const chatResponse = await gptClient.generate(chatGptQuery)
    const introText = chatResponse.replace(/"/g, '')

    return await textToSpeech(introText)
}