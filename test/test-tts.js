import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

console.log('--- VOCALA TTS TEST ---');
console.log('FFmpeg binary path:', ffmpegPath);
console.log('FFmpeg binary exists:', ffmpegPath ? fs.existsSync(ffmpegPath) : false);

async function runTest() {
  try {
    const tts = new MsEdgeTTS();
    console.log('Testing Edge TTS with Hindi & Hinglish...');

    // Test Hindi voice with Hinglish text
    await tts.setMetadata('hi-IN-MadhurNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const hindiSample = 'Rahul ne kaha: Bhai suno, VC mein aa jao match start ho gaya hai!';
    
    const outputDir = path.resolve('test');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Synthesizing sample audio stream...');
    const { audioStream } = tts.toStream(hindiSample);

    const testFile = path.join(outputDir, 'sample-hinglish.mp3');
    const writeStream = fs.createWriteStream(testFile);
    audioStream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      audioStream.on('error', reject);
    });
    
    if (fs.existsSync(testFile)) {
      const stats = fs.statSync(testFile);
      console.log(`✅ Success! Generated ${testFile} (${stats.size} bytes)`);
    } else {
      console.error('❌ Failed to generate audio file');
    }
  } catch (err) {
    console.error('❌ Test error:', err);
  }
}

runTest();
