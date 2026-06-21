import type { FetchedModel } from '../store/settingsStore';

async function fetchOpenRouter(apiKey: string): Promise<FetchedModel[]> {
  const headers: Record<string, string> = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? []).map((m: any) => ({ id: m.id, name: m.name ?? m.id }));
}

async function fetchOpenAI(apiKey: string): Promise<FetchedModel[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? [])
    .filter((m: any) => m.id.startsWith('gpt') || m.id.startsWith('o'))
    .map((m: any) => ({ id: m.id, name: m.id }));
}

async function fetchAnthropic(apiKey: string): Promise<FetchedModel[]> {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? []).map((m: any) => ({ id: m.id, name: m.display_name ?? m.id }));
}

async function fetchGroq(apiKey: string): Promise<FetchedModel[]> {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? []).map((m: any) => ({ id: m.id, name: m.id }));
}

async function fetchGoogle(apiKey: string): Promise<FetchedModel[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.models ?? [])
    .filter((m: any) => m.name.toLowerCase().includes('gemini'))
    .map((m: any) => {
      const id = m.name.replace(/^models\//, '');
      return { id, name: m.displayName ?? id };
    });
}

const fetchers: Record<string, (apiKey: string) => Promise<FetchedModel[]>> = {
  openrouter: fetchOpenRouter,
  openai: fetchOpenAI,
  anthropic: fetchAnthropic,
  groq: fetchGroq,
  google: fetchGoogle,
};

export async function fetchModelsForProvider(
  providerId: string,
  apiKey: string
): Promise<FetchedModel[]> {
  const fetcher = fetchers[providerId];
  if (!fetcher) return [];
  try {
    return await fetcher(apiKey);
  } catch {
    return [];
  }
}

export async function fetchAllModels(
  providers: { providerId: string; apiKey: string }[]
): Promise<Record<string, FetchedModel[]>> {
  const results = await Promise.allSettled(
    providers.map((p) =>
      fetchModelsForProvider(p.providerId, p.apiKey).then(
        (models) => [p.providerId, models] as const
      )
    )
  );
  const acc: Record<string, FetchedModel[]> = {};
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const [providerId, models] = r.value;
      acc[providerId] = models;
    }
  }
  return acc;
}
