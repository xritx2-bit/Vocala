import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus, NoSubscriberBehavior } from '@discordjs/voice';
import ffmpegPath from 'ffmpeg-static';
import { Readable } from 'stream';

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

async function debugAudio() {
  console.log('--- Audio Stream & FFmpeg Diagnostic ---');
  const tts = new MsEdgeTTS();
  await tts.setMetadata('hi-IN-MadhurNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const text = 'Rixie ne kaha: kya haal chaal';
  console.log('Synthesizing with EdgeTTS...');
  const { audioStream } = tts.toStream(text);

  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  console.log(`Buffer ready: ${buffer.length} bytes`);

  const resource = createAudioResource(Readable.from(buffer), {
    inputType: StreamType.Arbitrary
  });

  let outputBytes = 0;
  resource.playStream.on('data', (d) => {
    outputBytes += d.length;
  });

  resource.playStream.on('end', () => {
    console.log(`Transcoded playStream finished! Total PCM output: ${outputBytes} bytes`);
  });

  resource.playStream.on('error', (err) => {
    console.error('playStream error:', err);
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  player.on(AudioPlayerStatus.Playing, () => {
    console.log('AudioPlayer: Playing');
  });

  player.on(AudioPlayerStatus.Idle, () => {
    console.log('AudioPlayer: Idle! Full audio playback finished.');
    process.exit(0);
  });

  player.on('error', (e) => {
    console.error('AudioPlayer Error:', e);
  });

  player.play(resource);
}

debugAudio();
