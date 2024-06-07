import { EndBehaviorType, joinVoiceChannel } from '@discordjs/voice'
import discordOpus from '@discordjs/opus'
import FFmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import {opus} from 'prism-media'
import { Readable } from 'node:stream'
import * as wavConverter from 'wav-converter'
import * as path from 'path'
import { pipeline } from 'node:stream'
import ffmpeg from '@ffmpeg-installer/ffmpeg'
import affmpeg from 'ffmpeg'
FFmpeg.setFfmpegPath(ffmpeg.path)
import Bumblebee from 'bumblebee-hotword-node'

let buffer = []
let timeOut
// let decoder = new prism.opus.Decoder({ channels: 2, rate: 48000, frameSize: 960 })
const encoder = new discordOpus.OpusEncoder(48000, 2)
export const setupListener = (connection) => {
    console.log('SETTING UP LISTENER')

    // connection.receiver.speaking.on('start', (id) => {
    //     console.log(id)
    // })
    // const subscription = connection.receiver.subscribe('290979354392133632', {
    //     end: {
    //         behavior: EndBehaviorType.AfterSilence,
    //         duration: 2000
    //     }
    // })
    // subscription.pipe(decoder);
    // decoder.on('data', (dataChunk) => {
    //     buffer.push(dataChunk)
    // })
    // decoder.on('end', (dataChunk) => {
    // const decoded =encoder.decode(dataChunk)
    // buffer.push(decoded)
    // buffer.push(...dataChunk)
    // clearTimeout(timeOut)
    // timeOut = setTimeout(() => {
    //     const pcmData = Buffer.concat(buffer)
    //     console.log("It's over man!")
    //     fs.writeFileSync('eyo.wav',pcmData)
    //     const audioStream = new FFmpeg(pcmData)
    //         .format('wav')
    //         .pipe(fs.createWriteStream('eyyooo.wav'))
    //     buffer = []
    // }, 2000)
    // })
    // decoder.on('data', (data) => {
    //     voiceCommandState[guild.id].members[id].arrBuffer.push(data);
    // });

    const transcoder = new prism.opus.Decoder({
        rate: 48_000,
        channels: 2,
        frameSize: 960,
    })

    const stream = connection.receiver.subscribe('272689072705634304',
        {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 5000,
            },
        },
    )

    const dirPath = path.join('.', 'aaa')
    console.log(`Checking ${dirPath}`)
    if (!fs.existsSync(dirPath)) {
        console.log(`Creating ${dirPath}`)
        fs.mkdirSync(dirPath)
    }
    const filePath = path.join(dirPath, Date.now().toString())
    console.log(`Recording ${filePath}`)
    const file = fs.createWriteStream(filePath)

    stream.pipe(transcoder)
    const audioStream = new FFmpeg(transcoder)
        .format('mp3')
        .pipe(fs.createWriteStream('eyyooo.mp3'))
}

export async function executeListen(interaction) {
    const member = interaction.guild.members.cache.get(interaction.member.user.id);
    const user = member;
    await interaction.reply(`Recording ${user.nickname}`);
    const channel = member.voice.channel;
    console.log('User :' + user);
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
    });

    // create the filename of it
    const filename = `./${Date.now()}.pcm`
    // then make a listenable audio stream, with the maximum highWaterMark (longest duration(s))
    const audioStream = connection.receiver.subscribe(user.id, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000,
        },
        highWaterMark: 1 << 16
    });
    // create an ogglogicalbitstream piper
    const oggStream = new opus.OggLogicalBitstream({
        opusHead: new opus.OpusHead({
            channelCount: 1,
            sampleRate: 48000,
        }),
        pageSizeControl: {
            maxPackets: 10,
        },
    });
    // and lastly the file write stream
    const out = fs.createWriteStream(filename);

    // send a status update
    console.log(`👂 Started recording ${filename}`);

    // pipe the audiostream, ogg stream and writestream together, once audiostream is finished
    pipeline(audioStream, oggStream, out, async (err) => {
        if (err) return console.warn(`❌ Error recording file ${filename} - ${err.message}`);

        console.log(`✅ Recorded ${filename}`);
        // TESTED - here we have a PCM File which when transformed to a .wav file is listen-able
        processWav(filename)
        // await convertAudioFiles(filename,'actual.mp3')
        new FFmpeg(filename)
            .toFormat('mp3')
            .pipe(fs.createWriteStream('eyyooo.mp3'))
        // return await handlePCMFile(client, VoiceConnection, user, channel, msg, filename);
    });
}

async function convertAudioFiles(infile, outfile) {
    return new Promise(r => {
        /* Create ffmpeg command to convert pcm to mp3 */
        const processD = new affmpeg(infile);
        processD.then(function (audio) {
            audio.fnExtractSoundToMP3(outfile, async function (e, file) {
                if(e) console.error(e);
                // make an .wav file out of the .mp3 file
                return r(outfile); // return the .wav file
            });
        }, function (e) {
            if(e) console.error(e);
        });
    })
}

function processWav(file) {
    const bumblebee = new Bumblebee();
    bumblebee.addHotword('alexa');

    var inputStream = fs.createReadStream(file);

    const transcodedStream = new FFmpeg().input(inputStream)
        .inputOptions(['-f s16le', '-ac 2', '-ar 44100'])
        .outputOptions(['-ac 1', '-ar 16000']).format('s16le').pipe({end: false});

    let didDetectHotword = false;

    inputStream.on('end', function() {
        // the stream ends before porcupine finishes, so add a timeout
        setTimeout(function() {
            if (!didDetectHotword) {
                console.log(file,' = NO');
            }
        }, 500);
    })

    bumblebee.once('hotword', hotword => {
        console.log(file,' = YES');
        didDetectHotword = true;
    });

    bumblebee.start({stream: transcodedStream});
}
