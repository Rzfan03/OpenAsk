import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth'
import configRoutes from './routes/config'
import tunnelRoutes from './routes/tunnel'
import chatRoutes from './routes/chat'
import statsRoutes from './routes/stats'
import skillsRoutes from './routes/skills'
import combosRoutes from './routes/combos'
import communitySkillsRoutes from './routes/community-skills'
import chatsRoutes from './routes/chats'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 20130

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/config', configRoutes)
app.use('/api/skills', skillsRoutes)
app.use('/api/combos', combosRoutes)
app.use('/api/community-skills', communitySkillsRoutes)
app.use('/api/chats', chatsRoutes)
app.use('/api/tunnel', tunnelRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/stats', statsRoutes)

const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
