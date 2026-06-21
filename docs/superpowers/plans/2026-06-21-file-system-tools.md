# File System Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add file system tools (read/write/edit/list/delete) to OpenAsk's AI so it can act as a coding assistant in the user's project directory.

**Architecture:** A `server/lib/tools.ts` library provides tool definitions and execution. `streamChat` in `ai.ts` gains a tool loop (non-streaming LLM call → tool_call → execute → loop → final streaming text). New SSE event types (`tool_call`, `tool_result`) stream tool activity to the client, which renders collapsible tool call cards in the chat.

**Tech Stack:** Express 5, Prisma/SQLite, OpenAI-compatible API (OpenRouter/react), React 19, SSE streaming

---

### Task 1: Add `workingDir` to Config model and API

**Files:**
- Modify: `dashboard/server/prisma/schema.prisma`
- Modify: `dashboard/server/routes/config.ts`
- Modify: `dashboard/src/lib/api.ts`

- [ ] **Add `workingDir` column to Config model**

```prisma
model Config {
  id           String  @id @default("main")
  password     String
  tunnelUrl    String  @default("")
  tunnelPort   Int     @default(20130)
  cavemanMode  Boolean @default(false)
  cacheEnabled Boolean @default(false)
  cacheTTL     Int     @default(300)
  avatarUrl    String  @default("")
  themeMode    String  @default("dark")
  themeAccent  String  @default("indigo")
  workingDir   String  @default("")
}
```

- [ ] **Add `workingDir` to Settings GET/PUT in `config.ts`**

```ts
// In GET /settings:
workingDir: config?.workingDir ?? '',

// In PUT /settings:
if (workingDir !== undefined) data.workingDir = workingDir

// In response:
workingDir: config.workingDir,
```

- [ ] **Add `workingDir` to Settings type in `api.ts`**

```ts
export interface Settings {
  cavemanMode: boolean
  cacheEnabled: boolean
  cacheTTL: number
  avatarUrl: string
  themeMode: string
  themeAccent: string
  workingDir: string
}
```

- [ ] **Push schema to DB**

```bash
cd dashboard && npx prisma db push --schema=server/prisma/schema.prisma
```

---

### Task 2: Add Working Directory UI to Overview page

**Files:**
- Modify: `dashboard/src/routes/overview.tsx`

- [ ] **Add workingDir card after Cache card in overview.tsx**

Add before the closing `</div>` after the Cache card (around line 329):

```tsx
      {/* Working Directory */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <FolderOpen size={18} className="text-primary" />
          <CardTitle className="text-sm font-medium">Working Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The AI can read/write/edit files inside this directory. Leave empty to use the project root.
            </p>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50 transition-colors"
                placeholder="/home/user/project"
                value={settings?.workingDir ?? ''}
                onChange={(e) => setSettings(prev => prev ? { ...prev, workingDir: e.target.value } : prev)}
              />
              <button
                className="px-3 py-2 bg-accent text-accent-foreground text-sm rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => api.updateSettings({ workingDir: settings?.workingDir ?? '' }).then(setSettings)}
              >
                Save
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
```

- [ ] **Add `FolderOpen` import**

Add `FolderOpen` to the lucide-react import at the top of overview.tsx.

---

### Task 3: Create tool definitions and execution library

**Files:**
- Create: `dashboard/server/lib/tools.ts`

- [ ] **Create tools.ts with tool definitions, execution, and security boundary**

