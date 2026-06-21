import { readFile, writeFile, readdir, unlink, stat } from 'fs/promises'
import { join, isAbsolute } from 'path'
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
        properties: { path: { type: 'string', description: 'Directory path' } },
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
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for current information. Use this when you need recent news, facts, or any information that might be beyond your knowledge cutoff.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The search query' } },
        required: ['query'],
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
      return await readFile(path, 'utf-8')
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
      return `Edited ${args.path}: replaced ${args.oldString.length} chars with ${args.newString.length} chars`
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
      return items.map(i => `${i.type === 'dir' ? '[DIR]' : '[FILE]'} ${i.name}${i.type === 'file' ? ` (${i.size} bytes)` : ''}`).join('\n')
    }

    case 'delete_file': {
      const path = await resolvePath(args.path)
      await unlink(path)
      return `Deleted: ${args.path}`
    }

    case 'web_search':
      return await webSearch(args.query)

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

async function webSearch(query: string): Promise<string> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OpenAsk/1.0' },
  })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)

  const data = await res.json()
  const parts: string[] = []

  if (data.AbstractText) {
    parts.push(`**${data.Heading || query}**`)
    parts.push(data.AbstractText)
    if (data.AbstractURL) parts.push(`Source: ${data.AbstractURL}`)
  }

  if (data.RelatedTopics?.length) {
    const results = data.RelatedTopics.slice(0, 8).flatMap((t: any) =>
      t.Topics ? t.Topics.slice(0, 3) : [t]
    )
    if (results.length) {
      if (parts.length) parts.push('')
      parts.push('**Search Results:**')
      for (const r of results.slice(0, 8)) {
        parts.push(`- ${r.Text}${r.FirstURL ? ` (${r.FirstURL})` : ''}`)
      }
    }
  }

  return parts.length > 0 ? parts.join('\n') : 'No results found. Try a different query.'
}
