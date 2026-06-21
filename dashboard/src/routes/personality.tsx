import { useState, useEffect, useRef } from 'react'
import { Save, RotateCcw, Upload } from 'lucide-react'
import { api, type Personality, type Settings } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

const PRESETS = [
  { name: 'Default', temp: 0.7, desc: 'Neutral helpful assistant' },
  { name: 'Formal', temp: 0.3, desc: 'Professional & concise' },
  { name: 'Friendly', temp: 0.8, desc: 'Warm & conversational' },
  { name: 'Sarkastik', temp: 0.9, desc: 'Witty with humor' },
  { name: 'Jenius', temp: 0.5, desc: 'Deep expert responses' },
]

const PRESET_PROMPTS: Record<string, string> = {
  Default: 'You are a helpful AI assistant.',
  Formal: 'You are a professional assistant. Respond formally and concisely. Use proper grammar and avoid casual language.',
  Friendly: 'You are a warm, friendly assistant. Be approachable and conversational. Use a relaxed tone.',
  Sarkastik: 'You are a witty, sarcastic assistant. Use humor and irony in your responses.',
  Jenius: 'You are a deep expert in all fields. Provide thorough, expert-level responses with detailed explanations.',
}

export default function PersonalityPage() {
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getPersonality().then(setPersonality)
    api.getSettings().then(setSettings).catch(() => {})
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    const updated = await api.updateSettings({ avatarUrl: base64 } as any)
    setSettings(prev => prev ? { ...prev, avatarUrl: base64 } : null)
  }

  if (!personality) return <p className="text-muted-foreground">Loading...</p>

  function applyPreset(name: string) {
    const p = PRESETS.find((x) => x.name === name)
    update({ systemPrompt: PRESET_PROMPTS[name], temperature: p?.temp ?? 0.7, activePreset: name })
  }

  async function update(data: Partial<Personality>) {
    const updated = await api.updatePersonality(data)
    setPersonality(updated)
  }

  async function handleSave() {
    if (!personality) return
    setSaving(true)
    await api.updatePersonality(personality)
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personality</h2>
          <p className="text-sm text-muted-foreground">Customize how your AI responds</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Avatar</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg font-bold overflow-hidden shrink-0">
            {settings?.avatarUrl ? (
              <img src={settings.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              'U'
            )}
          </div>
          <div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => avatarRef.current?.click()}>
              <Upload size={14} /> Upload Avatar
            </Button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <p className="text-xs text-muted-foreground mt-1">Avatar shown in the chat top bar</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.name)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                personality.activePreset === preset.name
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-card'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{preset.name}</span>
                {personality.activePreset === preset.name && (
                  <Badge variant="success" className="text-[10px] px-1 py-0">Active</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{preset.desc}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">T={preset.temp}</p>
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">System Prompt</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={5} value={personality.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value, activePreset: '' })}
            className="font-mono text-sm" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Inference Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <SliderField label="Temperature" value={personality.temperature} min={0} max={2} step={0.1}
            onChange={(v) => update({ temperature: v })} />
          <SliderField label="Max Tokens" value={personality.maxTokens} min={256} max={16384} step={256}
            onChange={(v) => update({ maxTokens: v })} />
          <SliderField label="Top P" value={personality.topP} min={0} max={1} step={0.05}
            onChange={(v) => update({ topP: v })} />
          <SliderField label="Frequency Penalty" value={personality.frequencyPenalty} min={-2} max={2} step={0.1}
            onChange={(v) => update({ frequencyPenalty: v })} />
        </CardContent>
      </Card>
    </div>
  )
}

function SliderField({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}
