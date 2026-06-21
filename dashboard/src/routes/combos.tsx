import { useState, useEffect } from 'react'
import { GitBranch, Plus, Trash2, GripVertical } from 'lucide-react'
import { api, type Combo } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ALL_MODELS = [
  { id: 'cc/claude-opus-4-7', name: 'Claude Opus 4.7', tier: 'subscription' },
  { id: 'cc/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', tier: 'subscription' },
  { id: 'cx/gpt-5.5', name: 'GPT 5.5', tier: 'subscription' },
  { id: 'glm/glm-4.7', name: 'GLM 4.7', tier: 'cheap' },
  { id: 'minimax/MiniMax-M2.7', name: 'MiniMax M2.7', tier: 'cheap' },
  { id: 'kimi/kimi-k2.5', name: 'Kimi K2.5', tier: 'cheap' },
  { id: 'kr/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (Kiro)', tier: 'free' },
  { id: 'oc/auto', name: 'OpenCode Free', tier: 'free' },
]

const TIERS = [
  { value: 'subscription', label: 'Subscription', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  { value: 'cheap', label: 'Cheap', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  { value: 'free', label: 'FREE', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
]

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCombos().then(setCombos).finally(() => setLoading(false))
  }, [])

  async function addCombo() {
    const combo = await api.createCombo('New Combo')
    setCombos((prev) => [...prev, combo])
  }

  async function removeCombo(id: string) {
    await api.deleteCombo(id)
    setCombos((prev) => prev.filter((c) => c.id !== id))
  }

  async function renameCombo(id: string, name: string) {
    const combo = await api.updateCombo(id, name)
    setCombos((prev) => prev.map((c) => (c.id === id ? combo : c)))
  }

  async function addModel(comboId: string) {
    const combo = await api.addComboItem(comboId, ALL_MODELS[0].id)
    setCombos((prev) => prev.map((c) => (c.id === comboId ? combo : c)))
  }

  async function removeModel(comboId: string, itemId: string) {
    const combo = await api.deleteComboItem(comboId, itemId)
    setCombos((prev) => prev.map((c) => (c.id === comboId ? combo : c)))
  }

  async function updateModel(comboId: string, itemId: string, model: string) {
    const combo = await api.updateComboItem(comboId, itemId, model)
    setCombos((prev) => prev.map((c) => (c.id === comboId ? combo : c)))
  }

  async function moveModel(comboId: string, items: string[]) {
    const combo = await api.reorderComboItems(comboId, items)
    setCombos((prev) => prev.map((c) => (c.id === comboId ? combo : c)))
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Combos</h2>
          <p className="text-sm text-muted-foreground">Model combinations with automatic fallback tiers</p>
        </div>
        <Button onClick={addCombo} className="gap-2"><Plus size={16} /> New Combo</Button>
      </div>

      {combos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <GitBranch size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No combos yet</p>
            <p className="text-sm">Create a combo to set up automatic fallback between models</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 max-w-4xl">
        {combos.map((combo) => (
          <Card key={combo.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <Input
                value={combo.name}
                onChange={(e) => renameCombo(combo.id, e.target.value)}
                className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0"
              />
              <Button variant="ghost" size="sm" onClick={() => removeCombo(combo.id)} className="text-destructive hover:text-destructive">
                <Trash2 size={16} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">1st — Subscription</Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">2nd — Cheap</Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">3rd — FREE</Badge>
              </div>

              {combo.items.map((item, index) => {
                const model = ALL_MODELS.find((m) => m.id === item.model)
                const tierInfo = TIERS.find((t) => t.value === model?.tier)
                return (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <button
                      className="cursor-grab text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        if (index === 0) return
                        const ids = combo.items.map((i) => i.id)
                        const copy = [...ids]
                        const [moved] = copy.splice(index, 1)
                        copy.splice(index - 1, 0, moved)
                        moveModel(combo.id, copy)
                      }}
                    >
                      <GripVertical size={16} />
                    </button>
                    <Select
                      value={item.model}
                      onValueChange={(v) => updateModel(combo.id, item.id, v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_MODELS.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="flex items-center gap-2">
                              {m.name}
                              <span className="text-xs text-muted-foreground">({m.id})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {tierInfo && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tierInfo.color}`}>
                        {tierInfo.label}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-mono w-6 text-center">#{index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeModel(combo.id, item.id)} className="h-7 w-7 p-0">
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                )
              })}

              <Button variant="outline" size="sm" onClick={() => addModel(combo.id)} className="w-full gap-1.5 mt-2">
                <Plus size={14} /> Add Model
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
