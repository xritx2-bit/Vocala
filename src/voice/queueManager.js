import {
  joinVoiceChannel,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection
} from '@discordjs/voice';
import { CONFIG } from '../config.js';
import { ttsManager } from '../tts/ttsManager.js';

class GuildQueue {
  constructor(guildId, voiceChannel, textChannel, onIdleDisconnect) {
    this.guildId = guildId;
    this.voiceChannelId = voiceChannel.id;
    this.textChannelId = textChannel ? textChannel.id : voiceChannel.id;
    this.queue = [];
    this.isPlaying = false;
    this.currentTrack = null;
    this.idleTimer = null;
    this.onIdleDisconnect = onIdleDisconnect;

    // Create Audio Player
    this.player = createAudioPlayer();

    // Create Voice Connection
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    // Subscribe connection to player
    this.connection.subscribe(this.player);

    this.setupListeners();
    this.resetIdleTimer();
  }

  setupListeners() {
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.isPlaying = false;
      this.currentTrack = null;
      this.playNext();
    });

    this.player.on('error', (error) => {
      console.error(`[AudioPlayer Error] Guild ${this.guildId}:`, error.message);
      this.isPlaying = false;
      this.currentTrack = null;
      this.playNext();
    });

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000)
        ]);
        // Seems to be reconnecting to a new voice server - do not disconnect
      } catch (error) {
        // Disconnect is permanent
        this.destroy();
      }
    });
  }

  resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (!this.isPlaying && this.queue.length === 0) {
        console.log(`[VC Auto-Disconnect] Guild ${this.guildId} idle for 5 minutes.`);
        if (this.onIdleDisconnect) this.onIdleDisconnect(this.guildId);
      }
    }, CONFIG.IDLE_TIMEOUT_MS);
  }

  enqueue(authorName, text) {
    const formatted = ttsManager.formatAnnouncement(authorName, text, this.guildId);
    this.queue.push({ authorName, text, speechText: formatted });
    this.resetIdleTimer();

    if (!this.isPlaying) {
      this.playNext();
    }
  }

  async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.currentTrack = null;
      this.resetIdleTimer();
      return;
    }

    this.isPlaying = true;
    if (this.idleTimer) clearTimeout(this.idleTimer);

    const item = this.queue.shift();
    this.currentTrack = item;

    try {
      const resource = await ttsManager.createAudioResourceForText(item.speechText, this.guildId);
      this.player.play(resource);
    } catch (err) {
      console.error(`[TTS Synthesis Error] Guild ${this.guildId}:`, err);
      this.isPlaying = false;
      this.currentTrack = null;
      this.playNext();
    }
  }

  skip() {
    if (this.isPlaying) {
      this.player.stop();
      return true;
    }
    return false;
  }

  clear() {
    const count = this.queue.length;
    this.queue = [];
    return count;
  }

  destroy() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.queue = [];
    this.isPlaying = false;
    this.currentTrack = null;

    try {
      this.player.stop(true);
    } catch (e) {}

    try {
      this.connection.destroy();
    } catch (e) {}
  }
}

export class QueueManager {
  constructor() {
    this.guilds = new Map(); // guildId -> GuildQueue
  }

  join(voiceChannel, textChannel) {
    const guildId = voiceChannel.guild.id;

    // If already connected in this guild, destroy old one or reuse
    if (this.guilds.has(guildId)) {
      const existing = this.guilds.get(guildId);
      if (existing.voiceChannelId === voiceChannel.id) {
        if (textChannel) existing.textChannelId = textChannel.id;
        return existing;
      }
      existing.destroy();
      this.guilds.delete(guildId);
    }

    const queue = new GuildQueue(
      guildId,
      voiceChannel,
      textChannel || voiceChannel,
      (gId) => this.leave(gId)
    );

    this.guilds.set(guildId, queue);
    return queue;
  }

  get(guildId) {
    return this.guilds.get(guildId);
  }

  leave(guildId) {
    const queue = this.guilds.get(guildId);
    if (queue) {
      queue.destroy();
      this.guilds.delete(guildId);
      return true;
    }
    return false;
  }

  enqueueMessage(message) {
    const guildId = message.guild?.id;
    if (!guildId) return false;

    const queue = this.guilds.get(guildId);
    if (!queue) return false;

    // Check if message is in the monitored text channel or VC text chat
    if (message.channelId !== queue.textChannelId && message.channelId !== queue.voiceChannelId) {
      return false;
    }

    const cleanText = ttsManager.cleanMessage(message);
    if (!cleanText || cleanText.length === 0) return false;

    const authorName = message.member?.displayName || message.author.username;
    queue.enqueue(authorName, cleanText);
    return true;
  }
}

export const queueManager = new QueueManager();
