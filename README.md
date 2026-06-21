# OpenAsk

Multi-provider AI chat client with personality customization, dynamic model fetching, and Google OAuth.

Built with [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/), [Clerk](https://clerk.com), and [Zustand](https://github.com/pmndrs/zustand).

## Features

- **Multi-provider** — OpenAI, Anthropic, Gemini, Groq, OpenRouter in one interface
- **Personality presets** — Formal, Friendly, Sarkastik, Jenius, or custom system prompt + parameters
- **Dynamic models** — Fetches available models directly from each provider API
- **Google OAuth** — Sign in with Google only (no email/password)
- **Streaming** — Real-time token-by-token streaming
- **Conversation history** — Persistent with auto-title generation
- **File attachments** — Text and binary files
- **Local API keys** — Stored on-device, never sent anywhere

## Tech Stack

| Layer | |
|-------|---|
| Framework | Expo SDK 56 / React Native 0.85 |
| Navigation | Expo Router v4 with Drawer |
| Auth | Clerk (Google OAuth) |
| State | Zustand + AsyncStorage |
| UI | React Native, Ionicons, react-native-markdown-display |

## Supported Providers

| Provider | Auth |
|----------|------|
| [OpenRouter](https://openrouter.ai) | Bearer token |
| [OpenAI](https://platform.openai.com) | Bearer token |
| [Anthropic](https://anthropic.com) | x-api-key |
| [Google Gemini](https://ai.google.dev) | API key |
| [Groq](https://groq.com) (default) | Bearer token |

## Quick Start

```bash
git clone https://github.com/Rzfan03/OpenAsk.git
cd OpenAsk
npm install
cp .env.local.example .env.local  # fill in your keys
npx expo start
```

Environment variables:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_GROQ_API_KEY=gsk_...
```

[Get Clerk key](https://clerk.com) · [Get Groq key](https://groq.com)

## Project Structure

```
app/
  _layout.tsx             ClerkProvider + push notifications
  index.tsx               Auth redirect
  (auth)/sign-in.tsx      Google OAuth
  (app)/_layout.tsx       Drawer navigator
  (app)/index.tsx         Chat screen
  (app)/history.tsx       Conversation list
  (app)/settings.tsx      API key management
  (app)/personality.tsx   AI personality config
components/               ChatBubble, MessageInput, ModelSelector
lib/                      aiStream, modelFetcher, filePicker, notifications
store/                    settingsStore, chatStore, notifStore
constants/                Colors, providers
```

## Building

```bash
npx expo export --platform android                 # export bundle
eas build --platform android --profile preview     # APK via EAS
```

## License

MIT
