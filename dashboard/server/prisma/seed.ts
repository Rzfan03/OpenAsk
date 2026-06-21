import prisma from './client'
import { hashSync } from 'bcryptjs'

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', selectedModel: 'openai/gpt-4o' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', selectedModel: 'gpt-4o' },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', selectedModel: 'claude-3-5-sonnet-20241022' },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', selectedModel: 'gemini-2.0-flash' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', selectedModel: 'llama-3.3-70b-versatile' },
]

async function main() {
  await prisma.config.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main', password: hashSync('admin123', 10) },
  })

  for (const p of PROVIDERS) {
    await prisma.provider.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, isActive: p.id === 'groq' },
    })
  }

  await prisma.personality.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main' },
  })

  const SKILLS = [
    { id: 'web-search', name: 'Web Search', description: 'Enables real-time web search capabilities for up-to-date information', systemPrompt: 'You can search the web for current information when needed. Use web search to find recent data, news, and facts.', icon: 'Globe' },
    { id: 'code-review', name: 'Code Review', description: 'Systematic code review with security analysis and best practices', systemPrompt: 'When reviewing code, check for security vulnerabilities, performance issues, and adherence to best practices. Provide actionable feedback.', icon: 'Code2' },
    { id: 'debugging', name: 'Debugging', description: 'Structured debugging approach with root cause analysis', systemPrompt: 'Follow a systematic approach to debugging: reproduce the issue, isolate variables, check assumptions, and verify fixes.', icon: 'Bug' },
    { id: 'creative', name: 'Creative Writing', description: 'Enhanced creative writing with vivid language and narrative structure', systemPrompt: 'Use vivid language, strong narrative structure, and creative techniques. Adapt tone and style to the requested format.', icon: 'Pen' },
    { id: 'data-analysis', name: 'Data Analysis', description: 'Structured data analysis with statistical rigor', systemPrompt: 'Approach data analysis methodically: understand the data, clean and preprocess, apply appropriate statistical methods, and visualize results clearly.', icon: 'BarChart3' },
  ]

  for (const s of SKILLS) {
    await prisma.skill.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    })
  }

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
