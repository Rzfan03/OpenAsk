import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROVIDERS } from '../constants/providers';

type ProviderConfig = {
  providerId: string;
  apiKey: string;
  selectedModel: string;
};

export type FetchedModel = {
  id: string;
  name: string;
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
  setPersonalityField: <K extends keyof PersonalityConfig>(field: K, value: PersonalityConfig[K]) => void;
  setPreset: (presetName: string) => void;
  resetPersonality: () => void;
  setFetchedModels: (providerId: string, models: FetchedModel[]) => void;
};

const PRESETS: Record<string, Partial<PersonalityConfig>> = {
  Default: { activePreset: 'Default' },
  Formal: { systemPrompt: 'You are a professional assistant. Respond formally and concisely. Use proper grammar and avoid casual language.', temperature: 0.3, activePreset: 'Formal' },
  Friendly: { systemPrompt: 'You are a warm, friendly assistant. Be approachable and conversational. Use a relaxed tone.', temperature: 0.8, activePreset: 'Friendly' },
  Sarkastik: { systemPrompt: 'You are a witty, sarcastic assistant. Use humor and irony in your responses.', temperature: 0.9, activePreset: 'Sarkastik' },
  Jenius: { systemPrompt: 'You are a deep expert in all fields. Provide thorough, expert-level responses with detailed explanations.', temperature: 0.5, activePreset: 'Jenius' },
};

const DEFAULT_PERSONALITY: PersonalityConfig = {
  systemPrompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1.0,
  frequencyPenalty: 0.0,
  activePreset: 'Default',
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