```ts
import { readFile, writeFile, readdir, unlink, stat } from 'fs/promises'
import { join, isAbsolute, relative } from 'path'
import prisma from '../prisma/client'

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file. Returns the full file content as a string.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path (relative to working directory or absolute)' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file. Creates the file if it does not exist, overwrites if it does.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'File content' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Edit a file by finding oldString and replacing it with newString. Use for targeted edits.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          oldString: { type: 'string', description: 'Text to find in the file' },
          newString: { type: 'string', description: 'Text to replace it with' },
        },
        required: ['path', 'oldString', 'newString'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'List files and directories in a directory. Returns entries with name, type (file/dir), and size.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Directory path (default: .)' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Permanently delete a file.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path to delete' } },
        required: ['path'],
      },
    },
  },
]

async function resolvePath(input: string): Promise<string> {
  const config = await prisma.config.findUnique({ where: { id: 'main' } })
  const wd = config?.workingDir || process.cwd()
  const resolved = isAbsolute(input) ? input : join(wd, input)
  const resolvedWd = join(wd, '.')
  if (!resolved.startsWith(resolvedWd)) {
    throw new Error(`Access denied: path "${input}" is outside working directory "${wd}"`)
  }
  return resolved
}

export async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case 'read_file': {
      const path = await resolvePath(args.path)
      const content = await readFile(path, 'utf-8')
      return content
    }

    case 'write_file': {
      const path = await resolvePath(args.path)
      await writeFile(path, args.content, 'utf-8')
      return `File written: ${args.path}`
    }

    case 'edit_file': {
      const path = await resolvePath(args.path)
      const content = await readFile(path, 'utf-8')
      if (!content.includes(args.oldString)) {
        throw new Error(`Could not find "${args.oldString}" in ${args.path}`)
      }
      const updated = content.replace(args.oldString, args.newString)
      await writeFile(path, updated, 'utf-8')
      const diffLen = Math.abs(updated.length - content.length)
      return `Edited ${args.path}: replaced ${args.oldString.length} chars with ${args.newString.length} chars (net ${diffLen} chars)`
    }

    case 'list_dir': {
      const path = await resolvePath(args.path)
      const entries = await readdir(path, { withFileTypes: true })
      const items = await Promise.all(
        entries.map(async (entry) => {
          try {
            const s = await stat(join(path, entry.name))
            return { name: entry.name, type: entry.isDirectory() ? 'dir' : 'file', size: s.size }
          } catch { return { name: entry.name, type: entry.isDirectory() ? 'dir' : 'file', size: 0 } }
        })
      )
      return items.map(i => `${i.type === 'dir' ? '📁' : '📄'} ${i.name}${i.type === 'file' ? ` (${i.size} bytes)` : ''}`).join('\n')
    }

    case 'delete_file': {
      const path = await resolvePath(args.path)
      await unlink(path)
      return `Deleted: ${args.path}`
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
```

---

### Task 4: Add tool loop to `streamChat` in `ai.ts`

**Files:**
- Modify: `dashboard/server/lib/ai.ts`

- [ ] **Change `streamChat` to yield `StreamEvent` and add tool loop**

Replace the entire `streamChat` function. The new flow:
1. Build messages with system prompt
2. Make non-streaming API call with tools
3. If tool_calls → execute → loop
4. Once done → make streaming call for final text

The import needs to include `executeTool` from `./tools`.

```ts
import prisma from '../prisma/client'
import { TOOL_DEFINITIONS, executeTool } from './tools'

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

  const makeBody = (stream: boolean) => {
    const body: Record<string, unknown> = {
      model: provider.selectedModel,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...chatMsgs]
        : chatMsgs,
      stream,
      temperature: personality.temperature,
      max_tokens: personality.maxTokens,
      top_p: personality.topP,
      frequency_penalty: personality.frequencyPenalty,
    }
    return body
  }

  // Tool loop: non-streaming round(s) to resolve tool calls
  const msgs = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...chatMsgs]
    : chatMsgs

  let requiresFinalStream = true

  while (true) {
    const body = makeBody(false)
    body.messages = msgs
    body.tools = TOOL_DEFINITIONS
    body.stream = false

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST', headers, body: JSON.stringify(body),
    })
    if (!res.ok) { yield { type: 'error', error: `API Error: ${await res.text()}` }; return }

    const data = await res.json()
    const choice = data.choices?.[0]
    const msg = choice?.message

    if (msg?.tool_calls && msg.tool_calls.length > 0) {
      requiresFinalStream = false
      for (const tc of msg.tool_calls) {
        yield { type: 'tool_call', id: tc.id, tool: tc.function.name, args: safeJSONParse(tc.function.arguments) }
        try {
          const result = await executeTool(tc.function.name, safeJSONParse(tc.function.arguments))
          yield { type: 'tool_result', id: tc.id, ok: true, result }
          msgs.push({ role: 'assistant', content: null, tool_calls: [tc] })
          msgs.push({ role: 'tool', tool_call_id: tc.id, content: result })
        } catch (e: any) {
          yield { type: 'tool_result', id: tc.id, ok: false, error: e.message }
          msgs.push({ role: 'assistant', content: null, tool_calls: [tc] })
          msgs.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${e.message}` })
        }
      }
      // Continue loop to let LLM see tool results
    } else {
      // No tool calls — check for content
      if (msg?.content) {
        requiresFinalStream = true
      }
      break
    }
  }

  if (requiresFinalStream) {
    // Final streaming response
    const body = makeBody(true)
    body.messages = msgs
    body.tools = TOOL_DEFINITIONS

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST', headers, body: JSON.stringify(body),
    })
    if (!res.ok) { yield { type: 'error', error: `API Error: ${await res.text()}` }; return }
    yield* readStreamToEvents(res)
  }
}

