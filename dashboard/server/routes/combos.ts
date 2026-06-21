import { Router } from 'express'
import prisma from '../prisma/client'
import { authMiddleware } from '../lib/auth-middleware'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const combos = await prisma.combo.findMany({
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { name: 'asc' },
  })
  res.json(combos)
})

router.post('/', async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()
  const combo = await prisma.combo.create({
    data: { id, name },
    include: { items: true },
  })
  res.json(combo)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const combo = await prisma.combo.update({
    where: { id },
    data: { name },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  res.json(combo)
})

router.delete('/:id', async (req, res) => {
  await prisma.combo.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

router.post('/:id/items', async (req, res) => {
  const { id } = req.params
  const { model } = req.body
  if (!model) return res.status(400).json({ error: 'Model is required' })
  const count = await prisma.comboItem.count({ where: { comboId: id } })
  const item = await prisma.comboItem.create({
    data: { model, comboId: id, order: count },
  })
  const combo = await prisma.combo.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  res.json(combo)
})

router.delete('/:id/items/:itemId', async (req, res) => {
  await prisma.comboItem.delete({ where: { id: req.params.itemId } })
  const combo = await prisma.combo.findUnique({
    where: { id: req.params.id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  res.json(combo)
})

router.put('/:id/items/:itemId', async (req, res) => {
  const { model } = req.body
  await prisma.comboItem.update({
    where: { id: req.params.itemId },
    data: { model },
  })
  const combo = await prisma.combo.findUnique({
    where: { id: req.params.id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  res.json(combo)
})

router.put('/:id/items/reorder', async (req, res) => {
  const { items } = req.body
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' })
  for (let i = 0; i < items.length; i++) {
    await prisma.comboItem.update({
      where: { id: items[i] },
      data: { order: i },
    })
  }
  const combo = await prisma.combo.findUnique({
    where: { id: req.params.id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  res.json(combo)
})

export default router
