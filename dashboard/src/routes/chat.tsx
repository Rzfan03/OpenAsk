import { useState, useRef, useEffect } from 'react'
import { Paperclip, ArrowUp, Loader2, X, Bot, LogOut, LayoutDashboard, Brain, ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import ChatSidebar from '@/components/chat-sidebar'
import Markdown from '@/components/markdown'
import { useTheme } from '@/lib/theme-context'
import { api } from '@/lib/api'

interface Message {
  id?: string
  role: 'user' | 'assistant' | 'tool_call'
  content: string
  tool?: string
  args?: Record<string, any>
  status?: 'pending' | 'success' | 'error'
  ok?: boolean
  result?: string
  error?: string
  file?: { name: string; type: string; base64: string }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ToolCallCard({ tool, args, status, result, error: err }: {
  tool: string
  args: Record<string, any>
  status: 'pending' | 'success' | 'error'
  result?: string
  error?: string
}) {
  const [expanded, setExpanded] = useState(status === 'error')

  useEffect(() => {
    if (status === 'error') setExpanded(true)
  }, [status])

  const argsStr = Object.values(args).join(', ')
  const icon = status === 'pending' ? <Loader2 size={14} className="animate-spin" />
    : status === 'success' ? <CheckCircle size={14} className="text-green-500" />
    : <XCircle size={14} className="text-red-500" />

  return (
    <div className="w-full max-w-xl mx-auto">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs text-muted-foreground hover:bg-muted transition-colors text-left"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="font-mono font-medium text-foreground">{tool}</span>
        <span className="truncate text-muted-foreground">{argsStr}</span>
        <span className="ml-auto shrink-0">{icon}</span>
      </button>
      {expanded && (result || err) && (
        <div className="mt-1 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
          {err ? (
            <span className="text-red-500">{err}</span>
          ) : (
            <span className="text-foreground">{result}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const { avatarUrl } = useTheme()
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const streamingRef = useRef(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function autoResize() {
    const el = inputRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px' }
  }

  async function loadChat(id: string) {
    setChatId(id); setMessages([]); setError('')
    try {
      const res = await fetch('/api/chats/' + id + '/messages', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
      })
      setMessages((await res.json()).map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
    } catch {}
  }

  function handleNewChat() { setChatId(null); setMessages([]); setError(''); setInput(''); setSidebar(false) }

  async function sendMessage() {
    if ((!input.trim() && !file) || streamingRef.current) return
    setError(''); setStreaming(true); streamingRef.current = true

    const userContent = input.trim() || (file ? '[File: ' + file.name + ']' : '')

    let fileData: { name: string; type: string; base64: string } | undefined
    if (file) {
      const b64 = await toBase64(file)
      fileData = { name: file.name, type: file.type, base64: b64 }
    }

    setFile(null); if (fileRef.current) fileRef.current.value = ''

    const userMsg: Message = { role: 'user', content: userContent }
    if (fileData) userMsg.file = fileData
    setMessages(prev => [...prev, userMsg])
    setInput('')

    let currentChatId = chatId
    if (!currentChatId) {
      try {
        const chat = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
          body: JSON.stringify({ title: 'New Chat' }),
        }).then(r => r.json())
        currentChatId = chat.id; setChatId(chat.id)
      } catch (e: any) { setError(e.message); setStreaming(false); streamingRef.current = false; return }
    }

    try {
      const apiMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userContent, ...(fileData ? { file: fileData } : {}) },
      ]
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: currentChatId, messages: apiMessages }),
      })
      if (!res.ok) throw new Error(await res.text())

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { break }
          try {
            const json = JSON.parse(data)
            if (json.type === 'error') { setError(json.error); break }
            if (json.type === 'content') {
              setMessages(prev => {
                const c = [...prev]
                const last = c[c.length - 1]
                if (last?.role === 'assistant') {
                  c[c.length - 1] = { ...last, content: last.content + json.content }
                } else {
                  c.push({ role: 'assistant', content: json.content })
                }
                return c
              })
            } else if (json.type === 'tool_call') {
              setMessages(prev => [...prev, { role: 'tool_call', id: json.id, tool: json.tool, args: json.args, content: '', status: 'pending' }])
            } else if (json.type === 'tool_result') {
              setMessages(prev => {
                const c = [...prev]
                let idx = -1
                for (let j = c.length - 1; j >= 0; j--) {
                  if (c[j].role === 'tool_call' && c[j].id === json.id) { idx = j; break }
                }
                if (idx >= 0) {
                  c[idx] = { ...c[idx], ok: json.ok, result: json.result, error: json.error, status: json.ok ? 'success' : 'error' }
                }
                return c
              })
            }
          } catch {}
        }
      }
    } catch (e: any) { setError(e.message) }
    finally { setStreaming(false); streamingRef.current = false }
  }

  async function handleLogout() {
    try { await api.logout() } catch {}
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div className="h-dvh flex bg-background">
      <ChatSidebar
        visible={sidebar}
        onClose={() => setSidebar(false)}
        activeChatId={chatId}
        onSelectChat={(id) => { loadChat(id); setSidebar(false) }}
        onNewChat={handleNewChat}
        onChatsChange={() => {}}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <header className="h-12 flex items-center justify-between px-4 shrink-0 border-b border-border bg-background">
          <button onClick={() => setSidebar(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="text-sm font-semibold text-foreground hidden sm:inline">OpenAsk</span>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdown(!dropdown)} className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-border hover:ring-2 hover:ring-accent/40 transition-all">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-foreground bg-muted w-full h-full flex items-center justify-center">O</span>
              )}
            </button>
            {dropdown && (
              <div className="absolute right-0 top-10 w-56 bg-card border border-border rounded-xl shadow-xl py-1.5 z-50">
                <button onClick={() => { setDropdown(false); navigate('/') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <LayoutDashboard size={15} className="text-muted-foreground" /> Dashboard
                </button>
                <button onClick={() => { setDropdown(false); navigate('/personality') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <Brain size={15} className="text-muted-foreground" /> Personality
                </button>
                <div className="h-px bg-border my-1.5" />
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {messages.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Bot size={22} className="text-muted-foreground" />
                </div>
                <h1 className="text-lg font-semibold text-foreground mb-1">What can I help you with?</h1>
                <p className="text-sm text-muted-foreground">Ask a question or start a conversation</p>
              </div>
            )}

            {messages.map((msg, i) => (
              msg.role === 'tool_call' ? (
                <div key={i} className="flex justify-center">
                  <ToolCallCard tool={msg.tool!} args={msg.args || {}} status={msg.status || 'pending'} result={msg.result} error={msg.error} />
                </div>
              ) : (
                <div key={i} className={'flex items-start gap-3 ' + (msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={13} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className={'max-w-[80%] ' + (msg.role === 'user' ? '' : '')}>
                    {msg.role === 'user' ? (
                      <div className="bg-accent text-white rounded-2xl rounded-tr-md px-4 py-2.5">
                        {msg.file?.type.startsWith('image/') && msg.file?.base64 && (
                          <img src={`data:${msg.file.type};base64,${msg.file.base64}`} alt="" className="max-w-[200px] rounded-lg mb-2" />
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : msg.content ? (
                      <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-2.5">
                        <Markdown content={msg.content} />
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            ))}
            {streaming && messages.length > 0 && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-start gap-3 flex-row">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={13} className="text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay: '0ms'}} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay: '150ms'}} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay: '300ms'}} />
                  </span>
                </div>
              </div>
            )}

            {error && <div className="bg-destructive/10 text-destructive text-sm rounded-xl p-4 border border-destructive/20">{error}</div>}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <div className="max-w-3xl mx-auto">
            {file && (
              <div className="mb-2 flex items-start gap-2 text-xs text-muted-foreground bg-card p-2 rounded-lg w-fit border border-border max-w-xs">
                {file.type.startsWith('image/') && (
                  <img src={URL.createObjectURL(file)} alt="" className="w-16 h-16 object-cover rounded shrink-0" />
                )}
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip size={11} className="shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <button className="shrink-0 hover:text-destructive" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}><X size={11} /></button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2 bg-card rounded-2xl border border-border px-4 py-3 focus-within:border-accent/50 transition-colors">
              <button className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors -ml-1" onClick={() => fileRef.current?.click()}>
                <Paperclip size={16} />
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf,.txt,.doc,.docx" />
              <textarea ref={inputRef}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-sm py-0.5 max-h-36 text-foreground placeholder:text-muted-foreground"
                placeholder="Type a message..."
                value={input}
                onChange={e => { setInput(e.target.value); autoResize() }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                disabled={streaming}
                rows={1}
              />
              <button className="shrink-0 w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                onClick={sendMessage} disabled={streaming || (!input.trim() && !file)}
              >
                {streaming ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
