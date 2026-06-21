import { Router } from 'express'
import { authMiddleware } from '../lib/auth-middleware'

const COMMUNITY_SKILLS = [
  { id: 'find-skills', name: 'Find Skills', repo: 'vercel-labs/skills', description: 'Discover and install agent skills from the skills.sh directory', installs: '2.1M' },
  { id: 'frontend-design', name: 'Frontend Design', repo: 'anthropics/skills', description: 'Design and implement beautiful frontend interfaces', installs: '571K' },
  { id: 'react-best-practices', name: 'React Best Practices', repo: 'vercel-labs/agent-skills', description: 'React performance optimization guidelines from Vercel Engineering', installs: '491K' },
  { id: 'agent-browser', name: 'Agent Browser', repo: 'vercel-labs/agent-browser', description: 'Browser automation and web interaction for AI agents', installs: '469K' },
  { id: 'web-design-guidelines', name: 'Web Design Guidelines', repo: 'vercel-labs/agent-skills', description: 'Review UI code for web interface guidelines compliance', installs: '405K' },
  { id: 'caveman', name: 'Caveman', repo: 'juliusbrussee/caveman', description: 'Make your AI agent speak like a caveman', installs: '269K' },
  { id: 'brainstorming', name: 'Brainstorming', repo: 'obra/superpowers', description: 'Explore user intent, requirements and design before implementation', installs: '234K' },
  { id: 'systematic-debugging', name: 'Systematic Debugging', repo: 'obra/superpowers', description: 'Systematic approach to debugging and bug fixing', installs: '153K' },
  { id: 'writing-plans', name: 'Writing Plans', repo: 'obra/superpowers', description: 'Create implementation plans for complex multi-step tasks', installs: '152K' },
  { id: 'test-driven-development', name: 'Test-Driven Development', repo: 'obra/superpowers', description: 'Write tests before implementation code for any feature', installs: '135K' },
  { id: 'seo-audit', name: 'SEO Audit', repo: 'coreyhaines31/marketingskills', description: 'Audit websites for SEO best practices and improvements', installs: '142K' },
  { id: 'supabase', name: 'Supabase', repo: 'supabase/agent-skills', description: 'Supabase integration and best practices for agents', installs: '132K' },
  { id: 'tdd', name: 'TDD', repo: 'mattpocock/skills', description: 'Test-driven development workflow for TypeScript', installs: '277K' },
  { id: 'teach', name: 'Teach', repo: 'mattpocock/skills', description: 'Teach concepts effectively with examples and explanations', installs: '90K' },
]

const router = Router()
router.use(authMiddleware)

router.get('/', (_req, res) => {
  res.json(COMMUNITY_SKILLS)
})

export default router
