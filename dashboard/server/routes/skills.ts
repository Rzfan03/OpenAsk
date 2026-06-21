import { Router } from 'express'
import prisma from '../prisma/client'
import { authMiddleware } from '../lib/auth-middleware'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } })
  res.json(skills)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { enabled, name, description, systemPrompt, icon } = req.body

  const data: Record<string, unknown> = {}
  if (enabled !== undefined) data.enabled = enabled
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description
  if (systemPrompt !== undefined) data.systemPrompt = systemPrompt
  if (icon !== undefined) data.icon = icon

  const skill = await prisma.skill.update({ where: { id }, data })
  res.json(skill)
})

router.post('/', async (req, res) => {
  const { name, description, systemPrompt, icon } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const skill = await prisma.skill.create({
    data: { id, name, description: description || '', systemPrompt: systemPrompt || '', icon: icon || 'Lightbulb', enabled: false },
  })
  res.json(skill)
})

router.put('/:id/toggle', async (req, res) => {
  const { id } = req.params
  const current = await prisma.skill.findUnique({ where: { id } })
  if (!current) return res.status(404).json({ error: 'Skill not found' })

  const skill = await prisma.skill.update({ where: { id }, data: { enabled: !current.enabled } })
  res.json(skill)
})

router.post('/install', async (req, res) => {
  const { repo } = req.body
  if (!repo) return res.status(400).json({ error: 'repo is required' })

  try {
    const url = `https://raw.githubusercontent.com/${repo}/main/SKILL.md`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch SKILL.md from ${repo}`)

    const text = await response.text()
    const lines = text.split('\n')
    const titleMatch = text.match(/^#\s+(.+)/m)
    let name = repo.split('/').pop() || 'Untitled'
    let systemPrompt = text
    let description = ''

    if (titleMatch) {
      name = titleMatch[1].trim()
      const titleIndex = lines.findIndex((l) => l.startsWith('# '))
      const contentLines = lines.slice(titleIndex + 1).filter((l) => l.trim())
      systemPrompt = contentLines.join('\n')
      if (contentLines[0] && !contentLines[0].startsWith('#')) {
        description = contentLines[0].slice(0, 120)
      }
    }

    const id = repo.replace('/', '-').toLowerCase()
    const skill = await prisma.skill.upsert({
      where: { id },
      update: { name, description, systemPrompt },
      create: { id, name, description: description || '', systemPrompt: systemPrompt || '', icon: 'Lightbulb', enabled: false },
    })
    res.json(skill)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
