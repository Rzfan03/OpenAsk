import { useState, useEffect } from 'react'
import { Play, Square, Copy, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import { api, type TunnelStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function TunnelPage() {
  const [status, setStatus] = useState<TunnelStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const fetchStatus = () => api.getTunnelStatus().then(setStatus).catch(() => {})

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleStart() {
    setLoading(true)
    setError('')
    try {
      const result = await api.startTunnel()
      setStatus(result)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleStop() {
    setError('')
    setStatus(await api.stopTunnel())
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tunnel</h2>
        <p className="text-sm text-muted-foreground">Expose your AI backend to the internet via Cloudflare Tunnel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            {status?.running ? (
              <Badge variant="success" className="gap-1.5 text-sm px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Running
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-sm px-3 py-1">Stopped</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Your Server</p>
            <p className="text-sm font-mono">{window.location.origin}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">API Port</p>
            <p className="text-sm font-mono">20130</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Cloudflare Tunnel</CardTitle>
          <Button size="sm" variant="outline" onClick={fetchStatus} className="gap-1.5">
            <RefreshCw size={14} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.running && status.url ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Tunnel URL</p>
                <div className="flex gap-2">
                  <Input value={status.url} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(status.url)} className="shrink-0 gap-1.5">
                    <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(status.url, '_blank')} className="shrink-0 gap-1.5">
                    <ExternalLink size={14} /> Open
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm text-green-500 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                Tunnel is active. Your API is accessible from the internet.
              </div>
            </>
          ) : (
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              Tunnel is offline. Start it to expose your API via Cloudflare Tunnel.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Tunnel Error</p>
                <p className="text-destructive/80 text-xs mt-0.5">{error}</p>
                <p className="text-destructive/60 text-xs mt-1">Make sure cloudflared is installed: <span className="font-mono">npm install -g cloudflared</span></p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!status?.running ? (
              <Button onClick={handleStart} disabled={loading} className="gap-2">
                <Play size={16} /> {loading ? 'Starting...' : 'Start Tunnel'}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStop} className="gap-2">
                <Square size={16} /> Stop Tunnel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
