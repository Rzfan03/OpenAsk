import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, Globe, Sparkles, Brain, Search, Zap, PlusCircle, X, RefreshCw } from 'lucide-react'
import { api, type Provider } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PROVIDER_META: Record<string, { color: string; icon: typeof Globe }> = {
  openrouter: { color: '#FF6B35', icon: Globe },
  openai: { color: '#10A37F', icon: Sparkles },
  anthropic: { color: '#D4A574', icon: Brain },
  google: { color: '#4285F4', icon: Search },
  groq: { color: '#F55036', icon: Zap },
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'fail'>>({})
  const [testMsg, setTestMsg] = useState<Record<string, string>>({})

  useEffect(() => {
    api.getProviders().then(setProviders).finally(() => setLoading(false))
  }, [])

  async function updateProvider(id: string, data: Record<string, unknown>) {
    const updated = await api.updateProvider(id, data)
    setProviders((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  async function testProvider(id: string) {
    setTesting((prev) => ({ ...prev, [id]: 'loading' }))
    setTestMsg((prev) => ({ ...prev, [id]: '' }))
    try {
      const result = await api.testProvider(id)
      setTesting((prev) => ({ ...prev, [id]: result.ok ? 'ok' : 'fail' }))
      setTestMsg((prev) => ({ ...prev, [id]: result.message }))
    } catch {
      setTesting((prev) => ({ ...prev, [id]: 'fail' }))
      setTestMsg((prev) => ({ ...prev, [id]: 'Request failed' }))
    }
  }

  const [providerModels, setProviderModels] = useState<Record<string, string[]>>({})
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({})

  async function loadModels(id: string) {
    setLoadingModels(p => ({ ...p, [id]: true }))
    try {
      const models = await api.fetchProviderModels(id)
      setProviderModels(p => ({ ...p, [id]: models }))
    } catch {}
    setLoadingModels(p => ({ ...p, [id]: false }))
  }

  function getModels(provider: Provider): string[] {
    return providerModels[provider.id] || []
  }

  const [showAddForm, setShowAddForm] = useState(false)
  const [newProvider, setNewProvider] = useState({ id: '', name: '', baseUrl: '', apiKey: '', selectedModel: '' })
  const [addError, setAddError] = useState('')

  async function handleAddProvider() {
    setAddError('')
    try {
      const created = await api.createProvider({
        id: newProvider.id || newProvider.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name: newProvider.name,
        baseUrl: newProvider.baseUrl,
        apiKey: newProvider.apiKey || undefined,
        selectedModel: newProvider.selectedModel || undefined,
      })
      setProviders((prev) => [...prev, created])
      setShowAddForm(false)
      setNewProvider({ id: '', name: '', baseUrl: '', apiKey: '', selectedModel: '' })
    } catch (e: any) {
      setAddError(e.message || 'Failed to create provider')
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Providers</h2>
        <Button onClick={() => setShowAddForm(true)} className="gap-1.5">
          <PlusCircle size={16} /> Add Custom
        </Button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAddForm(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Add Custom Provider</h3>
              <button onClick={() => setShowAddForm(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"><X size={15} /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name *</Label>
                <Input placeholder="My Provider" value={newProvider.name} onChange={e => setNewProvider({ ...newProvider, name: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Base URL *</Label>
                <Input placeholder="https://api.example.com/v1" value={newProvider.baseUrl} onChange={e => setNewProvider({ ...newProvider, baseUrl: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">API Key</Label>
                <Input type="password" placeholder="sk-..." value={newProvider.apiKey} onChange={e => setNewProvider({ ...newProvider, apiKey: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Model</Label>
                <Input placeholder="gpt-4o" value={newProvider.selectedModel} onChange={e => setNewProvider({ ...newProvider, selectedModel: e.target.value })} className="h-9" />
              </div>
              {addError && <p className="text-xs text-destructive">{addError}</p>}
              <Button className="w-full" onClick={handleAddProvider} disabled={!newProvider.name || !newProvider.baseUrl}>
                Add Provider
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {providers.map((provider) => {
          const meta = PROVIDER_META[provider.id] || { color: '#6366F1', icon: Globe }
          const LogoIcon = meta.icon
          const testState = testing[provider.id]

          return (
            <Card key={provider.id} className={provider.isActive ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: meta.color + '20' }}
                  >
                    <LogoIcon size={22} style={{ color: meta.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{provider.name}</span>
                        {provider.isActive && <Badge variant="success">Active</Badge>}
                      </div>
                      {!provider.isActive && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateProvider(provider.id, { isActive: true })}>
                          Set Active
                        </Button>
                      )}
                    </div>

                    {/* API Key row */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">API Key</Label>
                        <Input
                          type="password" placeholder="sk-..."
                          value={provider.apiKey}
                          onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 shrink-0 gap-1.5"
                        onClick={() => testProvider(provider.id)}
                        disabled={testState === 'loading' || !provider.apiKey}
                      >
                        {testState === 'loading' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : testState === 'ok' ? (
                          <CheckCircle2 size={14} className="text-green-500" />
                        ) : testState === 'fail' ? (
                          <XCircle size={14} className="text-destructive" />
                        ) : null}
                        {testState === 'ok' ? 'Connected' : testState === 'fail' ? 'Failed' : 'Test'}
                      </Button>
                    </div>
                    {testMsg[provider.id] && (
                      <p className={`text-xs ${testState === 'ok' ? 'text-green-500' : 'text-destructive'}`}>
                        {testMsg[provider.id]}
                      </p>
                    )}

                    {/* Model row */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Model</Label>
                        <button
                          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                          onClick={() => loadModels(provider.id)}
                          disabled={loadingModels[provider.id]}
                        >
                          <RefreshCw size={11} className={loadingModels[provider.id] ? 'animate-spin' : ''} />
                          {getModels(provider).length > 0 ? 'Refresh' : 'Fetch models'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={getModels(provider).includes(provider.selectedModel) ? provider.selectedModel : '__custom__'}
                          onValueChange={(v) => v !== '__custom__' && updateProvider(provider.id, { selectedModel: v })}
                        >
                          <SelectTrigger className="flex-[3] h-9"><SelectValue placeholder={getModels(provider).length > 0 ? 'Select model' : 'Fetch to load models'} /></SelectTrigger>
                          <SelectContent>
                            {getModels(provider).map((m) => (
                              <SelectItem key={m} value={m} className="font-mono text-xs">{m}</SelectItem>
                            ))}
                            {getModels(provider).length === 0 && (
                              <SelectItem value="__empty__" disabled className="text-muted-foreground italic">
                                No models loaded — click Fetch
                              </SelectItem>
                            )}
                            {getModels(provider).length > 0 && (
                              <SelectItem value="__custom__" disabled className="text-muted-foreground italic">
                                + Type custom below
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <div className="flex-[2]">
                          <Input
                            placeholder="Custom model..."
                            value={provider.selectedModel}
                            onChange={(e) => updateProvider(provider.id, { selectedModel: e.target.value })}
                            className="w-full h-9 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


