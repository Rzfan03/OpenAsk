import { Router } from 'express'
import { compareSync, hashSync } from 'bcryptjs'
import prisma from '../prisma/client'
import { createToken, removeToken, authMiddleware } from '../lib/auth-middleware'

const router = Router()

router.post('/login', async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password required' })

  const config = await prisma.config.findUnique({ where: { id: 'main' } })
  if (!config || !compareSync(password, config.password)) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const token = await createToken()
  res.json({ token })
})

router.post('/logout', authMiddleware, async (_req, res) => {
  const header = _req.headers.authorization!
  const token = header.slice(7)
  await removeToken(token)
  res.json({ ok: true })
})

router.put('/password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'oldPassword and newPassword required' })
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters' })
  }

  const config = await prisma.config.findUnique({ where: { id: 'main' } })
  if (!config || !compareSync(oldPassword, config.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  await prisma.config.update({
    where: { id: 'main' },
    data: { password: hashSync(newPassword, 10) },
  })

  res.json({ ok: true })
})

export default router
