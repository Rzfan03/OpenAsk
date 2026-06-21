# File System Tools for OpenAsk

Give the AI the ability to read, write, edit, list, and delete files in a designated project directory — turning the chat into a coding assistant.

## Architecture

```
Client → POST /api/chat/stream
  → Server calls LLM with messages + tool definitions
  → LLM responds with tool_call(s)?
    → Execute tool (read/write/edit/list/delete)
    → Send result back to LLM
    → Loop until LLM responds with text
  → LLM responds with text
    → Stream text to client via SSE
```

## Tool Definitions

Sent to the LLM as the OpenAI `tools` parameter. Only OpenAI-compatible providers supported initially (OpenRouter, direct OpenAI, etc.). Anthropic/Google native APIs can be added later.

| Tool | Parameters | Returns |
|------|-----------|---------|
| `read_file` | `path: string` | Full file content |
| `write_file` | `path: string, content: string` | Confirmation |
| `edit_file` | `path: string, oldString: string, newString: string` | Diff summary |
| `list_dir` | `path: string` | List of entries with type |
| `delete_file` | `path: string` | Confirmation |

## Tool Loop

The tool loop runs **before** the streaming text response. All tool calls are resolved synchronously (non-streaming API calls to the LLM), then the final text response is streamed.

```
1. Call LLM with messages + tools (stream: false)
2. If response has tool_calls:
   a. For each tool_call → yield tool_call event to client via SSE
   b. Execute tool → yield tool_result event
   c. Append tool result as "tool" role message
   d. Call LLM again (loop back to 2)
3. If no tool_calls but response has content:
   a. Call LLM with stream: true to get streaming response
   b. Yield content events
4. Yield [DONE]
```

## SSE Event Types

Each SSE event is a JSON object with a `type` field:

```
data: {"type":"tool_call","id":"call_xxx","tool":"read_file","args":{"path":"foo.py"}}
data: {"type":"tool_result","id":"call_xxx","ok":true,"result":"file content..."}
data: {"type":"tool_result","id":"call_xxx","ok":false,"error":"File not found"}
data: {"type":"content","content":"text chunk"}
data: {"type":"error","error":"message"}
data: [DONE]
```

## Frontend — Tool Call Display

Tool calls and results render as collapsible cards in the chat, NOT inside the text bubble. They appear between user message and AI response.

```
┌─ User Message ─────────────────────┐
│ Bikin file foo.py                  │
└────────────────────────────────────┘

┌── Tool Call ────────────────────┐
│ 🔧 read_file("foo.py")         │
│ ┌─ Result ──────────────────┐  │
│ │ File not found            │  │
│ └───────────────────────────┘  │
└────────────────────────────────┘

┌── Tool Call ────────────────────┐
│ ✏️ write_file("foo.py")        │
│ ┌─ Result ──────────────────┐  │
│ │ File written              │  │
│ └───────────────────────────┘  │
└────────────────────────────────┘

┌─ AI Response ─────────────────────┐
│ Selesai! File foo.py sudah dibuat.│
└────────────────────────────────────┘
```

Each tool call card:
- Header: icon + tool name + args (truncated)
- Body: result content (or error), collapsible
- Sequential tool calls from the same turn stack vertically

## Security Boundary

All file operations check that the resolved path is within `workingDir`. Absolute paths outside `workingDir` are rejected. Symlinks are not followed outside the boundary.

## Working Directory Configuration

New field `workingDir` added to the `Config` model and Settings API. Defaults to `""` (OpenAsk project root). Can be changed in Settings → a new input field.

## Changes

### Database
- Add `workingDir` column to `Config` model (default `""`)

### New file: `server/lib/tools.ts`
- Tool definitions array (for LLM tool calling)
- `executeTool(tool, args)` — dispatches to the right handler
- `readFile`, `writeFile`, `editFile`, `listDir`, `deleteFile` implementations
- Path resolution and boundary checking

### Modified: `server/lib/ai.ts`
- `streamChat` → change return type to `AsyncGenerator<StreamEvent>` (structured events)
- Add tool loop logic (non-streaming LLM calls → tool execution → final streaming)
- Pass tool definitions on the first LLM call
- Handle `tool_calls` in LLM response

### Modified: `server/routes/chat.ts`
- Handle new event type `StreamEvent` instead of plain strings
- Route `tool_call`, `tool_result`, `content`, `error` events to appropriate SSE format

### Modified: `server/routes/config.ts` + `api.ts`
- Add `workingDir` to GET/PUT settings

### Modified: `dashboard/src/lib/api.ts`
- Add `workingDir` to `Settings` type

### Modified: `dashboard/src/routes/chat.tsx`
- Handle `tool_call` and `tool_result` SSE events
- Render tool call cards in the message list

### Not changed
- All existing UI (TopBar, sidebar, dashboard layout, providers, personality, overview)
- Auth system
- Existing chat message display

## Files Not Changed (Freeze)

- `dashboard/src/routes/dashboard-layout.tsx`
- `dashboard/src/routes/overview.tsx`
- `dashboard/src/routes/tunnel.tsx`
- `dashboard/src/components/chat-sidebar.tsx`
- `dashboard/src/styles/globals.css`
- `dashboard/server/index.ts`
