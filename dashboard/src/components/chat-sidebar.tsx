import { useState, useEffect, useRef } from 'react'
import { Plus, Search, X, Trash2, Edit3 } from 'lucide-react'
import { api } from '@/lib/api'

interface ChatSummary {
  id: string
  title: string
  updatedAt: string
}

interface Props {
  visible: boolean
  onClose: () => void
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onChatsChange: () => void
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return days + 'd ago'
  return new Date(date).toLocaleDateString()
}

export default function ChatSidebar({ visible, onClose, activeChatId, onSelectChat, onNewChat, onChatsChange }: Props) {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [search, setSearch] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { api.getChats().then(setChats).catch(() => {}) }, [visible])

  function refreshChats() { api.getChats().then(setChats).catch(() => {}); onChatsChange() }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    await api.deleteChat(id); refreshChats()
    if (activeChatId === id) onNewChat()
  }

  function startRename(e: React.MouseEvent, id: string, title: string) {
    e.stopPropagation(); setRenamingId(id); setRenameValue(title)
    setTimeout(() => renameRef.current?.focus(), 50)
  }

  async function finishRename(id: string) {
    if (renameValue.trim()) { await api.renameChat(id, renameValue.trim()); refreshChats() }
    setRenamingId(null)
  }

  const filtered = search ? chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase())) : chats

  return (
    <>
      {visible && <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />}
      <aside className={'fixed left-0 top-0 h-full w-[320px] bg-background border-r border-border z-40 flex flex-col transition-transform duration-200 ' + (visible ? 'translate-x-0' : '-translate-x-full')}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <button onClick={() => { onNewChat(); onClose() }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors">
            <Plus size={16} className="text-muted-foreground" /><span>New chat</span>
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full rounded-lg bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-border" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.map(chat => (
            <div key={chat.id}
              className={'group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ' + (chat.id === activeChatId ? 'bg-card text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
              onClick={() => onSelectChat(chat.id)}
            >
              {renamingId === chat.id ? (
                <input ref={renameRef}
                  className="flex-1 bg-transparent border-b border-accent outline-none text-sm text-foreground"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') finishRename(chat.id); if (e.key === 'Escape') setRenamingId(null) }}
                  onBlur={() => finishRename(chat.id)}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="truncate">{chat.title}</p>
                  <p className="text-[11px] text-muted-foreground/60">{relativeTime(chat.updatedAt)}</p>
                </div>
              )}
              {renamingId !== chat.id && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-border text-muted-foreground" onClick={e => startRename(e, chat.id, chat.title)}><Edit3 size={11} /></button>
                  <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={e => handleDelete(e, chat.id)}><Trash2 size={11} /></button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">{search ? 'No results' : 'No conversations'}</p>
          )}
        </div>


      </aside>
    </>
  )
}
