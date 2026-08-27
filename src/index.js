import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
  ChannelType
} from 'discord.js';
import { CONFIG, SUPPORTED_LANGUAGES, ANNOUNCEMENT_MODES } from './config.js';
import { registerSlashCommands } from './commands/slashCommands.js';
import { queueManager } from './voice/queueManager.js';
import { ttsManager } from './tts/ttsManager.js';

import ffmpegPath from 'ffmpeg-static';
if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
  console.log('🎬 FFmpeg path configured:', ffmpegPath);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(`=========================================`);
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  console.log(`🌐 Ready to read Hindi, English & Hinglish VC chats!`);
  console.log(`=========================================`);

  // Set rich bot presence
  client.user.setPresence({
    activities: [{ name: 'VC Chat (Hindi/English) | /join', type: ActivityType.Listening }],
    status: 'online'
  });

  // Register slash commands globally
  if (CONFIG.DISCORD_TOKEN && (CONFIG.CLIENT_ID || client.user.id)) {
    const clientId = CONFIG.CLIENT_ID || client.user.id;
    await registerSlashCommands(CONFIG.DISCORD_TOKEN, clientId);
  }
});

// Handle Slash Command Interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild, member, options } = interaction;
  if (!guild) return;

  try {
    switch (commandName) {
      case 'join': {
        const targetVoiceChannel =
          options.getChannel('channel') || member.voice?.channel;

        if (!targetVoiceChannel) {
          return interaction.reply({
            content: '❌ **Please join a Voice Channel first**, or specify a voice channel in the `/join` command!',
            ephemeral: true
          });
        }

        const permissions = targetVoiceChannel.permissionsFor(guild.members.me);
        if (!permissions.has(['Connect', 'Speak'])) {
          return interaction.reply({
            content: '❌ I do not have permission to **Connect** and **Speak** in that voice channel!',
            ephemeral: true
          });
        }

        // Default to either specified text channel, interaction channel, or voice channel chat
        const textChannel = options.getChannel('text_channel') || interaction.channel || targetVoiceChannel;
        const queue = queueManager.join(targetVoiceChannel, textChannel);

        try {
          await entersState(queue.connection, VoiceConnectionStatus.Ready, 10_000);
        } catch (e) {
          console.warn('[VoiceConnection] Handshake taking longer than expected:', e.message);
        }

        const currentLang = ttsManager.getLang(guild.id);
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang || l.id === currentLang) || SUPPORTED_LANGUAGES[0];
        const modeKey = ttsManager.getMode(guild.id);

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🎙️ Vocala Connected & Listening!')
          .setDescription(
            `Joined **${targetVoiceChannel.name}**\n` +
            `Listening to chat in: **#${textChannel.name}** *(VC chat or bound text)*\n\n` +
            `Type anything in **#${textChannel.name}** in **Hindi, English, or Hinglish** and I will speak it aloud!`
          )
          .addFields(
            { name: '🗣️ Active Language', value: `${langObj.name}`, inline: true },
            { name: '📢 Format Mode', value: `${ANNOUNCEMENT_MODES[modeKey]?.name || modeKey}`, inline: true },
            { name: '💡 Quick Controls', value: '`/voice` • `/mode` • `/skip` • `/clear` • `/leave`', inline: false }
          )
          .setFooter({ text: 'Vocala TTS • Production Discord Engine' })
          .setTimestamp();

        // Enqueue a short welcome voice announcement
        queue.enqueue('Vocala', 'Vocala connected. Hindi, English aur Hinglish VC chat reader start ho gaya hai.');

        return interaction.reply({ embeds: [embed] });
      }

      case 'leave': {
        const left = queueManager.leave(guild.id);
        if (left) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xe056fd)
                .setTitle('👋 Disconnected')
                .setDescription('Left voice channel and cleared pending message queue.')
            ]
          });
        } else {
          return interaction.reply({
            content: '⚠️ Vocala is not currently connected to any voice channel in this server.',
            ephemeral: true
          });
        }
      }

      case 'voice': {
        const langId = options.getString('select');
        const langObj = ttsManager.setLang(guild.id, langId);

        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🗣️ Language / Voice Changed Successfully')
          .setDescription(`Active Voice is now set to **${langObj.name}**.\n\nNow reading in this language accent!`);

        const queue = queueManager.get(guild.id);
        if (queue) {
          queue.enqueue('Vocala', `Voice language set to ${langObj.name}.`);
        }

        return interaction.reply({ embeds: [embed] });
      }

      case 'mode': {
        const style = options.getString('style');
        ttsManager.setMode(guild.id, style);

        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle('📢 Announcement Mode Updated')
          .setDescription(`Mode set to: **${ANNOUNCEMENT_MODES[style]?.name || style}**`);

        return interaction.reply({ embeds: [embed] });
      }

      case 'skip': {
        const queue = queueManager.get(guild.id);
        if (!queue) {
          return interaction.reply({ content: '⚠️ Not connected to any voice channel.', ephemeral: true });
        }

        const skipped = queue.skip();
        return interaction.reply({
          content: skipped ? '⏭️ **Skipped** current speech.' : 'ℹ️ Nothing is currently playing to skip.'
        });
      }

      case 'clear': {
        const queue = queueManager.get(guild.id);
        if (!queue) {
          return interaction.reply({ content: '⚠️ Not connected to any voice channel.', ephemeral: true });
        }

        const cleared = queue.clear();
        return interaction.reply({
          content: `🗑️ **Cleared ${cleared} pending message(s)** from the queue.`
        });
      }

      case 'status': {
        const queue = queueManager.get(guild.id);
        const currentLang = ttsManager.getLang(guild.id);
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang || l.id === currentLang) || SUPPORTED_LANGUAGES[0];
        const modeKey = ttsManager.getMode(guild.id);

        const embed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle('📊 Vocala Status')
          .addFields(
            { name: '🔌 Connected VC', value: queue ? `<#${queue.voiceChannelId}>` : 'Not Connected', inline: true },
            { name: '💬 Monitored Chat', value: queue ? `<#${queue.textChannelId}>` : 'None', inline: true },
            { name: '📋 Queue Length', value: queue ? `${queue.queue.length} pending` : '0', inline: true },
            { name: '🗣️ Current Language', value: `${langObj.name}`, inline: true },
            { name: '📢 Format Mode', value: `${ANNOUNCEMENT_MODES[modeKey]?.name || modeKey}`, inline: true },
            { name: '⚡ Currently Speaking', value: queue?.isPlaying ? 'Yes' : 'No', inline: true }
          )
          .setFooter({ text: 'Use /join to connect or /help for more commands' });

        return interaction.reply({ embeds: [embed] });
      }

      case 'help': {
        const embed = new EmbedBuilder()
          .setColor(0x00cec9)
          .setTitle('🎙️ Vocala - VC Chat TTS Bot Guide')
          .setDescription(
            'Vocala reads the chat of the voice channel out loud in real-time, announcing who is speaking and their message. Works naturally with **Hindi (हिंदी)**, **English**, and **Hinglish (Roman Hindi)**!'
          )
          .addFields(
            {
              name: '🚀 Commands',
              value:
                '`/join [channel]` - Join your voice channel and start reading text\n' +
                '`/leave` - Disconnect from voice channel and clear queue\n' +
                '`/voice` - Switch neural voices (Madhur, Swara, Prabhat, Neerja, etc.)\n' +
                '`/mode` - Change announcement style ("Rahul ne kaha...", "Rahul says...", etc.)\n' +
                '`/skip` - Skip current speech\n' +
                '`/clear` - Clear all pending queued messages\n' +
                '`/status` - View current connection & voice settings'
            },
            {
              name: '🇮🇳 Hindi & Hinglish Tips',
              value:
                '• You can type in Devanagari Hindi (e.g. `नमस्ते सब लोग`) or Hinglish (e.g. `Bhai match kab shuru hoga?`).\n' +
                '• The default voice **Madhur (hi-IN-MadhurNeural)** is specially tuned for Indian pronunciation.'
            },
            {
              name: '🛡️ Smart Features',
              value:
                '• Automatically replaces `@user` mentions with speaker display names.\n' +
                '• Replaces long URLs with "link".\n' +
                '• FIFO queue prevents voice overlapping when multiple people chat.\n' +
                '• Automatically disconnects after 5 minutes of idle inactivity.'
            }
          )
          .setFooter({ text: 'Created for seamless gaming & voice channel accessibility' });

        return interaction.reply({ embeds: [embed] });
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`[Interaction Error] Command ${commandName}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while executing this command.',
        ephemeral: true
      });
    }
  }
});

// Listen to incoming messages and read them aloud if in active VC chat
client.on('messageCreate', async (message) => {
  // Ignore messages from bots or webhooks
  if (message.author.bot || message.webhookId) return;
  if (!message.guild) return;

  try {
    const enqueued = queueManager.enqueueMessage(message);
    if (enqueued) {
      console.log(`[Message Handled] From ${message.author.username} in #${message.channel.name}: "${message.content}"`);
    }
  } catch (error) {
    console.error('[Message Handler Error]:', error);
  }
});

