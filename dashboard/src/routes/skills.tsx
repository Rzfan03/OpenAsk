import { useState, useEffect, useRef } from 'react'
import { Lightbulb, Upload, Globe, Code2, Bug, Pen, BarChart3, Download, Loader2 } from 'lucide-react'
import { api, type Skill, type CommunitySkill } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const ICON_MAP: Record<string, typeof Globe> = {
  Globe, Code2, Bug, Pen, BarChart3, Lightbulb,
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [community, setCommunity] = useState<CommunitySkill[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      api.getSkills(),
      api.getCommunitySkills().catch(() => []),
    ]).then(([s, c]) => {
      setSkills(s)
      setCommunity(c)
      setLoading(false)
    })
  }, [])

  async function toggleSkill(id: string) {
    const updated = await api.toggleSkill(id)
    setSkills((prev) => prev.map((s) => (s.id === id ? updated : s)))
  }

  async function updateSystemPrompt(id: string, systemPrompt: string) {
    const updated = await api.updateSkill(id, { systemPrompt })
    setSkills((prev) => prev.map((s) => (s.id === id ? updated : s)))
  }

  function parseMdContent(text: string): { name: string; description: string; systemPrompt: string } {
    const lines = text.split('\n')
    let name = 'Untitled Skill'
    let systemPrompt = text
    let description = ''

    const titleMatch = text.match(/^#\s+(.+)/m)
    if (titleMatch) {
      name = titleMatch[1].trim()
      const titleIndex = lines.findIndex((l) => l.startsWith('# '))
      const contentLines = lines.slice(titleIndex + 1).filter((l) => l.trim())
      systemPrompt = contentLines.join('\n')
      if (contentLines[0] && !contentLines[0].startsWith('#')) {
        description = contentLines[0].slice(0, 120)
      }
    }

    return { name, description, systemPrompt }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const { name, description, systemPrompt } = parseMdContent(text)

    try {
      const skill = await api.createSkill({ name, description, systemPrompt })
      setSkills((prev) => [...prev, skill])
    } catch (err: any) {
      alert(err.message)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function installFromRepo(repo: string) {
    setInstalling(repo)
    try {
      const skill = await api.installCommunitySkill(repo)
      setSkills((prev) => [...prev, skill])
    } catch (err: any) {
      alert(err.message)
    }
    setInstalling(null)
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  const enabledCount = skills.filter((s) => s.enabled).length
  const installedRepos = new Set(skills.map((s) => s.id.replace('-', '/')))

  return (
    <div className="space-y-8">
      {/* My Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Skills</h2>
            <p className="text-sm text-muted-foreground">
              {enabledCount} of {skills.length} active
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload size={16} /> Import .md
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {skills.map((skill) => {
            const Icon = ICON_MAP[skill.icon] || Lightbulb
            return (
              <Card key={skill.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${skill.enabled ? 'bg-primary/15' : 'bg-muted'}`}>
                        <Icon size={22} className={skill.enabled ? 'text-primary' : 'text-muted-foreground'} />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {skill.name}
                          {skill.enabled && (
                            <Badge variant="success" className="text-[10px] h-5">Active</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs">{skill.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={skill.enabled}
                      onCheckedChange={() => toggleSkill(skill.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">System prompt</Label>
                    <Textarea
                      value={skill.systemPrompt}
                      onChange={(e) => updateSystemPrompt(skill.id, e.target.value)}
                      className="min-h-[90px] text-sm font-mono"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {skills.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Lightbulb size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No skills yet</p>
              <p className="text-sm">Import a .md file or install from the community catalog below</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Community Skills */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Community Skills</h2>
          <p className="text-sm text-muted-foreground">Browse and install skills from skills.sh</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {community.map((skill) => {
            const installed = installedRepos.has(skill.repo)
            return (
              <Card key={skill.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm">{skill.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{skill.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono">{skill.repo}</span>
                      <span className="ml-2">{skill.installs} installs</span>
                    </div>
                    <Button
                      size="sm"
                      variant={installed ? 'ghost' : 'default'}
                      className="gap-1.5 h-8 text-xs"
                      disabled={installed || installing === skill.repo}
                      onClick={() => installFromRepo(skill.repo)}
                    >
                      {installing === skill.repo ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Download size={12} />
                      )}
                      {installed ? 'Installed' : 'Install'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
