import { Router } from 'express'
import { authMiddleware } from '../lib/auth-middleware'

const SERVER_START = Date.now()

let totalTokensIn = 0
let totalTokensOut = 0
const minBuckets: { time: number; in: number; out: number }[] = []

export function recordTokens(inTokens: number, outTokens: number) {
  totalTokensIn += inTokens
  totalTokensOut += outTokens
  const now = Date.now()
  const bucket = minBuckets.find(b => now - b.time < 60000)
  if (bucket) { bucket.in += inTokens; bucket.out += outTokens }
  else minBuckets.push({ time: now, in: inTokens, out: outTokens })
}

setInterval(() => {
  const cutoff = Date.now() - 3600000
  for (let i = minBuckets.length - 1; i >= 0; i--) {
    if (minBuckets[i].time < cutoff) minBuckets.splice(i, 1)
  }
}, 60000)

const router = Router()
router.use(authMiddleware)

router.get('/tokens', (_req, res) => {
  const hourlyTotal = minBuckets.reduce((a, b) => ({ in: a.in + b.in, out: a.out + b.out }), { in: 0, out: 0 })
  res.json({ totalTokensIn, totalTokensOut, hourly: hourlyTotal })
})

router.get('/token-history', (_req, res) => {
  res.json(minBuckets.slice(-30))
})

router.get('/uptime', (_req, res) => {
  res.json({ start: SERVER_START, uptime: Date.now() - SERVER_START })
})

export default router
