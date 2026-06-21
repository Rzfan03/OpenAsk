# OpenAsk: Sidebar, Personality, Dynamic Models & Auth Overhaul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bottom tab navigation with drawer sidebar, add AI personality customization, fetch models dynamically from provider APIs, and switch to Google OAuth-only login.

**Architecture:** Bottom tabs → expo-router Drawer with custom drawer content showing user profile. Personality config stored in global Zustand store, injected into API calls per provider format. Model list fetched on API key input, with hardcoded fallback. Google OAuth via Clerk `authenticateWithRedirect`.

**Tech Stack:** Expo SDK 56, expo-router Drawer, Clerk, Zustand, react-native-gesture-handler, react-native-reanimated

---

### Task 0: Install Dependencies

- [ ] **Step 1: Install drawer dependencies**

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-safe-area-context
```

- [ ] **Step 2: Verify they installed**

```bash
ls node_modules/react-native-gesture-handler/package.json node_modules/react-native-reanimated/package.json node_modules/react-native-safe-area-context/package.json
```

Expected: all three files exist.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add drawer dependencies"
```

---

### Task 1: Environment & Default Provider

- [ ] **Step 1: Add Groq API key to `.env.local`**

Edit `.env.local` to add the Groq key:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_groq_api_key_here
```

- [ ] **Step 2: Copy env for type generation**

```bash
cp .env.local .env
npx expo start --no-dev 2>/dev/null &
sleep 5 && kill %1 2>/dev/null
```

This generates `expo-env.d.ts` with the new env var types.

- [ ] **Step 3: Commit**

```bash
git add .env.local .env
git commit -m "chore: add Groq API key to env"
```

---

### Task 2: Update settingsStore

**File:** `store/settingsStore.ts`

- [ ] **Step 1: Add PersonalityConfig type and fetchedModels**

Edit `store/settingsStore.ts` to add the personality config type, fetched models, and change default provider to groq.

Complete file after edit:

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROVIDERS } from '../constants/providers';

export type FetchedModel = {
  id: string;
  name: string;
};

export type ProviderConfig = {
  providerId: string;
  apiKey: string;
  selectedModel: string;
};

export type PersonalityConfig = {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  activePreset: string;
};

type SettingsStore = {
  providers: ProviderConfig[];
  activeProviderId: string;
  personality: PersonalityConfig;
  fetchedModels: Record<string, FetchedModel[]>;
  setApiKey: (providerId: string, apiKey: string) => void;
  setSelectedModel: (providerId: string, modelId: string) => void;
  setActiveProvider: (providerId: string) => void;
  getActiveProvider: () => ProviderConfig | null;
  getApiKey: (providerId: string) => string;
  setPersonalityField: (field: keyof PersonalityConfig, value: any) => void;
  setPreset: (presetName: string) => void;
  resetPersonality: () => void;
  setFetchedModels: (providerId: string, models: FetchedModel[]) => void;
};

const DEFAULT_PERSONALITY: PersonalityConfig = {
  systemPrompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1.0,
  frequencyPenalty: 0.0,
  activePreset: 'Default',
};

const PRESETS: Record<string, Partial<PersonalityConfig>> = {
  Default: {
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    activePreset: 'Default',
  },
  Formal: {
    systemPrompt:
      'You are a professional assistant. Respond formally and concisely. Use proper grammar and avoid casual language.',
    temperature: 0.3,
    activePreset: 'Formal',
  },
  Friendly: {
    systemPrompt:
      'You are a warm, friendly assistant. Be approachable and conversational. Use a relaxed tone.',
    temperature: 0.8,
    activePreset: 'Friendly',
  },
  Sarkastik: {
    systemPrompt:
      'You are a witty, sarcastic assistant. Use humor and irony in your responses.',
    temperature: 0.9,
    activePreset: 'Sarkastik',
  },
  Jenius: {
    systemPrompt:
      'You are a deep expert in all fields. Provide thorough, expert-level responses with detailed explanations.',
    temperature: 0.5,
    activePreset: 'Jenius',
  },
};

const defaultProviders: ProviderConfig[] = PROVIDERS.map((p) => ({
  providerId: p.id,
  apiKey: p.id === 'groq' ? (process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '') : '',
  selectedModel: p.models[0]?.id ?? '',
}));

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      providers: defaultProviders,
      activeProviderId: 'groq',
      personality: { ...DEFAULT_PERSONALITY },
      fetchedModels: {},

      setApiKey: (providerId, apiKey) =>
        set((s) => ({
          providers: s.providers.map((p) =>
            p.providerId === providerId ? { ...p, apiKey } : p
          ),
        })),

      setSelectedModel: (providerId, modelId) =>
        set((s) => ({
          providers: s.providers.map((p) =>
            p.providerId === providerId ? { ...p, selectedModel: modelId } : p
          ),
        })),

      setActiveProvider: (providerId) => set({ activeProviderId: providerId }),

      getActiveProvider: () => {
        const { providers, activeProviderId } = get();
        return providers.find((p) => p.providerId === activeProviderId) ?? null;
      },

      getApiKey: (providerId) => {
        const { providers } = get();
        return providers.find((p) => p.providerId === providerId)?.apiKey ?? '';
      },

      setPersonalityField: (field, value) =>
        set((s) => ({
          personality: { ...s.personality, [field]: value },
        })),

      setPreset: (presetName) => {
        const preset = PRESETS[presetName];
        if (preset) {
          set((s) => ({
            personality: { ...s.personality, ...preset },
          }));
        }
      },

      resetPersonality: () => set({ personality: { ...DEFAULT_PERSONALITY } }),

      setFetchedModels: (providerId, models) =>
        set((s) => ({
          fetchedModels: { ...s.fetchedModels, [providerId]: models },
        })),
    }),
    { name: 'openask-settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add store/settingsStore.ts
git commit -m "feat: add personality config and fetched models to settings store"

```

