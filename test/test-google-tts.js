import * as googleTTS from 'google-tts-api';
import { createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus, NoSubscriberBehavior } from '@discordjs/voice';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

async function testGoogleTTS() {
  console.log('Testing Google TTS pipeline (Used by top Discord TTS Bots)...');
  const text = 'Rixie ne kaha: kya haal chaal bhai suno';
  
  // Get direct URL from Google TTS
  const url = googleTTS.getAudioUrl(text, {
    lang: 'hi',
    slow: false,
    host: 'https://translate.google.com',
    timeout: 10000,
  });

  console.log('Google TTS URL generated:', url);

  const resource = createAudioResource(url);

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  player.on(AudioPlayerStatus.Playing, () => console.log('✅ Google TTS -> Playing!'));
  player.on(AudioPlayerStatus.Idle, () => {
    console.log('✅ Google TTS -> Finished playing (Idle)!');
    process.exit(0);
  });
  player.on('error', (e) => {
    console.error('❌ Google TTS Error:', e);
    process.exit(1);
  });

  player.play(resource);
}

testGoogleTTS();
