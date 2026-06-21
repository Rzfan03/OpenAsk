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
    const chatMsgs = messages.filter((m) => m.role !== 'system');

    if (activeProvider.providerId === 'anthropic') {
      await streamAnthropic(messages, model, apiKey, hasSystemPrompt ? systemPrompt : undefined, temperature, maxTokens, topP, onChunk, onDone, onError);
      return;
    }

    if (activeProvider.providerId === 'google') {
      await streamGemini(messages, model, apiKey, baseUrl, hasSystemPrompt ? systemPrompt : undefined, temperature, maxTokens, topP, onChunk, onDone, onError);
      return;
    }

    const body: Record<string, any> = {
      model,
      messages: hasSystemPrompt ? [{ role: 'system', content: systemPrompt }, ...chatMsgs] : chatMsgs,
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
  topP: number,
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
      top_p: topP,
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
  topP: number,
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
      topP,
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