---

### Task 3: Create model fetcher

**File:** `lib/modelFetcher.ts` (NEW)

- [ ] **Step 1: Create the model fetcher**

```tsx
import { FetchedModel } from '../store/settingsStore';

type ModelEndpoint = {
  url: string;
  headers: Record<string, string>;
  parser: (data: any) => FetchedModel[];
};

function openRouterParser(data: any): FetchedModel[] {
  return (data.data ?? []).map((m: any) => ({
    id: m.id,
    name: m.name ?? m.id,
  }));
}

function openAIParser(data: any): FetchedModel[] {
  return (data.data ?? [])
    .filter((m: any) => m.id.startsWith('gpt') || m.id.startsWith('o'))
    .map((m: any) => ({ id: m.id, name: m.id }));
}

function anthropicParser(data: any): FetchedModel[] {
  return (data.data ?? []).map((m: any) => ({
    id: m.id,
    name: m.display_name ?? m.id,
  }));
}

function groqParser(data: any): FetchedModel[] {
  return (data.data ?? []).map((m: any) => ({
    id: m.id,
    name: m.id,
  }));
}

function geminiParser(data: any): FetchedModel[] {
  return (data.models ?? [])
    .filter((m: any) => m.name.includes('gemini'))
    .map((m: any) => ({
      id: m.name.replace(/^models\//, ''),
      name: m.displayName ?? m.name.replace(/^models\//, ''),
    }));
}

const ENDPOINTS: Record<string, ModelEndpoint> = {
  openrouter: {
    url: 'https://openrouter.ai/api/v1/models',
    headers: {},
    parser: openRouterParser,
  },
  openai: {
    url: 'https://api.openai.com/v1/models',
    headers: {},
    parser: openAIParser,
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/models',
    headers: {},
    parser: anthropicParser,
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/models',
    headers: {},
    parser: groqParser,
  },
  google: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    headers: {},
    parser: geminiParser,
  },
};

export async function fetchModelsForProvider(
  providerId: string,
  apiKey: string
): Promise<FetchedModel[]> {
  const endpoint = ENDPOINTS[providerId];
  if (!endpoint) throw new Error(`Unknown provider: ${providerId}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...endpoint.headers,
  };

  let url = endpoint.url;
  if (providerId === 'google') {
    url += `?key=${encodeURIComponent(apiKey)}`;
  } else if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  if (providerId === 'anthropic' && apiKey) {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${providerId} fetch error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return endpoint.parser(data);
}

