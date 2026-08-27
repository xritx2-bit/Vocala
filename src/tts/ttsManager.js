import * as googleTTS from 'google-tts-api';
import { CONFIG, SUPPORTED_LANGUAGES, ANNOUNCEMENT_MODES } from '../config.js';
import { createAudioResource } from '@discordjs/voice';

export class TTSManager {
  constructor() {
    this.langSettings = new Map(); // guildId -> langCode
    this.modeSettings = new Map(); // guildId -> modeKey
  }

  getLang(guildId) {
    return this.langSettings.get(guildId) || CONFIG.DEFAULT_LANG;
  }

  setLang(guildId, langId) {
    const langObj = SUPPORTED_LANGUAGES.find(l => l.id === langId || l.code === langId);
    if (!langObj) {
      throw new Error(`Language ${langId} is not supported.`);
    }
    this.langSettings.set(guildId, langObj.code);
    return langObj;
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
      text = text.substring(0, CONFIG.MAX_MESSAGE_LENGTH);
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
   * Generates audio resource using Google TTS (battle-tested across top Discord bots)
   */
  createAudioResourceForText(text, guildId) {
    const lang = this.getLang(guildId);

    const url = googleTTS.getAudioUrl(text, {
      lang: lang,
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000
    });

    return createAudioResource(url);
  }
}

export const ttsManager = new TTSManager();
