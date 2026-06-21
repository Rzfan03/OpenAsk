const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    if (res.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    throw new Error(err)
  }
  return res.json()
}

export interface Provider {
  id: string
  name: string
  apiKey: string
  selectedModel: string
  baseUrl: string
  isActive: boolean
}

export interface Personality {
  systemPrompt: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  activePreset: string
}

export interface TunnelStatus {
  running: boolean
  url: string
}

export interface TokenUsage {
  totalTokensIn: number
  totalTokensOut: number
  hourly: { in: number; out: number }
}

export interface TestResult {
  ok: boolean
  message: string
}

export interface ComboItem {
  id: string
  model: string
  order: number
  comboId: string
}

export interface Combo {
  id: string
  name: string
  items: ComboItem[]
}

export interface Settings {
  cavemanMode: boolean
  cacheEnabled: boolean
  cacheTTL: number
  avatarUrl: string
  themeMode: string
  themeAccent: string
  workingDir: string
}

export interface CommunitySkill {
  id: string
  name: string
  repo: string
  description: string
  installs: string
}

export interface Skill {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon: string
  enabled: boolean
}

export type ProviderUpdate = Omit<Partial<Provider>, 'id'>

export const api = {
  login: (password: string) =>
    request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword }) }),

  getProviders: () =>
    request<Provider[]>('/config/providers'),

  createProvider: (data: { id: string; name: string; baseUrl: string; apiKey?: string; selectedModel?: string; isActive?: boolean }) =>
    request<Provider>('/config/providers', { method: 'POST', body: JSON.stringify(data) }),

  updateProvider: (id: string, data: ProviderUpdate) =>
    request<Provider>(`/config/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  fetchProviderModels: (id: string) =>
    request<string[]>(`/config/providers/${id}/models`),

  getPersonality: () =>
    request<Personality>('/config/personality'),

  updatePersonality: (data: Partial<Personality>) =>
    request<Personality>('/config/personality', { method: 'PUT', body: JSON.stringify(data) }),

  getTunnelStatus: () =>
    request<TunnelStatus>('/tunnel/status'),

  startTunnel: () =>
    request<TunnelStatus>('/tunnel/start', { method: 'POST' }),

  stopTunnel: () =>
    request<TunnelStatus>('/tunnel/stop', { method: 'POST' }),

  testProvider: (id: string) =>
    request<TestResult>(`/config/providers/${id}/test`, { method: 'POST' }),

  getTokenUsage: () =>
    request<TokenUsage>('/stats/tokens'),

  getTokenHistory: () =>
    request<{ time: number; in: number; out: number }[]>('/stats/token-history'),

  getUptime: () =>
    request<{ start: number; uptime: number }>('/stats/uptime'),

  getSkills: () =>
    request<Skill[]>('/skills'),

  updateSkill: (id: string, data: Partial<Skill>) =>
    request<Skill>(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  toggleSkill: (id: string) =>
    request<Skill>(`/skills/${id}/toggle`, { method: 'PUT' }),

  createSkill: (data: { name: string; description?: string; systemPrompt?: string; icon?: string }) =>
    request<Skill>('/skills', { method: 'POST', body: JSON.stringify(data) }),

  getCombos: () =>
    request<Combo[]>('/combos'),

  createCombo: (name: string) =>
    request<Combo>('/combos', { method: 'POST', body: JSON.stringify({ name }) }),

  updateCombo: (id: string, name: string) =>
    request<Combo>(`/combos/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),

  deleteCombo: (id: string) =>
    request<void>(`/combos/${id}`, { method: 'DELETE' }),

  addComboItem: (comboId: string, model: string) =>
    request<Combo>(`/combos/${comboId}/items`, { method: 'POST', body: JSON.stringify({ model }) }),

  updateComboItem: (comboId: string, itemId: string, model: string) =>
    request<Combo>(`/combos/${comboId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ model }) }),

  deleteComboItem: (comboId: string, itemId: string) =>
    request<Combo>(`/combos/${comboId}/items/${itemId}`, { method: 'DELETE' }),

  reorderComboItems: (comboId: string, itemIds: string[]) =>
    request<Combo>(`/combos/${comboId}/items/reorder`, { method: 'PUT', body: JSON.stringify({ items: itemIds }) }),

  getSettings: () =>
    request<Settings>('/config/settings'),

  updateSettings: (data: Partial<Settings>) =>
    request<Settings>('/config/settings', { method: 'PUT', body: JSON.stringify(data) }),

  getCommunitySkills: () =>
    request<CommunitySkill[]>('/community-skills'),

  installCommunitySkill: (repo: string) =>
    request<any>(`/skills/install`, { method: 'POST', body: JSON.stringify({ repo }) }),

  getChats: () =>
    request<{ id: string; title: string; updatedAt: string }[]>('/chats'),

  createChat: (title?: string) =>
    request<{ id: string }>('/chats', { method: 'POST', body: JSON.stringify({ title: title || 'New Chat' }) }),

  renameChat: (id: string, title: string) =>
    request<any>(`/chats/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),

  deleteChat: (id: string) =>
    request<void>(`/chats/${id}`, { method: 'DELETE' }),
}
