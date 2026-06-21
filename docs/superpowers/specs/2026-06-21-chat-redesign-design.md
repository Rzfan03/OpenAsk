# Chat Page Redesign — Design Spec

## Overview
Redesign the `/chat` page with a Claude-inspired interface: sidebar drawer for history, full-width conversation area, theme switching (dark/light + accent color), user avatar with dashboard shortcuts, and cross-platform responsive layout.

## Layout

```
┌──────────────────────────────────────────┐
│ [☰]  OpenAsk                    [👤]     │  ← Top bar (48px)
├──────────────────────────────────────────┤
│                                          │
│               Chat Messages              │  ← Scrollable, full-width
│           (user right, AI left)          │
│                                          │
│                                          │
├──────────────────────────────────────────┤
│ [📎]  Type a message...           [➤]    │  ← Input bar (64px)
└──────────────────────────────────────────┘
```

### Sidebar (drawer, toggled by ☰)
```
┌─ sidebar (320px) ───────────────────────┐
│  New Chat  [button]              [🗕]    │
│──────────────────────────────────────────│
│  🔍 Search conversations...              │
│──────────────────────────────────────────│
│  💬 Chat title                    ⋮      │
│  💬 Another chat                  ⋮      │
│  💬 Yesterday's chat              ⋮      │
│──────────────────────────────────────────│
│  Dark/Light toggle                      │
│  Accent: ● ● ● (indigo, red, green)     │
└──────────────────────────────────────────┘
```

## Components

### 1. TopBar
- Fixed top, height 48px
- Left: hamburger (☰) button → toggle sidebar
- Center: "OpenAsk" brand name
- Right: avatar circle (image or initials fallback, configurable from Dashboard page)
- Avatar click → dropdown menu:
  - "Dashboard" → `/`
  - "Personality" → `/personality`
  - Divider
  - Theme presets (dark/light/accent)
  - Divider  
  - "Logout" → clear token → redirect `/login`

### 2. ChatSidebar (drawer)
- Width: 320px desktop, 100% mobile
- Overlay with semi-transparent backdrop
- Header: "New Chat" button + close (✕) button
- Search input to filter conversations
- Conversation list: each item has:
  - Chat title (first message excerpt)
  - Timestamp (relative: "2m ago", "5h ago", "Yesterday")
  - ⋮ menu → "Rename" modal | "Delete" confirmation
- Active chat highlighted with accent color
- Scrollable list area
- Bottom: theme controls (dark/light toggle + accent color dots)

### 3. ChatMessages
- Messages area: scrollable, flex-grow, fills remaining space
- **User messages**: right-aligned, bubble with accent color background, white text, no avatar
- **AI messages**: left-aligned, bubble with bg-muted background, AI avatar (small, 28px) on the left side
- Message content rendered as Markdown (headers, code blocks, lists, links, bold/italic)
- Code blocks: syntax-highlighted with dark background, copy button on hover
- Streaming indicator: animated cursor/pulse at end of streaming message
- Smooth scroll to bottom on new messages
- Empty state: centered prompt with suggestions

### 4. InputBar
- Fixed bottom, height ~64px (or auto-grow)
- Left: paperclip/file attach button → opens file picker
  - Files shown as small chips above input
  - Chips removable with ✕
  - Supported: images (rendered inline), .txt, .pdf, .docx, .doc
- Center: text input (auto-grow height, single-line → multi-line)
- Right: send button (arrow icon, primary color)
  - Disabled when empty + no file
  - Shows spinner icon when streaming

### 5. MessageContent (Markdown renderer)
- Use `react-markdown` with `remark-gfm` for rendering
- Components:
  - `code` / `pre`: syntax-highlighted block, copy button
  - `p`, `h1-h6`, `ul`, `ol`, `blockquote`: standard markdown styling
  - `a`: styled with primary color, open in new tab
  - `img`: rendered inline, max-width 100%
  - Tables: full-width, bordered
- Streaming: render progressively as content arrives

## Theme System

### CSS Variables
```css
:root {
  --accent: 99 102 241;        /* indigo-500 (HSL) */
  --accent-hover: 79 70 229;   /* indigo-600 */
  --accent-light: 224 231 255; /* indigo-100 */
}
[data-accent="red"] {
  --accent: 255 69 58;
  --accent-hover: 230 50 40;
}
[data-accent="green"] {
  --accent: 50 215 75;
  --accent-hover: 40 190 65;
}
```

- Dark/light: use Tailwind `dark` class on `<html>`
- Accent: `data-accent` attribute on `<html>`
- Theme preference stored in `localStorage` + synced to backend Settings
- Sidebar & dropdown show theme controls

## Responsive Breakpoints

| Breakpoint | Sidebar behavior | Layout |
|---|---|---|
| ≥1024px | Drawer overlay | Full-width chat |
| 768-1023px | Drawer overlay, thinner | Full-width chat |
| <768px | Drawer full-width | Full-width chat, smaller bubbles/input |

## Data Model (Prisma additions)

### Chat
```
model Chat {
  id        String    @id @default(cuid())
  title     String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}
```

### Message
```
model Message {
  id        String   @id @default(cuid())
  role      String   // "user" | "assistant"
  content   String
  files     String   // JSON array of {name, type, base64}
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

### Config additions
```
avatarUrl     String  @default("")
themeMode     String  @default("dark")    // "dark" | "light"  
themeAccent   String  @default("indigo")   // "indigo" | "red" | "green"
```

## API Routes

- `GET /api/chats` — list all chats (id, title, updatedAt)
- `POST /api/chats` — create new chat
- `PUT /api/chats/:id` — rename chat
- `DELETE /api/chats/:id` — delete chat + messages (cascade)
- `GET /api/chats/:id/messages` — get messages for a chat
- `POST /api/chat/stream` — modified: accepts `chatId` to store messages

## Implementation Order

1. Prisma schema (Chat, Message models + Config fields)
2. Chat CRUD API routes
3. Theme system (CSS vars, context, localStorage)
4. TopBar + Avatar + Dropdown
5. ChatSidebar (history, search, rename, delete)
6. Messages area with Markdown rendering
7. Input bar (file attach, auto-grow)
8. Modified streaming endpoint (save to DB)
9. Responsive polish
