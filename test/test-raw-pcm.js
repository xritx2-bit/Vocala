import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus, NoSubscriberBehavior } from '@discordjs/voice';
import prism from 'prism-media';
import ffmpegPath from 'ffmpeg-static';
import { Readable } from 'stream';

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

async function testRawPcm() {
  console.log('Testing Raw PCM pipeline...');
  const tts = new MsEdgeTTS();
  await tts.setMetadata('hi-IN-MadhurNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream('Rahul ne kaha: Bhai suno, testing Raw PCM pipeline');
  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  console.log('Synthesized MP3 buffer size:', buffer.length);

  const ffmpeg = new prism.FFmpeg({
    args: [
      '-analyzeduration', '0',
      '-loglevel', '0',
      '-f', 'mp3',
      '-i', 'pipe:0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2'
    ]
  });

  const readable = Readable.from(buffer);
  const pcmStream = readable.pipe(ffmpeg);

  const resource = createAudioResource(pcmStream, {
    inputType: StreamType.Raw
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  player.on(AudioPlayerStatus.Playing, () => console.log('Player -> Playing'));
  player.on(AudioPlayerStatus.Idle, () => {
    console.log('Player -> Idle (Success!)');
    process.exit(0);
  });
  player.on('error', (e) => {
    console.error('Player error:', e);
    process.exit(1);
  });

  player.play(resource);
}

testRawPcm();
