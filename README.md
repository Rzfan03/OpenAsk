# OpenAsk

**Multi-provider AI chat client with personality customization, dynamic model fetching, and Google OAuth.**

OpenAsk is an open-source Android-first React Native app built with Expo. It lets you chat with AI models from multiple providers through a single interface, customize the AI's personality with presets and fine-grained parameters, and manage your API keys locally on-device.

Built with [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/), [Clerk](https://clerk.com) for authentication, and [Zustand](https://github.com/pmndrs/zustand) for state management.

---

## Features

- **Multi-provider support** — Switch between OpenRouter, OpenAI, Anthropic, Gemini, and Groq from a single chat interface
- **Dynamic model fetching** — Fetch the latest available models directly from each provider's API
- **Personality customization** — Choose from presets (Formal, Friendly, Sarkastik, Jenius) or craft your own system prompt with adjustable temperature, max tokens, top P, and frequency penalty
- **Drawer navigation** — Sidebar with profile, chat, history, settings, and personality screens
- **Google OAuth** — Sign in with Google via Clerk; no email/password
- **Streaming responses** — Real-time token-by-token streaming from all supported providers
- **File attachments** — Attach text and binary files to messages
- **Conversation history** — Persistent chat history with auto-title generation
- **Push notifications** — Expo push notifications with permission handling
- **Local-only API keys** — All provider API keys stored securely on-device via SecureStore and AsyncStorage
- **Markdown rendering** — AI responses rendered with markdown formatting
- **Android-first** — Designed and optimized for Android
- **100% vibe-coded** — This entire project was built through AI-powered pair programming

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) SDK 56 / React Native 0.85 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) v4 (file-based routing with Drawer) |
| Auth | [Clerk](https://clerk.com) (`@clerk/clerk-expo`) with Google OAuth |
| State | [Zustand](https://github.com/pmndrs/zustand) with AsyncStorage persistence |
| Storage | `expo-secure-store` (tokens), `@react-native-async-storage/async-storage` (state) |
| Streaming | Server-Sent Events / ReadableStream for real-time AI responses |
| UI | React Native components, `@expo/vector-icons` (Ionicons), custom markdown via `react-native-markdown-display` |

## Supported Providers

| Provider | API Base | Authentication |
|----------|----------|---------------|
| [OpenRouter](https://openrouter.ai) | `openrouter.ai/api/v1` | Bearer token |
| [OpenAI](https://platform.openai.com) | `api.openai.com/v1` | Bearer token |
| [Anthropic](https://anthropic.com) | `api.anthropic.com/v1` | x-api-key header |
| [Google Gemini](https://ai.google.dev) | `generativelanguage.googleapis.com/v1beta` | API key query param |
| [Groq](https://groq.com) | `api.groq.com/openai/v1` | Bearer token |

## Architecture

```
app/
  _layout.tsx          -- Root layout: ClerkProvider + push notifications
  index.tsx            -- Auth-based redirect (signed in -> chat, else -> sign-in)
  (auth)/
    _layout.tsx        -- Auth group: redirect if signed in
    sign-in.tsx        -- Google OAuth-only sign-in screen
  (app)/
    _layout.tsx        -- Drawer navigator with custom profile header
    index.tsx          -- Main chat screen with model selector and message input
    history.tsx        -- Conversation history list
    settings.tsx       -- API key management and account settings
    personality.tsx    -- AI personality presets and parameter sliders
components/
  ChatBubble.tsx       -- Markdown-rendered chat message bubble
  MessageInput.tsx     -- Message composition with file attachment
  ModelSelector.tsx    -- Bottom sheet model picker with refresh
constants/
  Colors.ts            -- Design tokens (brand color: #FF6B6B)
  providers.ts         -- Provider definitions and default model lists
lib/
  aiStream.ts          -- Streaming AI chat (OpenAI-compatible, Anthropic, Gemini)
  modelFetcher.ts      -- Dynamic model fetching from all providers
  filePicker.ts        -- Document picker with text/binary handling
  notifications.ts     -- Expo push notification setup
store/
  settingsStore.ts     -- Provider config, API keys, personality, fetched models
  chatStore.ts         -- Conversations, messages, streaming state
  notifStore.ts        -- Push notification token and preferences
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android device or emulator (or iOS with Xcode)

### Installation

```bash
git clone https://github.com/Rzfan03/OpenAsk.git
cd OpenAsk
npm install
```

### Configuration

1. Copy the environment template:

```bash
cp .env.local.example .env.local
```

2. Fill in your keys:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_groq_key_here
```

You can get a Clerk publishable key from [clerk.com](https://clerk.com) and a Groq API key from [groq.com](https://groq.com).

### Running

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` to open on Android emulator.

### Building

```bash
npx expo export --platform android
```

For production builds, install [EAS CLI](https://docs.expo.dev/eas/):

```bash
npm install -g eas-cli
eas build --platform android
```

## API Keys

API keys for each provider are configured in the Settings screen. They are stored locally on your device via AsyncStorage. Groq is the default provider with the key from `.env.local`.

To use other providers, enter their API keys in Settings. The app will automatically fetch available models when a key is saved.

## Personality

The Personality screen lets you control how the AI responds:

- **Presets** — Default, Formal, Friendly, Sarkastik, Jenius
- **System Prompt** — Custom instructions for the AI
- **Temperature** (0–2) — Controls randomness
- **Max Tokens** (256–8192) — Response length limit
- **Top P** (0–1) — Nucleus sampling threshold
- **Frequency Penalty** (0–2) — Discourages repetition

## Screenshots

*(Coming soon)*

## Roadmap

- [ ] Dark mode
- [ ] Custom provider endpoints
- [ ] Image generation providers
- [ ] Voice input
- [ ] i18n support
- [ ] Web version

## License

MIT

---

Built with [Expo](https://expo.dev), [Clerk](https://clerk.com), and a whole lot of AI pair programming.
