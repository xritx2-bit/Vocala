import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  CLIENT_ID: process.env.CLIENT_ID || '',
  DEFAULT_LANG: process.env.DEFAULT_LANG || 'hi', // Hindi & Hinglish default
  DEFAULT_MODE: process.env.DEFAULT_MODE || 'hinglish',
  MAX_MESSAGE_LENGTH: parseInt(process.env.MAX_MESSAGE_LENGTH || '250', 10),
  MAX_QUEUE_SIZE: 10,
  IDLE_TIMEOUT_MS: 5 * 60 * 1000 // 5 minutes
};

export const SUPPORTED_LANGUAGES = [
  {
    id: 'hi',
    name: 'Hindi & Hinglish (हिंदी / Hinglish - Recommended)',
    code: 'hi'
  },
  {
    id: 'en-in',
    name: 'Indian English (English - India)',
    code: 'en-IN'
  },
  {
    id: 'en',
    name: 'Standard English (English - US)',
    code: 'en'
  },
  {
    id: 'en-gb',
    name: 'British English (English - UK)',
    code: 'en-GB'
  },
  {
    id: 'es',
    name: 'Spanish (Español)',
    code: 'es'
  },
  {
    id: 'fr',
    name: 'French (Français)',
    code: 'fr'
  },
  {
    id: 'ja',
    name: 'Japanese (日本語)',
    code: 'ja'
  }
];

export const ANNOUNCEMENT_MODES = {
  hinglish: {
    name: 'Hinglish ("Rahul ne kaha: ...")',
    format: (name, text) => `${name} ne kaha: ${text}`
  },
  english: {
    name: 'English ("Rahul says: ...")',
    format: (name, text) => `${name} says: ${text}`
  },
  name_only: {
    name: 'Name Only ("Rahul: ...")',
    format: (name, text) => `${name}: ${text}`
  },
  direct: {
    name: 'Direct Message Only ("...")',
    format: (name, text) => text
  }
};
