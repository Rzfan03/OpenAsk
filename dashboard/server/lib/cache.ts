import prisma from '../prisma/client'
import crypto from 'crypto'

export function hashMessages(messages: any[]): string {
  const str = JSON.stringify(messages)
  return crypto.createHash('sha256').update(str).digest('hex')
}

export async function getCachedResponse(hash: string): Promise<string | null> {
  const cached = await prisma.cache.findUnique({ where: { id: hash } })
  if (!cached) return null
  if (Date.now() > cached.expiresAt.getTime()) {
    await prisma.cache.delete({ where: { id: hash } })
    return null
  }
  return cached.response
}

export async function setCachedResponse(hash: string, response: string, model: string, ttl: number) {
  const expiresAt = new Date(Date.now() + ttl * 1000)
  await prisma.cache.upsert({
    where: { id: hash },
    update: { response, model, expiresAt },
    create: { id: hash, response, model, expiresAt },
  })
}