function safeJSONParse(s: string): Record<string, any> {
  try { return JSON.parse(s) } catch { return {} }
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
```

- [ ] **Update `streamAnthropic` and `streamGemini` yield types**

These functions still yield strings but are used less often. Update them to yield `StreamEvent`:

```ts
async function* streamAnthropic(...): AsyncGenerator<StreamEvent> {
  // ... same body setup ...
  const res = await fetch(...)
  if (!res.ok) { yield { type: 'error', error: `Anthropic Error: ${await res.text()}` }; return }
  yield* readStreamToEvents(res)
}

async function* streamGemini(...): AsyncGenerator<StreamEvent> {
  // ... same body setup ...
  const res = await fetch(...)
  if (!res.ok) { yield { type: 'error', error: `Gemini Error: ${await res.text()}` }; return }
  yield* readStreamToEvents(res)
}
```

---

### Task 5: Update route handler in `chat.ts`

**Files:**
- Modify: `dashboard/server/routes/chat.ts`

- [ ] **Change streamChat iteration to handle StreamEvent types**

Replace the current SSE writing loop with one that handles `content`, `tool_call`, `tool_result`, and `error` events:

```ts
import { Router } from 'express'
import prisma from '../prisma/client'
import { streamChat } from '../lib/ai'
import { recordTokens } from './stats'
import { hashMessages, getCachedResponse, setCachedResponse } from '../lib/cache'

const router = Router()

router.post('/stream', async (req, res) => {
  let { messages, chatId } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const config = await prisma.config.findUnique({ where: { id: 'main' } })
  const cacheEnabled = config?.cacheEnabled ?? false
  const cacheTTL = config?.cacheTTL ?? 300
  const cavemanMode = config?.cavemanMode ?? false

  if (cavemanMode) {
    messages = [
      { role: 'system', content: 'You are a caveman. Speak only in short, simple caveman language. Use grunts, single words, and very basic sentences. Keep responses under 50 words. Example: "Me help you. You ask question. Me answer good."' },
      ...messages,
    ]
  }

  const cacheKey = hashMessages(messages)

  if (cacheEnabled) {
    const cached = await getCachedResponse(cacheKey)
    if (cached) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Cache', 'HIT')
      res.write(`data: ${JSON.stringify({ type: 'content', content: cached })}\n\n`)
      res.write('data: [DONE]\n\n')
      const inputTokens = Math.ceil(JSON.stringify(messages).length / 4)
      const outputTokens = Math.ceil(cached.length / 4)
      recordTokens(inputTokens, outputTokens)
      return res.end()
    }
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  if (cacheEnabled) res.setHeader('X-Cache', 'MISS')

  let fullResponse = ''

  const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop()
  const userContent = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''

  if (chatId) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } })
    if (chat && chat.title === 'New Chat' && userContent) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { title: userContent.slice(0, 80) },
      })
    }
    await prisma.message.create({
      data: { role: 'user', content: userContent, files: JSON.stringify(req.body.files || []), chatId },
    })
  }

  try {
    for await (const event of streamChat(messages)) {
      if (event.type === 'content') {
        fullResponse += event.content
        res.write(`data: ${JSON.stringify({ type: 'content', content: event.content })}\n\n`)
      } else if (event.type === 'tool_call') {
        res.write(`data: ${JSON.stringify({ type: 'tool_call', id: event.id, tool: event.tool, args: event.args })}\n\n`)
      } else if (event.type === 'tool_result') {
        res.write(`data: ${JSON.stringify({ type: 'tool_result', id: event.id, ok: event.ok, result: event.result, error: event.error })}\n\n`)
      } else if (event.type === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', error: event.error })}\n\n`)
        break
      }
    }

    const inputChars = messages.reduce((s: number, m: any) => s + (typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length), 0)
    const inputTokens = Math.ceil(inputChars / 4)
    const outputTokens = Math.ceil(fullResponse.length / 4)
    recordTokens(inputTokens, outputTokens)

    if (cacheEnabled && fullResponse) {
      const activeProvider = await prisma.provider.findFirst({ where: { isActive: true } })
      setCachedResponse(cacheKey, fullResponse, activeProvider?.selectedModel || 'unknown', cacheTTL)
    }

    if (chatId && fullResponse) {
      await prisma.message.create({
        data: { role: 'assistant', content: fullResponse, files: '[]', chatId },
      })
    }

    res.write('data: [DONE]\n\n')
  } catch (e: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`)
  } finally {
    res.end()
  }
})

export default router
```

---

### Task 6: Handle tool SSE events and render tool cards in chat

**Files:**
- Modify: `dashboard/src/routes/chat.tsx`

- [ ] **Add `ToolCallCard` component and import**

Add before the `ChatPage` function:

```tsx
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

function ToolCallCard({ tool, args, result, error, ok }: { tool: string; args: any; result?: string; error?: string; ok: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-border rounded-lg overflow-hidden my-2 bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-foreground hover:bg-muted transition-colors">
        {ok ? <CheckCircle size={13} className="text-green-500 shrink-0" /> : <XCircle size={13} className="text-red-500 shrink-0" />}
        <span className="font-medium">{tool}</span>
        <span className="text-muted-foreground truncate">{JSON.stringify(args)}</span>
        <span className="ml-auto">{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
      </button>
      {open && (
        <div className="px-3 py-2 border-t border-border">
          {ok && result && <pre className="text-xs text-foreground font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">{result}</pre>}
          {!ok && error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Update message interface**

Add `tool_call` and `tool_result` to the role types:

```ts
interface Message {
  id?: string
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result'
  content: string
  tool?: string
  args?: any
  ok?: boolean
  error?: string
  result?: string
}
```

- [ ] **Update SSE handler in `sendMessage` to handle new event types**

Replace the current SSE processing loop with one that handles `content`, `tool_call`, `tool_result`, and `error`:

```ts
const lines = buffer.split('\n')
buffer = lines.pop() ?? ''
for (const line of lines) {
  if (!line.startsWith('data: ')) continue
  const data = line.slice(6).trim()
  if (data === '[DONE]') { break }
  try {
    const json = JSON.parse(data)
    const type = json.type || (json.content ? 'content' : json.error ? 'error' : '')

    if (type === 'content') {
      setMessages(prev => {
        const c = [...prev]
        const l = c[c.length - 1]
        if (l.role === 'assistant') {
          c[c.length - 1] = { ...l, content: l.content + json.content }
        }
        return c
      })
    } else if (type === 'tool_call') {
      setMessages(prev => [...prev, { role: 'tool_call', content: '', id: json.id, tool: json.tool, args: json.args }])
    } else if (type === 'tool_result') {
      setMessages(prev => {
        const idx = prev.findLastIndex(m => m.role === 'tool_call' && m.id === json.id)
        if (idx === -1) return prev
        const c = [...prev]
        c[idx] = { ...c[idx], ok: json.ok, result: json.result, error: json.error, role: 'tool_result' }
        return c
      })
    } else if (type === 'error') {
      setError(json.error); break
    }
  } catch {}
}
```

- [ ] **Add tool call/result rendering in the message list**

Add inside the message loop, after the user message block and before the assistant message block:

```tsx
{messages.map((msg, i) => (
  <div key={i} className={...}>
    {/* user message */}
    {msg.role === 'user' && (
      <div className="max-w-[80%]">
        <div className="bg-accent text-white rounded-2xl rounded-tr-md px-4 py-2.5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    )}

    {/* tool call/result card */}
    {(msg.role === 'tool_call' || msg.role === 'tool_result') && (
      <div className="max-w-full w-full">
        <ToolCallCard
          tool={msg.tool || ''}
          args={msg.args}
          result={msg.result}
          error={msg.error}
          ok={msg.ok ?? false}
        />
      </div>
    )}

    {/* assistant message */}
    {msg.role === 'assistant' && (...existing...)}
  </div>
))}
```

---

### Task 7: Push DB schema and test

- [ ] **Run prisma db push**

```bash
cd dashboard && npx prisma db push --schema=server/prisma/schema.prisma
```

- [ ] **Start server and test**

```bash
cd dashboard && npm run dev
```

- [ ] **Test manually:**
  1. Open OpenAsk in browser
  2. Go to Overview → set Working Directory to a test project folder
  3. Go to Chat → ask AI to "read the files in this directory and tell me what this project does"
  4. Verify tool call cards appear in the chat
  5. Verify AI can read/write/edit files correctly
  6. Check that streaming text works after tool calls
