import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } from '@discordjs/voice';
import ffmpegPath from 'ffmpeg-static';

console.log('Testing createAudioResource with msedge-tts and FFmpeg...');
console.log('FFmpeg path:', ffmpegPath);

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

async function test() {
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata('hi-IN-MadhurNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream('Test message for voice playback');

    const resource = createAudioResource(audioStream, {
      inputType: StreamType.Arbitrary
    });

    console.log('Audio resource created successfully:', !!resource);
    console.log('Readable state of resource:', resource.readable);

    const player = createAudioPlayer();
    player.on(AudioPlayerStatus.Playing, () => {
      console.log('Player transitioned to Playing!');
    });
    player.on(AudioPlayerStatus.Idle, () => {
      console.log('Player transitioned to Idle (finished playback simulation)!');
    });
    player.on('error', (err) => {
      console.error('Player error:', err);
    });

    player.play(resource);
    console.log('Player play() called without throwing!');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
