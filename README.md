# 🎙️ Vocala - Discord VC Chat Text-to-Speech (TTS) Bot

> **A real-time Discord Voice Channel TTS Bot that reads the chat of the voice channel out loud, announcing who is speaking and what they said. Specially built with neural voice engines for Hindi (हिंदी), English, and Hinglish!**

---

## ✨ Features

- 🗣️ **Who is Saying & What They Said**: Automatically announces the speaker's name before their message (e.g. *"Rahul ne kaha: Bhai suno..."* or *"Rahul says: Hello everyone"*).
- 🇮🇳 **Bilingual & Hinglish Neural TTS**: High-fidelity, crystal-clear pronunciation for pure Hindi (Devanagari), pure English, and colloquial Hinglish (Roman Hindi text).
- 🎙️ **Native VC Text Chat Support**: Automatically listens to the text chat built directly into the Voice Channel.
- ⚡ **Zero Overlap FIFO Queue**: Multiple messages from different users are queued and played sequentially without cutting each other off.
- 🧹 **Smart Message Sanitization**: Automatically resolves `@user` mentions into display names, converts links to *"link"*, filters out Discord emojis/stickers, and strips markdown/codeblocks.
- 🎛️ **Customizable Voices & Styles**: Choose between Hindi Male (Madhur), Hindi Female (Swara), Indian English Male (Prabhat), Indian English Female (Neerja), US/UK English, and customize the announcement prefix.
- ⏱️ **Auto-Leave & Idle Management**: Automatically leaves if all users leave the VC or after 5 minutes of inactivity to save bandwidth.

---

## 📋 Slash Commands

| Command | Description |
| :--- | :--- |
| `/join [channel] [text_channel]` | Joins your voice channel and starts listening to its chat. |
| `/leave` | Leaves the voice channel and clears queue. |
| `/voice` | Switch TTS neural voices (Madhur, Swara, Prabhat, Neerja, US/UK). |
| `/mode` | Change announcement style (`Hinglish`, `English`, `Name Only`, `Direct`). |
| `/skip` | Skip the currently speaking message. |
| `/clear` | Clear all pending messages in the speech queue. |
| `/status` | View currently connected VC, active voice model, and queue length. |
| `/help` | Display instructions and usage guide. |

---

## 🛠️ Step-by-Step Setup Guide

### 1. Create a Discord Bot Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** in the top right, name it **Vocala**, and accept the terms.
3. In the left sidebar, click on **Bot**.
4. Make sure **PUBLIC BOT** is checked (✅) so anyone can invite it to their server.
5. Click **Reset Token** (or **Copy Token**) to copy your **Bot Token**. Save this for later!
6. Scroll down to **Privileged Gateway Intents** and enable:
   - ✅ **Message Content Intent** *(CRITICAL: required to read text in chat)*
   - ✅ **Server Members Intent** *(Optional: helps resolve usernames faster)*
7. Click **Save Changes**.

---

### 2. Invite the Bot to Your Discord Server

1. In the Discord Developer Portal, go to **OAuth2** -> **URL Generator** in the left menu.
2. Under **SCOPES**, select:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Under **BOT PERMISSIONS**, select:
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Read Message History`
   - ✅ `Connect`
   - ✅ `Speak`
   - ✅ `Use Voice Activity`
4. Copy the generated URL at the bottom and paste it into your browser to invite the bot to your Discord server.

---

### 3. Configure Your Environment

1. In this project folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your details:
   ```ini
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_application_client_id_here
   DEFAULT_VOICE=hi-IN-MadhurNeural
   DEFAULT_MODE=hinglish
   ```

---

### 4. Start the Bot

Run the following command in your terminal:

```bash
npm start
```

For development mode (auto-reload on code edit):
```bash
npm run dev
```

---

## 🎮 How to Use in Discord

1. Join any Voice Channel in your Discord server.
2. Type `/join` in any channel or directly in the Voice Channel's text chat.
3. The bot will join your VC and say:
   > *"Vocala connected. Hindi, English aur Hinglish VC chat reader start ho gaya hai."*
4. Type any message in the Voice Channel's text chat:
   - Hindi: `नमस्ते दोस्तों, क्या हाल है?`
   - Hinglish: `Bhai drop par aao jaldi, enemy spot hua hai!`
   - English: `Let's start the game in 5 minutes.`
5. Vocala will speak it aloud in the voice channel!

---

## 🗣️ Supported Voices

| Voice ID | Language / Dialect | Gender | Best For |
| :--- | :--- | :--- | :--- |
| `hi-IN-MadhurNeural` *(Default)* | Hindi (India) | Male | Hindi & Hinglish gaming chats |
| `hi-IN-SwaraNeural` | Hindi (India) | Female | Clear Hindi & Hinglish speech |
| `en-IN-PrabhatNeural` | English (India) | Male | Hinglish & Indian English |
| `en-IN-NeerjaNeural` | English (India) | Female | Hinglish & Indian English |
| `en-US-JennyNeural` | English (US) | Female | Standard English |
| `en-US-GuyNeural` | English (US) | Male | Standard English |

You can switch voices at any time using `/voice`.

---

## 📁 Project Structure

```
Vocala/
├── src/
│   ├── index.js               # Main Discord bot entry point
│   ├── config.js              # Environment & voice options config
│   ├── commands/
│   │   └── slashCommands.js   # Slash command definitions & registrar
│   ├── tts/
│   │   └── ttsManager.js      # Edge TTS engine & text sanitization
│   └── voice/
│       └── queueManager.js    # Audio player, voice connection & FIFO queue
├── test/
│   └── test-tts.js            # Offline synthesis verification test
├── .env.example               # Environment template
├── package.json               # Dependencies & scripts
└── README.md                  # Complete documentation
```