export async function fetchAllModels(
  providers: { providerId: string; apiKey: string }[]
): Promise<Record<string, FetchedModel[]>> {
  const results: Record<string, FetchedModel[]> = {};
  const promises = providers.map(async (p) => {
    if (!p.apiKey && p.providerId !== 'openrouter') return;
    try {
      results[p.providerId] = await fetchModelsForProvider(p.providerId, p.apiKey);
    } catch {
      // silently fail, keep using fallback
    }
  });
  await Promise.allSettled(promises);
  return results;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/modelFetcher.ts
git commit -m "feat: add dynamic model fetcher for all providers"

```

---

### Task 4: Update ModelSelector

**File:** `components/ModelSelector.tsx`

- [ ] **Step 1: Rewrite to show dynamic models + refresh button**

```tsx
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { PROVIDERS } from '../constants/providers';
import { fetchModelsForProvider } from '../lib/modelFetcher';
import { Colors } from '../constants/Colors';

type Props = { onClose: () => void };

export function ModelSelector({ onClose }: Props) {
  const {
    activeProviderId, providers, setActiveProvider,
    setSelectedModel, fetchedModels, setFetchedModels,
  } = useSettingsStore();
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const allModels = (providerId: string) =>
    fetchedModels[providerId] ??
    PROVIDERS.find((p) => p.id === providerId)?.models ??
    [];

  const handleRefresh = async (providerId: string) => {
    const config = providers.find((p) => p.providerId === providerId);
    if (!config?.apiKey && providerId !== 'openrouter') return;
    setRefreshing(providerId);
    try {
      const models = await fetchModelsForProvider(providerId, config?.apiKey ?? '');
      setFetchedModels(providerId, models);
    } catch {}
    setRefreshing(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Model</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.text} /></TouchableOpacity>
      </View>
      <ScrollView>
        {PROVIDERS.map((provider) => {
          const config = providers.find((p) => p.providerId === provider.id);
          const hasKey = !!config?.apiKey || provider.id === 'openrouter';
          const models = allModels(provider.id);
          const isRefreshing = refreshing === provider.id;
          return (
            <View key={provider.id}>
              <View style={styles.providerRow}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <View style={styles.providerActions}>
                  {!hasKey && <Text style={styles.noKey}>No API key</Text>}
                  {hasKey && (
                    <TouchableOpacity onPress={() => handleRefresh(provider.id)} disabled={isRefreshing}>
                      {isRefreshing ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {models.map((model) => {
                const isActive = activeProviderId === provider.id && config?.selectedModel === model.id;
                return (
                  <TouchableOpacity
                    key={model.id}
                    style={[styles.modelRow, isActive && styles.modelRowActive]}
                    onPress={() => {
                      setActiveProvider(provider.id);
                      setSelectedModel(provider.id, model.id);
                      onClose();
                    }}
                    disabled={!hasKey}
                  >
                    <Text style={[styles.modelName, !hasKey && styles.disabled, isActive && styles.modelNameActive]}>
                      {model.name}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, borderRadius: 16, padding: 16, maxHeight: 480 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  providerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  providerName: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  providerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noKey: { fontSize: 11, color: Colors.error },
  modelRow: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modelRowActive: { backgroundColor: Colors.surface },
  modelName: { fontSize: 14, color: Colors.text },
  modelNameActive: { color: Colors.primary, fontWeight: '600' },
  disabled: { color: Colors.textTertiary },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/ModelSelector.tsx
git commit -m "feat: add dynamic model fetching and refresh to ModelSelector"

```

---

### Task 5: Update aiStream for personality injection

**File:** `lib/aiStream.ts`

- [ ] **Step 1: Edit to inject system prompt and parameters from personality config**

```tsx
import { PROVIDERS } from '../constants/providers';
import { useSettingsStore } from '../store/settingsStore';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const store = useSettingsStore.getState();
  const activeProvider = store.getActiveProvider();
  if (!activeProvider) return onError('No active provider');

  const apiKey = activeProvider.apiKey;
  if (!apiKey) return onError('API key not set. Go to Settings to add your API key.');

  const providerInfo = PROVIDERS.find((p) => p.id === activeProvider.providerId);
  if (!providerInfo) return onError('Provider not found');

  const model = activeProvider.selectedModel;
  const baseUrl = providerInfo.baseUrl;

  const { systemPrompt, temperature, maxTokens, topP, frequencyPenalty } = store.personality;
  const hasSystemPrompt = systemPrompt && systemPrompt !== 'You are a helpful AI assistant.';

  try {
    if (activeProvider.providerId === 'anthropic') {
      await streamAnthropic(messages, model, apiKey, hasSystemPrompt ? systemPrompt : undefined, temperature, maxTokens, onChunk, onDone, onError);
      return;
    }

    if (activeProvider.providerId === 'google') {
      await streamGemini(messages, model, apiKey, baseUrl, hasSystemPrompt ? systemPrompt : undefined, temperature, maxTokens, onChunk, onDone, onError);
      return;
    }

    const body: Record<string, any> = {
      model,
      messages: hasSystemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages,
      stream: true,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(activeProvider.providerId === 'openrouter' && {
          'HTTP-Referer': 'https://openask.app',
          'X-Title': 'OpenAsk',
        }),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return onError(`API Error: ${err}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return onError('No response body');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const json = JSON.parse(data);
          const chunk = json.choices?.[0]?.delta?.content ?? '';
          if (chunk) onChunk(chunk);
        } catch {}
      }
    }
    onDone();
  } catch (e: any) {
    onError(e.message ?? 'Unknown error');
  }
}

async function streamAnthropic(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  systemPrompt: string | undefined,
  temperature: number,
  maxTokens: number,
  onChunk: (c: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMsgs = messages.filter((m) => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      ...((systemPrompt || systemMsg) && { system: systemPrompt ?? systemMsg!.content }),
      messages: chatMsgs,
    }),
  });

  if (!res.ok) return onError(`Anthropic Error: ${await res.text()}`);

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return onError('No response body');

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === 'content_block_delta') onChunk(json.delta?.text ?? '');
      } catch {}
    }
  }
  onDone();
}

async function streamGemini(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  baseUrl: string,
  systemPrompt: string | undefined,
  temperature: number,
  maxTokens: number,
  onChunk: (c: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const body: Record<string, any> = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(
    `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) return onError(`Gemini Error: ${await res.text()}`);

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return onError('No response body');

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(line.slice(6));
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) onChunk(text);
      } catch {}
    }
  }
  onDone();
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/aiStream.ts
git commit -m "feat: inject personality config into AI streaming calls"

```

---

### Task 6: Create personality screen

**File:** `app/(app)/personality.tsx` (NEW)

- [ ] **Step 1: Create the personality settings screen**

```tsx
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, PersonalityConfig } from '../../store/settingsStore';
import { Colors } from '../../constants/Colors';

const PRESETS = ['Default', 'Formal', 'Friendly', 'Sarkastik', 'Jenius'];

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

function SimpleSlider({ label, value, min, max, step, onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const marks = [];
  for (let v = min; v <= max; v += step * 5) {
    marks.push(v);
  }

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{value.toFixed(step < 1 ? 1 : 0)}</Text>
      </View>
      <View style={sliderStyles.trackContainer}>
        <View style={sliderStyles.track}>
          <View style={[sliderStyles.fill, { width: `${percentage}%` }]} />
        </View>
        <View style={sliderStyles.marks}>
          {marks.map((v, i) => (
            <TouchableOpacity
              key={i}
              style={[
                sliderStyles.mark,
                v <= value && sliderStyles.markActive,
              ]}
              onPress={() => onChange(Math.round(v / step) * step)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, color: Colors.textSecondary },
  value: { fontSize: 13, fontWeight: '600', color: Colors.text },
  trackContainer: { height: 24, justifyContent: 'center', position: 'relative' },
  track: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  marks: { flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', left: 0, right: 0, top: 8 },
  mark: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  markActive: { backgroundColor: Colors.primary },
});

export default function PersonalityScreen() {
  const router = useRouter();
  const { personality, setPersonalityField, setPreset, resetPersonality } = useSettingsStore();
  const [localPrompt, setLocalPrompt] = useState(personality.systemPrompt);

  const handleSavePrompt = useCallback(() => {
    setPersonalityField('systemPrompt', localPrompt);
  }, [localPrompt, setPersonalityField]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personality</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Presets */}
        <Text style={styles.sectionTitle}>Presets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
          {PRESETS.map((name) => {
            const active = personality.activePreset === name;
            return (
              <TouchableOpacity
                key={name}
                style={[styles.presetChip, active && styles.presetChipActive]}
                onPress={() => setPreset(name)}
              >
                <Text style={[styles.presetText, active && styles.presetTextActive]}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* System Prompt */}
        <Text style={styles.sectionTitle}>System Prompt</Text>
        <TextInput
          style={styles.promptInput}
          value={localPrompt}
          onChangeText={setLocalPrompt}
          onBlur={handleSavePrompt}
          multiline
          placeholder="Custom instructions for the AI..."
          placeholderTextColor={Colors.textTertiary}
          textAlignVertical="top"
        />

        {/* Parameters */}
        <Text style={styles.sectionTitle}>Parameters</Text>
        <View style={styles.card}>
          <SimpleSlider
            label="Temperature"
            value={personality.temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => setPersonalityField('temperature', v)}
          />
          <View style={styles.sep} />
          <SimpleSlider
            label="Max Tokens"
            value={personality.maxTokens}
            min={256}
            max={8192}
            step={256}
            onChange={(v) => setPersonalityField('maxTokens', v)}
          />
          <View style={styles.sep} />
          <SimpleSlider
            label="Top P"
            value={personality.topP}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setPersonalityField('topP', v)}
          />
          <View style={styles.sep} />
          <SimpleSlider
            label="Frequency Penalty"
            value={personality.frequencyPenalty}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => setPersonalityField('frequencyPenalty', v)}
          />
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={() => { resetPersonality(); setLocalPrompt('You are a helpful AI assistant.'); }}>
          <Ionicons name="refresh-outline" size={16} color={Colors.error} />
          <Text style={styles.resetText}>Reset to Default</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },
  presetRow: { marginBottom: 8 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  presetChipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  presetText: { fontSize: 13, fontWeight: '500', color: Colors.text },
  presetTextActive: { color: Colors.primary },
  promptInput: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, minHeight: 120, lineHeight: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  sep: { height: 1, backgroundColor: Colors.border },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, padding: 12 },
  resetText: { fontSize: 14, color: Colors.error, fontWeight: '500' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/personality.tsx
git commit -m "feat: add personality settings screen with presets and sliders"

```

---

### Task 7: Google OAuth sign-in

**File:** `app/(auth)/sign-in.tsx`

- [ ] **Step 1: Rewrite sign-in to Google OAuth only**

```tsx
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  useWarmUpBrowser();
  const { isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(app)/');
      }
    } catch (e: any) {
      Alert.alert('Error', e.errors?.[0]?.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>OpenAsk</Text>
        <Text style={styles.tagline}>Your AI, your way</Text>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.btnText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 36, fontWeight: '700', color: Colors.primary },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 40 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#4285F4', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Delete sign-up file**

```bash
rm app/(auth)/sign-up.tsx
```

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/sign-in.tsx
git rm app/(auth)/sign-up.tsx
git commit -m "feat: switch to Google OAuth-only sign in"
```

---

### Task 8: Drawer navigation layout

**File:** `app/(app)/_layout.tsx`

- [ ] **Step 1: Rewrite from Tabs to Drawer with custom drawer content**

```tsx
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { Drawer, DrawerContentScrollView, DrawerItemList } from 'expo-router/drawer';
import { Image, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

function CustomDrawerContent(props: any) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        {/* Profile Header */}
        <View style={drawerStyles.profile}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={drawerStyles.avatar} />
          ) : (
            <View style={drawerStyles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
          )}
          <Text style={drawerStyles.name}>{user?.fullName ?? 'User'}</Text>
          <Text style={drawerStyles.email}>{user?.primaryEmailAddress?.emailAddress ?? ''}</Text>
        </View>
        <View style={drawerStyles.sep} />
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Sign out at bottom */}
      <TouchableOpacity
        style={drawerStyles.signOut}
        onPress={() => signOut()}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={drawerStyles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const drawerStyles = StyleSheet.create({
  profile: { padding: 20, alignItems: 'center', gap: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 4 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: Colors.border },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  email: { fontSize: 12, color: Colors.textTertiary },
  sep: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  signOutText: { color: Colors.error, fontSize: 15, fontWeight: '500' },
});

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.text,
        drawerActiveBackgroundColor: `${Colors.primary}15`,
        drawerLabelStyle: { fontSize: 15, fontWeight: '500' },
        drawerItemStyle: { borderRadius: 8, marginHorizontal: 12 },
        drawerStyle: { backgroundColor: Colors.background, width: 280 },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Chat',
          drawerIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          title: 'History',
          drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="personality"
        options={{
          title: 'Personality',
          drawerIcon: ({ color, size }) => <Ionicons name="color-wand-outline" size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/_layout.tsx
git commit -m "feat: replace tabs with drawer navigation"

```

---

### Task 9: Update chat screen header

**File:** `app/(app)/index.tsx`

- [ ] **Step 1: Update header to use DrawerToggleButton + keep model selector & new chat**

The header of the chat screen needs a hamburger button (DrawerToggleButton), New Chat button, and Model Selector button. Replace the entire file:

```tsx
import { useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, Text, TouchableOpacity,
  Modal, SafeAreaView, StatusBar,
} from 'react-native';
import { DrawerToggleButton } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore, Message } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ChatBubble } from '../../components/ChatBubble';
import { MessageInput } from '../../components/MessageInput';
import { ModelSelector } from '../../components/ModelSelector';
import { streamChat } from '../../lib/aiStream';
import { formatFileForPrompt, AttachedFile } from '../../lib/filePicker';
import { PROVIDERS } from '../../constants/providers';
import { Colors } from '../../constants/Colors';

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const {
    createConversation, addMessage, updateLastMessage,
    setStreaming, isStreaming, getActiveConversation, activeConversationId,
  } = useChatStore();
  const { activeProviderId, providers, getActiveProvider } = useSettingsStore();

  const conversation = getActiveConversation();
  const messages = conversation?.messages ?? [];

  const activeConfig = getActiveProvider();
  const providerInfo = PROVIDERS.find((p) => p.id === activeProviderId);
  const modelName = providerInfo?.models.find((m) => m.id === activeConfig?.selectedModel)?.name
    ?? activeConfig?.selectedModel
    ?? 'Select Model';

  const handleSend = async (text: string, files: AttachedFile[]) => {
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation(activeProviderId, activeConfig?.selectedModel ?? '');
    }

    let content = text;
    files.forEach((f) => { content += formatFileForPrompt(f); });

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(convId, userMsg);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    addMessage(convId, aiMsg);
    setStreaming(true);

    const allMsgs = [...(useChatStore.getState().conversations.find((c) => c.id === convId)?.messages ?? [])];
    const apiMessages = allMsgs
      .slice(0, -1)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let accumulated = '';
    await streamChat(
      apiMessages,
      (chunk) => {
        accumulated += chunk;
        updateLastMessage(convId!, accumulated);
      },
      () => setStreaming(false),
      (err) => {
        updateLastMessage(convId!, `Error: ${err}`);
        setStreaming(false);
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <DrawerToggleButton />
        </View>
        <TouchableOpacity style={styles.modelBtn} onPress={() => setShowModelSelector(true)}>
          <Text style={styles.modelBtnText} numberOfLines={1}>{modelName}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => useChatStore.getState().setActiveConversation(null)}>
          <Ionicons name="create-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>OpenAsk</Text>
          <Text style={styles.emptySubtitle}>How can I help you today?</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <MessageInput onSend={handleSend} disabled={isStreaming} />

      <Modal visible={showModelSelector} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModelSelector(false)}>
          <View style={styles.sheet}>
            <ModelSelector onClose={() => setShowModelSelector(false)} />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLeft: { marginLeft: -8 },
  modelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, maxWidth: 200 },
  modelBtnText: { fontSize: 13, fontWeight: '500', color: Colors.text },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 28, fontWeight: '700', color: Colors.text },
  emptySubtitle: { fontSize: 16, color: Colors.textSecondary },
  list: { paddingVertical: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/index.tsx
git commit -m "feat: add drawer toggle button to chat header"

```

---

### Task 10: Update settings screen for model refresh

**File:** `app/(app)/settings.tsx`

- [ ] **Step 1: Add model fetch trigger when API key changes**

Add a 500ms debounced fetch when API key changes. Insert after the `notificationsEnabled` import and before the return:

```tsx
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, Switch, Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/settingsStore';
import { useNotifStore } from '../../store/notifStore';
import { PROVIDERS } from '../../constants/providers';
import { fetchModelsForProvider } from '../../lib/modelFetcher';
import { Colors } from '../../constants/Colors';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { providers, setApiKey, activeProviderId, setActiveProvider, setFetchedModels } = useSettingsStore();
  const { notificationsEnabled, setEnabled } = useNotifStore();
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const toggleVisible = (id: string) => setVisible((s) => ({ ...s, [id]: !s[id] }));

  // Debounced model fetch on API key change
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleApiKeyChange = (providerId: string, key: string) => {
    setApiKey(providerId, key);
    if (debounceTimers.current[providerId]) {
      clearTimeout(debounceTimers.current[providerId]);
    }
    debounceTimers.current[providerId] = setTimeout(async () => {
      if (key) {
        try {
          const models = await fetchModelsForProvider(providerId, key);
          setFetchedModels(providerId, models);
        } catch {}
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  // Rest stays the same but with updated imports
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.rowText}>{user?.primaryEmailAddress?.emailAddress ?? 'User'}</Text>
          </View>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={[styles.rowText, { color: Colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
            <Text style={[styles.rowText, { flex: 1 }]}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setEnabled}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        {/* API Keys */}
        <Text style={styles.sectionTitle}>API Keys</Text>
        {PROVIDERS.map((provider) => {
          const config = providers.find((p) => p.providerId === provider.id);
          const apiKey = config?.apiKey ?? '';
          const isActive = provider.id === activeProviderId;
          return (
            <View key={provider.id} style={[styles.card, styles.providerCard]}>
              <TouchableOpacity
                style={styles.providerHeader}
                onPress={() => setActiveProvider(provider.id)}
              >
                <Text style={styles.providerName}>{provider.name}</Text>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={`${provider.name} API Key`}
                  placeholderTextColor={Colors.textTertiary}
                  value={apiKey}
                  onChangeText={(v) => handleApiKeyChange(provider.id, v)}
                  secureTextEntry={!visible[provider.id]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => toggleVisible(provider.id)} style={styles.eyeBtn}>
                  <Ionicons
                    name={visible[provider.id] ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={styles.hint}>
          API keys are stored locally on your device only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  scroll: { padding: 16, paddingBottom: 40, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  providerCard: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  rowText: { fontSize: 15, color: Colors.text },
  sep: { height: 1, backgroundColor: Colors.border },
  providerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  providerName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  activeBadge: { backgroundColor: `${Colors.primary}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontFamily: 'monospace' },
  eyeBtn: { padding: 8 },
  hint: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginTop: 8 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/settings.tsx
git commit -m "feat: auto-fetch models when API key changes"

```

---

### Task 11: Update auth layout (no sign-up route)

**File:** `app/(auth)/_layout.tsx`

- [ ] **Step 1: Remove the sign-up screen reference** (already handled since file was deleted)

The `app/(auth)/_layout.tsx` already uses `Stack` with `headerShown: false` and no explicit screens defined, so it auto-discovers `sign-in` as the only screen. No file edit needed.

- [ ] **Step 2: Verify the auth layout still works**

The layout currently auto-discovers screens from the directory. With `sign-up.tsx` deleted, only `sign-in.tsx` remains. Expo Router will handle the routing automatically.

- [ ] **Step 3: Add sign-up redirect to sign-in layout**

Edit `app/(auth)/_layout.tsx` to handle the removed sign-up route:

```tsx
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/(app)/" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/_layout.tsx
git commit -m "fix: remove sign-up route, only sign-in available"

```
