import { Router } from 'express'
import prisma from '../prisma/client'
import { authMiddleware } from '../lib/auth-middleware'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const chats = await prisma.chat.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  })
  res.json(chats)
})

router.post('/', async (req, res) => {
  const { title } = req.body
  const chat = await prisma.chat.create({
    data: { title: title || 'New Chat' },
  })
  res.json(chat)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { title } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  const chat = await prisma.chat.update({ where: { id }, data: { title } })
  res.json(chat)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  await prisma.chat.delete({ where: { id } })
  res.json({ ok: true })
})

router.get('/:id/messages', async (req, res) => {
  const { id } = req.params
  const messages = await prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: 'asc' },
  })
  res.json(messages)
})

export default router
