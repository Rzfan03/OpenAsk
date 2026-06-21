import { spawn, execSync, ChildProcess } from 'child_process'
import prisma from '../prisma/client'

let tunnelProcess: ChildProcess | null = null

function checkCloudflared(): string | null {
  try {
    const out = execSync('which cloudflared 2>/dev/null || command -v cloudflared 2>/dev/null', { encoding: 'utf-8' })
    return out.trim() || null
  } catch {
    return null
  }
}

export function getTunnelStatus() {
  return { running: tunnelProcess !== null && !tunnelProcess.killed }
}

export async function getTunnelUrl(): Promise<string> {
  const config = await prisma.config.findUnique({ where: { id: 'main' } })
  return config?.tunnelUrl ?? ''
}

export function startTunnel(port: number): Promise<string> {
  if (tunnelProcess && !tunnelProcess.killed) throw new Error('Tunnel already running')

  const cloudflaredPath = checkCloudflared()
  if (!cloudflaredPath) {
    throw new Error('cloudflared not found. Install it: npm install -g cloudflared')
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${port}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let resolved = false

    const handleOutput = (data: Buffer) => {
      const output = data.toString()
      const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/)
      if (match && !resolved) {
        resolved = true
        const url = match[0]
        prisma.config.update({ where: { id: 'main' }, data: { tunnelUrl: url } }).catch(() => {})
        resolve(url)
      }
    }

    proc.stdout?.on('data', handleOutput)
    proc.stderr?.on('data', handleOutput)
    proc.on('error', (err) => { if (!resolved) reject(err) })
    proc.on('exit', (code) => {
      tunnelProcess = null
      if (!resolved && code !== null) reject(new Error(`cloudflared exited with code ${code}`))
    })
    tunnelProcess = proc
  })
}

export function stopTunnel(): void {
  if (tunnelProcess && !tunnelProcess.killed) {
    tunnelProcess.kill('SIGTERM')
    tunnelProcess = null
  }
}
