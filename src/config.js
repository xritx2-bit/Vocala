import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  CLIENT_ID: process.env.CLIENT_ID || '',
  DEFAULT_VOICE: process.env.DEFAULT_VOICE || 'hi-IN-MadhurNeural',
  DEFAULT_MODE: process.env.DEFAULT_MODE || 'hinglish',
  MAX_MESSAGE_LENGTH: parseInt(process.env.MAX_MESSAGE_LENGTH || '300', 10),
  IDLE_TIMEOUT_MS: 5 * 60 * 1000 // Disconnect after 5 minutes of inactivity
};

export const SUPPORTED_VOICES = [
  {
    id: 'hi-IN-MadhurNeural',
    name: 'Madhur (Hindi / Hinglish Male - Recommended)',
    lang: 'hi-IN',
    gender: 'Male'
  },
  {
    id: 'hi-IN-SwaraNeural',
    name: 'Swara (Hindi / Hinglish Female)',
    lang: 'hi-IN',
    gender: 'Female'
  },
  {
    id: 'en-IN-PrabhatNeural',
    name: 'Prabhat (Indian English Male)',
    lang: 'en-IN',
    gender: 'Male'
  },
  {
    id: 'en-IN-NeerjaNeural',
    name: 'Neerja (Indian English Female)',
    lang: 'en-IN',
    gender: 'Female'
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (US English Female)',
    lang: 'en-US',
    gender: 'Female'
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (US English Male)',
    lang: 'en-US',
    gender: 'Male'
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (UK English Male)',
    lang: 'en-GB',
    gender: 'Male'
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (UK English Female)',
    lang: 'en-GB',
    gender: 'Female'
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
