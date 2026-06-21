# OpenAsk

<p>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Platform" src="https://img.shields.io/badge/platform-Android-brightgreen.svg" />
  <img alt="Expo" src="https://img.shields.io/badge/Expo-56-000020.svg?logo=expo" />
  <img alt="PRs" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
</p>

**OpenAsk is an open-source Android AI chat client that connects to multiple providers — OpenAI, Anthropic, Gemini, Groq, and OpenRouter — through a single interface.**

Unlike using separate apps or websites for each AI provider, OpenAsk gives you one place to chat with any model, customize how the AI responds with personality presets and fine-grained parameters, and manage all your API keys locally on your device.

---

## Features

- **Multi-provider** — Switch between 5 providers without leaving the chat
- **Personality presets** — Formal, Friendly, Sarkastik, Jenius, or custom system prompt with temperature, max tokens, top P, and frequency penalty controls
- **Dynamic model fetching** — Pulls the latest available models directly from each provider's API
- **Google OAuth** — Quick sign-in with Google via Clerk, no email/password required
- **Real-time streaming** — Token-by-token streaming from all supported providers
- **Conversation history** — Auto-titled, persistent, searchable history
- **File attachments** — Attach text and binary files to your messages
- **Local-first** — All API keys stored on-device, never sent to any server

---

## Supported Providers & Models

| Provider | Default Models |
|----------|---------------|
| **Groq** (default) | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B |
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4 Turbo, o1-mini |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus |
| **Google Gemini** | Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash |
| **OpenRouter** | GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, Llama 3.3 70B, DeepSeek R1, Mistral Large |

When you add your API key in Settings, the app automatically fetches the complete model list from each provider.

---

## Tech Stack

| Layer | |
|-------|---|
| Framework | Expo SDK 56 / React Native 0.85 |
| Navigation | Expo Router v4 with Drawer |
| Auth | Clerk (Google OAuth) |
| State | Zustand + AsyncStorage |
| Storage | expo-secure-store, AsyncStorage |
| UI | React Native, Ionicons, react-native-markdown-display |

---

## Quick Start

```bash
git clone https://github.com/Rzfan03/OpenAsk.git
cd OpenAsk
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_GROQ_API_KEY=gsk_...
```

Get a [Clerk key](https://clerk.com) and a [Groq key](https://groq.com), then:

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator.

---

## Project Structure

```
app/
  _layout.tsx             ClerkProvider + push notifications
  index.tsx               Auth redirect
  (auth)/sign-in.tsx      Google OAuth screen
  (app)/_layout.tsx       Drawer navigator with user profile
  (app)/index.tsx         Main chat screen
  (app)/history.tsx       Conversation history
  (app)/settings.tsx      API key management per provider
  (app)/personality.tsx   Personality presets and parameter sliders
components/               ChatBubble, MessageInput, ModelSelector
lib/                      aiStream, modelFetcher, filePicker, notifications
store/                    settingsStore, chatStore, notifStore
constants/                Colors, providers
```

---

## Building

```bash
npx expo export --platform android                 # JS bundle + assets
eas build --platform android --profile preview     # APK via EAS Build
```

---

## License

MIT
