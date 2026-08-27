import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } from '@discordjs/voice';
import ffmpegPath from 'ffmpeg-static';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

async function testBuffer() {
  console.log('Testing buffered audio stream conversion...');
  const tts = new MsEdgeTTS();
  await tts.setMetadata('hi-IN-MadhurNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const text = 'Rixie ne kaha: kya haal chaal';
  const { audioStream } = tts.toStream(text);

  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  console.log('Collected audio buffer length:', buffer.length, 'bytes');

  const resource = createAudioResource(Readable.from(buffer), {
    inputType: StreamType.Arbitrary
  });

  const player = createAudioPlayer();
  player.on(AudioPlayerStatus.Playing, () => {
    console.log('Player status -> PLAYING');
  });
  player.on(AudioPlayerStatus.Idle, () => {
    console.log('Player status -> IDLE (Playback completed successfully!)');
    process.exit(0);
  });
  player.on('error', (err) => {
    console.error('Player error:', err);
    process.exit(1);
  });

  player.play(resource);
}

testBuffer();
