import { Router } from 'express'
import prisma from '../prisma/client'
import { authMiddleware } from '../lib/auth-middleware'

const router = Router()

// Settings GET is public (safe: theme/avatar/cache prefs only)
router.get('/settings', async (_req, res) => {
  const config = await prisma.config.findUnique({ where: { id: 'main' } })
  res.json({
    cavemanMode: config?.cavemanMode ?? false,
    cacheEnabled: config?.cacheEnabled ?? false,
    cacheTTL: config?.cacheTTL ?? 300,
    avatarUrl: config?.avatarUrl ?? '',
    themeMode: config?.themeMode ?? 'dark',
    themeAccent: config?.themeAccent ?? 'indigo',
    workingDir: config?.workingDir ?? '',
  })
})

router.use(authMiddleware)

router.get('/providers', async (_req, res) => {
  const providers = await prisma.provider.findMany()
  res.json(providers)
})

router.post('/providers', async (req, res) => {
  const { id, name, baseUrl, apiKey, selectedModel, isActive } = req.body
  if (!id || !name || !baseUrl) {
    return res.status(400).json({ error: 'id, name, and baseUrl required' })
  }

  const existing = await prisma.provider.findUnique({ where: { id } })
  if (existing) {
    return res.status(409).json({ error: 'Provider with this ID already exists' })
  }

  const provider = await prisma.provider.create({
    data: {
      id,
      name,
      baseUrl,
      apiKey: apiKey || '',
      selectedModel: selectedModel || '',
      isActive: isActive ?? false,
    },
  })
  if (isActive) {
    await prisma.provider.updateMany({ where: { isActive: true, id: { not: provider.id } }, data: { isActive: false } })
  }
  res.json(provider)
})

router.put('/providers/:id', async (req, res) => {
  const { id } = req.params
  const { apiKey, selectedModel, isActive } = req.body

  const data: Record<string, unknown> = {}
  if (apiKey !== undefined) data.apiKey = apiKey
  if (selectedModel !== undefined) data.selectedModel = selectedModel
  if (isActive !== undefined) {
    if (isActive) {
      await prisma.provider.updateMany({ where: { isActive: true }, data: { isActive: false } })
    }
    data.isActive = isActive
  }

  const provider = await prisma.provider.update({ where: { id }, data })
  res.json(provider)
})

router.get('/providers/:id/models', async (req, res) => {
  const { id } = req.params
  const provider = await prisma.provider.findUnique({ where: { id } })
  if (!provider) return res.status(404).json({ error: 'Provider not found' })

  try {
    const url = `${provider.baseUrl}/models`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (provider.apiKey) headers['Authorization'] = `Bearer ${provider.apiKey}`

    const r = await fetch(url, { headers })
    if (!r.ok) {
      if (id === 'openrouter') {
        const r2 = await fetch('https://openrouter.ai/api/v1/models')
        if (r2.ok) {
          const data = await r2.json()
          return res.json(data.data?.map((m: any) => m.id) || data.data?.map((m: any) => m.slug) || [])
        }
      }
      return res.json([])
    }

    const data = await r.json()
    const models = data.data?.map((m: any) => m.id) || data.models?.map((m: any) => m.id) || Object.keys(data)
    res.json(models)
  } catch {
    res.json([])
  }
})

router.post('/providers/:id/test', async (req, res) => {
  const { id } = req.params
  const provider = await prisma.provider.findUnique({ where: { id } })
  if (!provider) return res.status(404).json({ error: 'Provider not found' })

  try {
    if (id === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: provider.selectedModel, max_tokens: 10, messages: [{ role: 'user', content: 'ping' }] }),
      })
      if (!r.ok) throw new Error(await r.text())
    } else if (id === 'google') {
      const r = await fetch(`${provider.baseUrl}/models/${provider.selectedModel}:generateContent?key=${provider.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
      })
      if (!r.ok) throw new Error(await r.text())
    } else {
      const r = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
        body: JSON.stringify({ model: provider.selectedModel, messages: [{ role: 'user', content: 'ping' }], max_tokens: 10 }),
      })
      if (!r.ok) throw new Error(await r.text())
    }
    res.json({ ok: true, message: 'Connection successful' })
  } catch (e: any) {
    res.json({ ok: false, message: e.message })
  }
})

router.get('/personality', async (_req, res) => {
  const personality = await prisma.personality.findUnique({ where: { id: 'main' } })
  res.json(personality)
})

router.put('/personality', async (req, res) => {
  const { systemPrompt, temperature, maxTokens, topP, frequencyPenalty, activePreset } = req.body
  const data: Record<string, unknown> = {}
  if (systemPrompt !== undefined) data.systemPrompt = systemPrompt
  if (temperature !== undefined) data.temperature = temperature
  if (maxTokens !== undefined) data.maxTokens = maxTokens
  if (topP !== undefined) data.topP = topP
  if (frequencyPenalty !== undefined) data.frequencyPenalty = frequencyPenalty
  if (activePreset !== undefined) data.activePreset = activePreset

  const personality = await prisma.personality.update({ where: { id: 'main' }, data })
  res.json(personality)
})

router.put('/settings', async (req, res) => {
  const { cavemanMode, cacheEnabled, cacheTTL, avatarUrl, themeMode, themeAccent, workingDir } = req.body
  const data: Record<string, unknown> = {}
  if (cavemanMode !== undefined) data.cavemanMode = cavemanMode
  if (cacheEnabled !== undefined) data.cacheEnabled = cacheEnabled
  if (cacheTTL !== undefined) data.cacheTTL = cacheTTL
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl
  if (themeMode !== undefined) data.themeMode = themeMode
  if (themeAccent !== undefined) data.themeAccent = themeAccent
  if (workingDir !== undefined) data.workingDir = workingDir

  const config = await prisma.config.update({ where: { id: 'main' }, data })
  res.json({
    cavemanMode: config.cavemanMode,
    cacheEnabled: config.cacheEnabled,
    cacheTTL: config.cacheTTL,
    avatarUrl: config.avatarUrl,
    themeMode: config.themeMode,
    themeAccent: config.themeAccent,
    workingDir: config.workingDir,
  })
})

export default router
