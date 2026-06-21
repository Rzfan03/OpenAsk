import { Router } from 'express'
import { authMiddleware } from '../lib/auth-middleware'
import { getTunnelStatus, getTunnelUrl, startTunnel, stopTunnel } from '../lib/tunnel'
import prisma from '../prisma/client'

const router = Router()
router.use(authMiddleware)

router.get('/status', async (_req, res) => {
  const status = getTunnelStatus()
  const url = await getTunnelUrl()
  res.json({ ...status, url })
})

router.post('/start', async (_req, res) => {
  try {
    const config = await prisma.config.findUnique({ where: { id: 'main' } })
    const port = config?.tunnelPort ?? 20128
    const url = await startTunnel(port)
    res.json({ running: true, url })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/stop', (_req, res) => {
  stopTunnel()
  res.json({ running: false, url: '' })
})

export default router
