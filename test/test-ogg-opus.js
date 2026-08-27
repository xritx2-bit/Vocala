import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus, NoSubscriberBehavior } from '@discordjs/voice';
import prism from 'prism-media';
import ffmpegPath from 'ffmpeg-static';
import { Readable } from 'stream';

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

async function testOggOpus() {
  console.log('Testing FFmpeg libopus -> OggOpus pipeline...');
  const tts = new MsEdgeTTS();
  await tts.setMetadata('hi-IN-MadhurNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream('Bhai suno, testing direct OggOpus stream to Discord');
  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  console.log('MP3 buffer:', buffer.length, 'bytes');

  // Transcode to Ogg Opus using FFmpeg
  const ffmpeg = new prism.FFmpeg({
    args: [
      '-analyzeduration', '0',
      '-loglevel', '0',
      '-f', 'mp3',
      '-i', 'pipe:0',
      '-c:a', 'libopus',
      '-b:a', '64k',
      '-ar', '48000',
      '-ac', '2',
      '-f', 'ogg'
    ]
  });

  const readable = Readable.from(buffer);
  const oggStream = readable.pipe(ffmpeg);

  const resource = createAudioResource(oggStream, {
    inputType: StreamType.OggOpus
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  player.on(AudioPlayerStatus.Playing, () => console.log('✅ Player -> Playing OggOpus stream'));
  player.on(AudioPlayerStatus.Idle, () => {
    console.log('✅ Player -> Idle (Finished playing full OggOpus stream without errors!)');
    process.exit(0);
  });
  player.on('error', (e) => {
    console.error('❌ Player error:', e);
    process.exit(1);
  });

  player.play(resource);
}

testOggOpus();
