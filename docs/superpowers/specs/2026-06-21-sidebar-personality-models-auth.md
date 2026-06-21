# OpenAsk: Sidebar, Personality, Dynamic Models & Auth Overhaul

## Overview

Redesign OpenAsk navigation from bottom tabs to drawer-based sidebar. Add full AI personality customization. Fetch available models dynamically from each provider API. Switch auth to Google OAuth-only with custom UI and profile display.

## 1. Navigation Architecture

Replace `expo-router` Tabs with Drawer using `expo-router/drawer` (backed by `react-native-gesture-handler` and `react-native-reanimated`).

**Before:**
```
RootStack
  ├─ (auth)/sign-in
  ├─ (auth)/sign-up
  └─ (app)/ → Tabs (Chat | History | Settings)
```

**After:**
```
RootStack
  ├─ (auth)/sign-in
  └─ (app)/ → Drawer
       ├─ Chat
       ├─ History
       ├─ Settings
       └─ Personality
```

- Drawer opens via gesture (edge swipe from left) or hamburger icon in header
- Android: uses `drawerStyle` with proper status bar handling
- Bottom tabs removed entirely
- Each drawer item navigates to its respective route

## 2. Drawer Content

Drawer header shows user profile (name, email, avatar) fetched from Clerk `useUser()`.

**Menu items:**
| Label | Icon | Route | Notes |
|-------|------|-------|-------|
| Chat | `chatbubble-outline` | `index` | Default, opens chat screen |
| History | `time-outline` | `history` | Existing history screen |
| Settings | `settings-outline` | `settings` | Existing + API key & model fetch |
| Personality | `color-wand-outline` | `personality` | New screen |

## 3. Chat Screen Changes

- Bottom tabs header replaced with drawer-aware header
- Left side: hamburger icon to open drawer
- Right side: New Chat button (`create-outline`) + Model Selector button (same as before)
- Drawer button uses `useNavigation()` with `openDrawer()`
- All other chat behavior preserved (FlatList, streaming, file attachments)

## 4. Personality Screen (New)

File: `app/(app)/personality.tsx`

### Fields
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| System Prompt | Multiline TextInput | `"You are a helpful AI assistant."` | Custom instruction |
| Temperature | Slider 0-2 (step 0.1) | 0.7 | Creativity scale |
| Max Tokens | Slider 256-8192 (step 256) | 4096 | Max response length |
| Top P | Slider 0-1 (step 0.05) | 1.0 | Nucleus sampling |
| Frequency Penalty | Slider 0-2 (step 0.1) | 0.0 | Penalize repetition |

### Presets
| Name | System Prompt | Temp | Notes |
|------|--------------|------|-------|
| Default | "You are a helpful AI assistant." | 0.7 | Standard |
| Formal | "You are a professional assistant. Respond formally and concisely." | 0.3 | Low temp |
| Friendly | "You are a warm, friendly assistant. Be approachable and conversational." | 0.8 | Warm |
| Sarkastik | "You are a witty, sarcastic assistant." | 0.9 | High temp |
| Jenius | "You are a deep expert in all fields. Provide thorough, expert-level responses." | 0.5 | Balanced |

### Storage
Stored in `settingsStore` (global, not per-conversation):
```ts
type PersonalityConfig = {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  activePreset: string;
};
```

### Flow
1. Personality config stored in Zustand (persisted to AsyncStorage)
2. On send, `handleSend` in `chatStore` reads personality from `settingsStore`
3. Passes `systemPrompt` and params to `streamChat()`
4. `aiStream.ts` injects system message + parameters into API request
5. Format varies by provider:
   - **OpenAI/Groq/OpenRouter:** `messages` array prepend `{ role: "system", content }` + `temperature`, `max_tokens`, `top_p`, `frequency_penalty` in body
   - **Anthropic:** `system` top-level field + `temperature`, `max_tokens` in body
   - **Google:** system instruction via `system_instruction` field + `generationConfig` params

## 5. Authentication Changes

### Sign-In (Google OAuth Only)
- Replace email/password form with single "Sign in with Google" button
- Uses Clerk's `authenticateWithRedirect` with `expo-web-browser` (via `useWarmUpBrowser()`)
- Custom UI: styled button with Google logo, not Clerk's default component
- Android: handles redirect via deep link (configured in app.json)

