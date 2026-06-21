import { useState, useEffect } from 'react'
import { Server, Globe, Activity, RefreshCw, Cpu, Clock, Database, BarChart3, Squirrel, Zap, KeyRound, Check, AlertCircle, FolderOpen } from 'lucide-react'
import { api, type Provider, type TunnelStatus, type TokenUsage, type Settings } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import TokenChart from '@/components/token-chart'

export default function OverviewPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [tunnel, setTunnel] = useState<TunnelStatus | null>(null)
  const [tokens, setTokens] = useState<TokenUsage | null>(null)
  const [tokenHistory, setTokenHistory] = useState<{ time: number; in: number; out: number }[]>([])
  const [uptime, setUptime] = useState('')
  const [serverStart, setServerStart] = useState(0)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    api.getUptime().then((r) => setServerStart(r.start)).catch(() => {})
    api.getSettings().then(setSettings).catch(() => {})
  }, [])

  useEffect(() => {
    if (!serverStart) return
    const timer = setInterval(() => {
      const s = Math.floor((Date.now() - serverStart) / 1000)
      setUptime(`${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [serverStart])

  const fetchAll = () => {
    Promise.all([
      api.getProviders().catch(() => {}),
      api.getTunnelStatus().catch(() => {}),
      api.getTokenUsage().catch(() => {}),
      api.getTokenHistory().catch(() => {}),
    ]).then(([p, t, tok, hist]) => {
      if (p) setProviders(p as Provider[])
      if (t) setTunnel(t as TunnelStatus)
      if (tok) setTokens(tok as TokenUsage)
      if (hist) setTokenHistory(hist as { time: number; in: number; out: number }[])
      api.getSettings().then(setSettings).catch(() => {})
    })
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [])

  const activeProvider = providers.find((p) => p.isActive)
  const configuredProviders = providers.filter((p) => p.apiKey)
  const serverUrl = window.location.origin

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-sm text-muted-foreground">System overview and real-time API status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Providers</p>
              <p className="text-xl font-bold">{configuredProviders.length}/{providers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tokens Used</p>
              <p className="text-xl font-bold font-mono">
                {tokens ? (tokens.totalTokensIn + tokens.totalTokensOut).toLocaleString() : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Globe size={20} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tunnel</p>
              <p className="text-xl font-bold">{tunnel?.running ? 'Online' : 'Offline'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Clock size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="text-xl font-bold font-mono text-sm">{uptime || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Usage Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            <CardTitle className="text-sm font-medium">Token Usage (Last 30 minutes)</CardTitle>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw size={12} /> Real-time
          </span>
        </CardHeader>
        <CardContent>
          <TokenChart data={tokenHistory} />
          {tokenHistory.length > 0 && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary/60" /> Tokens/min
              </span>
              <span>Peak: {Math.max(...tokenHistory.map(d => d.in + d.out), 0).toLocaleString()} tokens</span>
              <span>Avg: {Math.round(tokenHistory.reduce((s, d) => s + d.in + d.out, 0) / tokenHistory.length).toLocaleString()}/min</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Server size={18} className="text-primary" />
            <CardTitle className="text-sm font-medium">Active Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {activeProvider ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {activeProvider.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{activeProvider.selectedModel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Base URL</span>
                  <span className="font-mono text-xs text-primary truncate max-w-[200px]">{activeProvider.baseUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Key</span>
                  <span className={activeProvider.apiKey ? 'text-green-500' : 'text-destructive'}>
                    {activeProvider.apiKey ? 'Configured' : 'Missing'}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                <p className="font-medium">No active provider</p>
                <p className="text-xs mt-1">Go to Providers to set one up</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Globe size={18} className="text-primary" />
            <CardTitle className="text-sm font-medium">Network & Tunnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Server URL</span>
              <span className="font-mono text-xs">{serverUrl}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tunnel Status</span>
              {tunnel?.running ? (
                <Badge variant="success" className="gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary">Offline</Badge>
              )}
            </div>
            {tunnel?.url && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tunnel URL</span>
                <span className="font-mono text-xs text-primary truncate max-w-[200px]">{tunnel.url}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API Port</span>
              <span className="font-mono text-xs">20130</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Activity size={18} className="text-primary" />
            <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <EndpointRow label="Chat Stream" url={`${serverUrl}/api/chat/stream`} />
            <EndpointRow label="Auth" url={`${serverUrl}/api/auth/login`} />
            <EndpointRow label="Providers" url={`${serverUrl}/api/config/providers`} />
            <EndpointRow label="Stats" url={`${serverUrl}/api/stats/tokens`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-primary" />
              <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw size={12} /> Live
            </span>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Input Tokens</span>
              <span className="font-mono font-medium">{tokens ? tokens.totalTokensIn.toLocaleString() : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Output Tokens</span>
              <span className="font-mono font-medium">{tokens ? tokens.totalTokensOut.toLocaleString() : '—'}</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="font-mono font-bold text-primary">
                {tokens ? (tokens.totalTokensIn + tokens.totalTokensOut).toLocaleString() : '—'}
              </span>
            </div>
            {tokens && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last Hour</span>
                <span className="font-mono">{tokens.hourly.in + tokens.hourly.out} tokens</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <KeyRound size={18} className="text-primary" />
          <CardTitle className="text-sm font-medium">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Caveman Mode */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Squirrel size={18} className="text-primary" />
            <CardTitle className="text-sm font-medium">Caveman Mode</CardTitle>
          </div>
          <Switch
            checked={settings?.cavemanMode ?? false}
            onCheckedChange={(v) => {
              api.updateSettings({ cavemanMode: v }).then(setSettings)
            }}
          />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {settings?.cavemanMode
              ? 'Caveman mode is active — AI responses will be in primitive caveman language.'
              : 'Toggle on to make AI agents speak like cavemen. Fun mode for testing.'}
          </p>
          {settings?.cavemanMode && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
              <p className="font-medium">Caveman active! Me talk like caveman now.</p>
              <p className="text-xs mt-1 text-amber-500/80">All chat responses will use simple caveman language.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Layer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            <CardTitle className="text-sm font-medium">Response Cache</CardTitle>
          </div>
          <Switch
            checked={settings?.cacheEnabled ?? false}
            onCheckedChange={(v) => {
              api.updateSettings({ cacheEnabled: v }).then(setSettings)
            }}
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {settings?.cacheEnabled
                ? 'Cache is enabled (TTL: ' + (settings?.cacheTTL ?? 300) + 's). Repeated identical requests will return cached responses.'
                : 'Cache is disabled. Enable to reduce API costs for repeated queries.'}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
              <span>Current TTL</span>
              <span className="font-mono">{settings?.cacheTTL ?? 300}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Directory */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <FolderOpen size={18} className="text-primary" />
          <CardTitle className="text-sm font-medium">Working Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The AI can read/write/edit files inside this directory. Leave empty to use the project root.
            </p>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent/50 transition-colors"
                placeholder="/home/user/project"
                value={settings?.workingDir ?? ''}
                onChange={(e) => setSettings(prev => prev ? { ...prev, workingDir: e.target.value } : prev)}
              />
              <button
                className="px-3 py-2 bg-accent text-accent-foreground text-sm rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => api.updateSettings({ workingDir: settings?.workingDir ?? '' }).then(setSettings)}
              >
                Save
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('Passwords do not match')
      return
    }
    if (newPassword.length < 4) {
      setStatus('error')
      setMessage('Password must be at least 4 characters')
      return
    }

    setStatus('loading')
    try {
      await api.changePassword(oldPassword, newPassword)
      setStatus('success')
      setMessage('Password changed successfully')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setStatus('error')
      setMessage(e.message || 'Failed to change password')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
          placeholder="Current password"
          className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm outline-none focus:border-accent/50 transition-colors" />
      </div>
      <div>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm outline-none focus:border-accent/50 transition-colors" />
      </div>
      <div>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm outline-none focus:border-accent/50 transition-colors" />
      </div>

      {message && (
        <div className={'flex items-center gap-1.5 text-xs ' + (status === 'success' ? 'text-green-500' : 'text-destructive')}>
          {status === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
          {message}
        </div>
      )}

      <button type="submit" disabled={status === 'loading' || !oldPassword || !newPassword || !confirmPassword}
        className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
        {status === 'loading' ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  )
}

function EndpointRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-primary truncate max-w-[220px]">{url}</span>
    </div>
  )
}
