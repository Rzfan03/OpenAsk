import prisma from '../prisma/client'
import { TOOL_DEFINITIONS, executeTool } from './tools'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: any
  file?: { name: string; type: string; base64: string }
}

export interface StreamEvent {
  type: 'content' | 'tool_call' | 'tool_result' | 'error'
  content?: string
  id?: string
  tool?: string
  args?: Record<string, any>
  ok?: boolean
  result?: string
  error?: string
}

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<StreamEvent> {
  const provider = await prisma.provider.findFirst({ where: { isActive: true } })
  if (!provider) { yield { type: 'error', error: 'No active provider' }; return }
  if (!provider.apiKey) { yield { type: 'error', error: 'API key not set for ' + provider.name }; return }

  const personality = await prisma.personality.findUnique({ where: { id: 'main' } })
  if (!personality) { yield { type: 'error', error: 'Personality not found' }; return }

  const skills = await prisma.skill.findMany({ where: { enabled: true } })
  const skillsPrompt = skills.map(s => s.systemPrompt).filter(Boolean).join('\n\n')

  let systemPrompt = personality.systemPrompt && personality.systemPrompt !== 'You are a helpful AI assistant.'
    ? personality.systemPrompt
    : undefined
  if (systemPrompt && skillsPrompt) systemPrompt += '\n\n' + skillsPrompt
  else if (skillsPrompt) systemPrompt = skillsPrompt

  const messagesWithFile = await attachFiles(messages)
  const chatMsgs = messagesWithFile.filter((m: any) => m.role !== 'system')

  if (provider.id === 'anthropic') {
    yield* streamAnthropic(chatMsgs, provider.selectedModel, provider.apiKey, systemPrompt, personality)
    return
  }
  if (provider.id === 'google') {
    yield* streamGemini(chatMsgs, provider.selectedModel, provider.apiKey, provider.baseUrl, systemPrompt, personality)
    return
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  }
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://openask.app'
    headers['X-Title'] = 'OpenAsk'
  }

  const msgs: any[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...chatMsgs]
    : [...chatMsgs]

  while (true) {
    const body: Record<string, unknown> = {
      model: provider.selectedModel,
      messages: msgs,
      tools: TOOL_DEFINITIONS,
      stream: false,
      temperature: personality.temperature,
      max_tokens: personality.maxTokens,
      top_p: personality.topP,
      frequency_penalty: personality.frequencyPenalty,
    }

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST', headers, body: JSON.stringify(body),
    })
    if (!res.ok) { yield { type: 'error', error: `API Error: ${await res.text()}` }; return }

    const data = await res.json()
    const choice = data.choices?.[0]
    const msg = choice?.message

    if (msg?.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const args = safeJSONParse(tc.function.arguments)
        yield { type: 'tool_call', id: tc.id, tool: tc.function.name, args }
        let toolResult: string
        let toolOk = true
        try {
          toolResult = await executeTool(tc.function.name, args)
        } catch (err: any) {
          toolResult = `Error: ${err.message}`
          toolOk = false
        }
        yield { type: 'tool_result', id: tc.id, ok: toolOk, result: toolOk ? toolResult : undefined, error: toolOk ? undefined : toolResult }
        msgs.push({ role: 'assistant', content: null, tool_calls: [tc] })
        msgs.push({ role: 'tool', tool_call_id: tc.id, content: toolResult })
      }
      // Continue loop — let LLM see tool results
    } else {
      // No tool calls — stream the final text response
      const streamBody: Record<string, unknown> = {
        model: provider.selectedModel,
        messages: msgs,
        stream: true,
        temperature: personality.temperature,
        max_tokens: personality.maxTokens,
        top_p: personality.topP,
        frequency_penalty: personality.frequencyPenalty,
      }
      const streamRes = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST', headers, body: JSON.stringify(streamBody),
      })
      if (!streamRes.ok) { yield { type: 'error', error: `API Error: ${await streamRes.text()}` }; return }
      yield* readStreamToEvents(streamRes)
      break
    }
  }
}

async function attachFiles(messages: ChatMessage[]): Promise<any[]> {
  return messages.map((msg) => {
    if (msg.file) {
      const { name, type, base64 } = msg.file
      const dataUrl = `data:${type};base64,${base64}`
      if (type.startsWith('image/')) {
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content || `[File: ${name}]` },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }
      }
      return {
        ...msg,
        content: msg.content || `[Attached file: ${name}]\n\n${base64.slice(0, 1000)}...`,
      }
    }
    return msg
  })
}

async function* streamAnthropic(
  messages: any[], model: string, apiKey: string,
  systemPrompt: string | undefined,
  personality: { temperature: number; maxTokens: number; topP: number }
): AsyncGenerator<StreamEvent> {
  const body: Record<string, unknown> = {
    model, max_tokens: personality.maxTokens, temperature: personality.temperature,
    top_p: personality.topP, stream: true, messages,
  }
  if (systemPrompt) body.system = systemPrompt
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  })
  if (!res.ok) { yield { type: 'error', error: `Anthropic Error: ${await res.text()}` }; return }
  yield* readStreamToEvents(res)
}

async function* streamGemini(
  messages: any[], model: string, apiKey: string, baseUrl: string,
  systemPrompt: string | undefined,
  personality: { temperature: number; maxTokens: number; topP: number }
): AsyncGenerator<StreamEvent> {
  const contents = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: typeof m.content === 'string' ? [{ text: m.content }] : m.content,
  }))
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: personality.temperature, maxOutputTokens: personality.maxTokens, topP: personality.topP },
  }
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] }
  const res = await fetch(`${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) { yield { type: 'error', error: `Gemini Error: ${await res.text()}` }; return }
  yield* readStreamToEvents(res)
}

async function* readStreamToEvents(res: Response): AsyncGenerator<StreamEvent> {
  const reader = res.body?.getReader()
  if (!reader) { yield { type: 'error', error: 'No response body' }; return }
  const decoder = new TextDecoder()
  let buffer = ''
  let accumulated = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const raw = json.choices?.[0]?.delta?.content
          || json.delta?.text
          || json.candidates?.[0]?.content?.parts?.[0]?.text
          || ''
        if (!raw) continue
        const d = raw.startsWith(accumulated) ? raw.slice(accumulated.length) : raw
        accumulated += d
        if (d) yield { type: 'content', content: d }
      } catch {}
    }
  }
}

function safeJSONParse(s: string): Record<string, any> {
  try { return JSON.parse(s) } catch { return {} }
}