### Sign-Up Removed
- Google OAuth handles both sign-in and sign-up
- `app/(auth)/sign-up.tsx` file removed. `app/(auth)/_layout.tsx` uses Stack with `sign-in` as the only screen; any `/sign-up` route results in 404 redirect to sign-in automatically via Expo Router.

### User Profile
- In `(app)/_layout.tsx`, fetch `useUser()` → `user.fullName`, `user.imageUrl`, `user.primaryEmailAddress?.emailAddress`
- Display in drawer header:
```
┌──────────────────┐
│ [Avatar]         │
│ John Doe         │
│ john@email.com   │
├──────────────────┤
```
- Avatar uses Clerk's `user.imageUrl`, fallback to initials circle
- Drawer header background uses `Colors.primary`

## 6. Dynamic Model Fetching

### Architecture
New file: `lib/modelFetcher.ts`

```ts
type FetchedModel = {
  id: string;
  name: string;
  providerId: string;
};
```

Function `fetchModelsForProvider(providerId, apiKey): Promise<FetchedModel[]>`

### Endpoints per Provider
| Provider | Method | Endpoint | Auth |
|----------|--------|----------|------|
| OpenRouter | GET | `https://openrouter.ai/api/v1/models` | None (public) |
| OpenAI | GET | `https://api.openai.com/v1/models` | `Bearer <key>` |
| Anthropic | GET | `https://api.anthropic.com/v1/models` | `x-api-key` header |
| Groq | GET | `https://api.groq.com/openai/v1/models` | `Bearer <key>` |
| Google | GET | `https://generativelanguage.googleapis.com/v1beta/models?key=<key>` | Query param |

### Trigger
- When user types/updates API key in Settings → auto-fetch after 500ms debounce
- Manual "Refresh Models" button in ModelSelector
- On app launch, fetch for providers that have a key

### Storage
In `settingsStore`:
```ts
fetchedModels: Record<string, FetchedModel[]>;
lastFetchedAt: Record<string, number>; // timestamp for cache
```

### ModelSelector UI Changes
- Show fetched models when available
- Fallback to hardcoded models in `constants/providers.ts` if fetch fails or no key
- Loading state per provider row
- Error state if fetch fails

## 7. Store Changes

### settingsStore.ts additions
```ts
type SettingsStore = {
  // ... existing fields
  // Personality
  personality: PersonalityConfig;
  setPersonalityField: (field: string, value: any) => void;
  setPreset: (presetName: string) => void;
  resetPersonality: () => void;
  // Dynamic models
  fetchedModels: Record<string, FetchedModel[]>;
  setFetchedModels: (providerId: string, models: FetchedModel[]) => void;
};
```

### constants/providers.ts changes
- Remove `models` array from each provider (keep `id`, `name`, `baseUrl` for non-OpenRouter providers)
- OR keep as fallback — simpler to keep and just merge with fetched

**Decision:** Keep hardcoded models as fallback. When fetched models exist, they override.

## 8. File Changes Summary

| File | Action |
|------|--------|
| `app/(app)/_layout.tsx` | EDIT: Tabs → Drawer, add drawer content |
| `app/(app)/index.tsx` | EDIT: header buttons (hamburger + new chat) |
| `app/(app)/history.tsx` | No changes |
| `app/(app)/settings.tsx` | EDIT: add model fetch triggers |
| `app/(app)/personality.tsx` | NEW: personality form |
| `app/(auth)/sign-in.tsx` | EDIT: Google OAuth button only |
| `app/(auth)/sign-up.tsx` | DELETE or redirect |
| `store/settingsStore.ts` | EDIT: add personality + fetchedModels |
| `lib/modelFetcher.ts` | NEW: fetch models per provider |
| `lib/aiStream.ts` | EDIT: inject system prompt + params |
| `store/settingsStore.ts` | EDIT: `activeProviderId` default → `'groq'` |
| `components/ModelSelector.tsx` | EDIT: show dynamic models |
| `.env.local` | EDIT: add Groq API key |

## 9. Error Handling

- **Model fetch failure:** Show toast/alert, keep using hardcoded fallback
- **OAuth failure:** Clerk handles errors, show Alert with message
- **API call with personality:** If system prompt empty, skip sending it
- **Drawer on Android:** Handle back button properly (close drawer, not exit app)

## 10. Android-Specific Considerations

- Drawer uses `edgeWidth` for gesture from screen edge
- Status bar: dark icons on light background
- OAuth: `expo-web-browser` with `createBrowserApp` for Chrome Custom Tabs
- Back button: close drawer first, then navigate back
- SafeAreaView on all screens
