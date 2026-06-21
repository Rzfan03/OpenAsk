import { useMemo, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

function processCodeBlocks(text: string): Array<{ type: 'text' | 'code'; content: string; language?: string }> {
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = []
  const re = /```(\w*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code', language: match[1] || undefined, content: match[2] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return parts
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /(`[^`]+`)|(\*\*|__)(.+?)\2|(\*|_)(.+?)\4|\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let idx = 0

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={'t-' + idx++}>{text.slice(lastIndex, match.index)}</span>)
    }
    if (match[1]) {
      parts.push(<code key={'c-' + idx++} className="bg-muted-foreground/10 px-1 rounded text-xs font-mono">{match[1].slice(1, -1)}</code>)
    } else if (match[2]) {
      parts.push(<strong key={'b-' + idx++}>{match[3]}</strong>)
    } else if (match[4]) {
      parts.push(<em key={'em-' + idx++}>{match[5]}</em>)
    } else if (match[6]) {
      parts.push(<a key={'a-' + idx++} href={match[7]} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{match[6]}</a>)
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(<span key={'t-' + idx++}>{text.slice(lastIndex)}</span>)
  }
  return parts
}

function renderText(text: string): ReactNode[] {
  const lines = text.split('\n')
  const elements: ReactNode[] = []
  let inList = false
  let listItems: ReactNode[] = []

  function flushList() {
    if (inList) {
      elements.push(<ul key={'ul-' + elements.length} className="space-y-0.5 my-1.5">{listItems}</ul>)
      listItems = []
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { flushList(); continue }

    const ulMatch = trimmed.match(/^[\s]*[-*+]\s+(.+)/)
    if (ulMatch) {
      inList = true
      listItems.push(<li key={'li-' + i} className="text-sm text-foreground ml-4 list-disc">{renderInline(ulMatch[1])}</li>)
      continue
    }

    flushList()

    const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const content = renderInline(headerMatch[2])
      if (level === 1) elements.push(<h1 key={'h-' + i} className="text-sm font-semibold mt-3 mb-1">{content}</h1>)
      else if (level === 2) elements.push(<h2 key={'h-' + i} className="text-sm font-semibold mt-3 mb-1">{content}</h2>)
      else elements.push(<h3 key={'h-' + i} className="text-sm font-semibold mt-3 mb-1">{content}</h3>)
      continue
    }

    const hrMatch = trimmed.match(/^---+/)
    if (hrMatch) {
      elements.push(<hr key={'hr-' + i} className="border-border my-2" />)
      continue
    }

    const quoteMatch = trimmed.match(/^>\s+(.+)/)
    if (quoteMatch) {
      elements.push(<blockquote key={'q-' + i} className="border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground italic my-1">{renderInline(quoteMatch[1])}</blockquote>)
      continue
    }

    elements.push(<p key={'p-' + i} className="text-sm leading-relaxed">{renderInline(line)}</p>)
  }
  flushList()

  return elements
}

export default function Markdown({ content }: { content: string }) {
  const parts = useMemo(() => processCodeBlocks(content), [content])

  return (
    <div className="space-y-0.5">
      {parts.map((part, i) =>
        part.type === 'code' ? (
          <CodeBlock key={i} language={part.language} code={part.content} />
        ) : (
          <div key={i}>{renderText(part.content)}</div>
        )
      )}
    </div>
  )
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-border bg-[#1e1e2e] overflow-hidden my-2">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#2a2a3e]">
        <span className="text-[11px] text-muted-foreground font-mono">{language || 'code'}</span>
        <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto"><code className="text-sm font-mono leading-relaxed text-gray-200">{code}</code></pre>
    </div>
  )
}