// Auto-leave if alone in VC
client.on('voiceStateUpdate', (oldState, newState) => {
  const guildId = oldState.guild.id;
  const queue = queueManager.get(guildId);
  if (!queue) return;

  const botMember = oldState.guild.members.me;
  if (!botMember || !botMember.voice.channelId) return;

  const channel = oldState.guild.channels.cache.get(botMember.voice.channelId);
  if (channel && channel.isVoiceBased()) {
    // Count non-bot members in VC
    const nonBots = channel.members.filter(m => !m.user.bot);
    if (nonBots.size === 0) {
      console.log(`[Auto-Leave] No humans left in VC ${channel.name}. Leaving...`);
      queueManager.leave(guildId);
    }
  }
});

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

import http from 'http';

// Create a lightweight HTTP server for Railway / cloud healthchecks
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online',
    bot: client.user?.tag || 'connecting...',
    uptime: process.uptime()
  }));
});

server.listen(PORT, () => {
  console.log(`🚀 Healthcheck server listening on port ${PORT}`);
});

// Login to Discord
if (!CONFIG.DISCORD_TOKEN) {
  console.warn('⚠️ WARNING: DISCORD_TOKEN is not set in environment variables!');
  console.warn('Please add DISCORD_TOKEN in your Railway Variables or .env file.');
} else {
  console.log('🔑 Attempting to log into Discord with token...');
  client.login(CONFIG.DISCORD_TOKEN).catch((err) => {
    console.error('❌ Discord Login Error:', err.message);
    if (err.message.includes('disallowed intents') || err.message.includes('DisallowedIntents')) {
      console.error('👉 FIX: Go to Discord Developer Portal -> Bot -> Enable "Message Content Intent" and "Server Members Intent"!');
    } else if (err.message.includes('An invalid token was provided') || err.message.includes('TOKEN_INVALID')) {
      console.error('👉 FIX: Your DISCORD_TOKEN in Railway Variables is invalid or incomplete. Please Reset and re-copy it from Discord Developer Portal!');
    }
  });
}
