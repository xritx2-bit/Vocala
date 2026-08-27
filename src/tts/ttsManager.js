import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { CONFIG, SUPPORTED_VOICES, ANNOUNCEMENT_MODES } from '../config.js';
import { createAudioResource, StreamType } from '@discordjs/voice';
import { Readable } from 'stream';
import prism from 'prism-media';

export class TTSManager {
  constructor() {
    this.voiceSettings = new Map(); // guildId -> voiceId
    this.modeSettings = new Map();  // guildId -> modeKey
  }

  getVoice(guildId) {
    return this.voiceSettings.get(guildId) || CONFIG.DEFAULT_VOICE;
  }

  setVoice(guildId, voiceId) {
    const valid = SUPPORTED_VOICES.some(v => v.id === voiceId);
    if (!valid) {
      throw new Error(`Voice ${voiceId} is not supported.`);
    }
    this.voiceSettings.set(guildId, voiceId);
  }

  getMode(guildId) {
    return this.modeSettings.get(guildId) || CONFIG.DEFAULT_MODE;
  }

  setMode(guildId, modeKey) {
    if (!ANNOUNCEMENT_MODES[modeKey]) {
      throw new Error(`Mode ${modeKey} is not supported.`);
    }
    this.modeSettings.set(guildId, modeKey);
  }

  /**
   * Clean message for TTS reading:
   * - Resolves mentions, URLs, custom emojis, codeblocks
   * - Truncates excessively long text
   */
  cleanMessage(message) {
    let text = message.content || '';

    // Replace user mentions <@ID> or <@!ID> with member display name or username
    text = text.replace(/<@!?(\d+)>/g, (match, userId) => {
      const member = message.guild?.members.cache.get(userId);
      if (member) return `@${member.displayName}`;
      const user = message.client.users.cache.get(userId);
      return user ? `@${user.username}` : '@user';
    });

    // Replace channel mentions <#ID>
    text = text.replace(/<#(\d+)>/g, (match, channelId) => {
      const channel = message.guild?.channels.cache.get(channelId);
      return channel ? `#${channel.name}` : '#channel';
    });

    // Replace role mentions <@&ID>
    text = text.replace(/<@&(\d+)>/g, (match, roleId) => {
      const role = message.guild?.roles.cache.get(roleId);
      return role ? `@${role.name}` : '@role';
    });

    // Replace URLs with "link"
    text = text.replace(/https?:\/\/\S+/gi, 'link');

    // Replace custom emojis <:emoji_name:123456789> or <a:emoji_name:123456789>
    text = text.replace(/<a?:([a-zA-Z0-9_]+):\d+>/g, '$1');

    // Replace code blocks with "code block"
    text = text.replace(/```[\s\S]*?```/g, 'code block');

    // Replace inline code `code`
    text = text.replace(/`([^`]+)`/g, '$1');

    // Remove spoiler tags ||spoiler||
    text = text.replace(/\|\|([\s\S]*?)\|\|/g, '$1');

    // Clean excessive spaces/newlines
    text = text.replace(/\s+/g, ' ').trim();

    // Check message attachments if text is empty
    if (!text && message.attachments.size > 0) {
      const first = message.attachments.first();
      if (first.contentType?.startsWith('image/')) {
        text = 'sent an image';
      } else if (first.contentType?.startsWith('video/')) {
        text = 'sent a video';
      } else if (first.contentType?.startsWith('audio/')) {
        text = 'sent an audio file';
      } else {
        text = 'sent an attachment';
      }
    }

    // Limit length to avoid spam
    if (text.length > CONFIG.MAX_MESSAGE_LENGTH) {
      text = text.substring(0, CONFIG.MAX_MESSAGE_LENGTH) + '... aur aage';
    }

    return text;
  }

  /**
   * Formats the text announcement with author name
   */
  formatAnnouncement(authorName, text, guildId) {
    const modeKey = this.getMode(guildId);
    const mode = ANNOUNCEMENT_MODES[modeKey] || ANNOUNCEMENT_MODES.hinglish;
    return mode.format(authorName, text);
  }

  /**
   * Generates native Discord OggOpus audio resource using msedge-tts + FFmpeg libopus
   */
  async createAudioResourceForText(text, guildId) {
    const voiceId = this.getVoice(guildId);
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);
    
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

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

    const readable = Readable.from(audioBuffer);
    const oggStream = readable.pipe(ffmpeg);

    return createAudioResource(oggStream, {
      inputType: StreamType.OggOpus
    });
  }
}

export const ttsManager = new TTSManager();
