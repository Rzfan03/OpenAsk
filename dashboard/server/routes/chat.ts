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
    const fileMeta = lastUserMsg?.file ? [{ name: lastUserMsg.file.name, type: lastUserMsg.file.type }] : (req.body.files || [])
    await prisma.message.create({
      data: { role: 'user', content: userContent, files: JSON.stringify(fileMeta), chatId },
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
