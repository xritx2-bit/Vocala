import { SlashCommandBuilder, REST, Routes, ChannelType } from 'discord.js';
import { SUPPORTED_LANGUAGES, ANNOUNCEMENT_MODES } from '../config.js';

export const slashCommands = [
  new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join your current voice channel and read aloud its text chat')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Optional specific voice channel to join')
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
        .setRequired(false)
    )
    .addChannelOption(option =>
      option
        .setName('text_channel')
        .setDescription('Optional specific text channel to read from (defaults to VC chat)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Disconnect Vocala from the voice channel and clear queue'),

  new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Change the Text-to-Speech language/voice for this server')
    .addStringOption(option => {
      option
        .setName('select')
        .setDescription('Choose a language (Hindi, Indian English, US English, etc.)')
        .setRequired(true);

      SUPPORTED_LANGUAGES.forEach(v => {
        option.addChoices({ name: v.name, value: v.id });
      });
      return option;
    }),

  new SlashCommandBuilder()
    .setName('mode')
    .setDescription('Change how messages are announced before speaking')
    .addStringOption(option => {
      option
        .setName('style')
        .setDescription('Announcement format')
        .setRequired(true);

      Object.entries(ANNOUNCEMENT_MODES).forEach(([key, val]) => {
        option.addChoices({ name: val.name, value: key });
      });
      return option;
    }),

  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the currently speaking message and play the next one'),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear all pending messages in the TTS queue'),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check current VC, voice model, queue size, and active settings'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show complete usage guide for Vocala (Hindi/English/Hinglish TTS)')
];

/**
 * Register slash commands with Discord API
 */
export async function registerSlashCommands(token, clientId) {
  if (!token || !clientId) {
    console.warn('[SlashCommands] DISCORD_TOKEN or CLIENT_ID is missing. Skipping auto-registration.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('[SlashCommands] Registering global application (/) commands...');
    const body = slashCommands.map(cmd => cmd.toJSON());
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log('[SlashCommands] Successfully registered application (/) commands.');
  } catch (error) {
    console.error('[SlashCommands] Error registering commands:', error);
  }
}
