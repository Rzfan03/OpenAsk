import { BarChart3 } from 'lucide-react'

interface Bucket {
  time: number
  in: number
  out: number
}

export default function TokenChart({ data, height = 180 }: { data: Bucket[]; height?: number }) {
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
      No token data yet
    </div>
  )

  const w = 700
  const h = height
  const pad = { top: 8, right: 8, bottom: 24, left: 8 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom
  const maxVal = Math.max(...data.map((d) => d.in + d.out), 1)
  const barW = Math.max(4, Math.min(20, chartW / data.length - 2))

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad.top + chartH * (1 - (d.in + d.out) / maxVal),
    h: chartH * ((d.in + d.out) / maxVal),
    total: d.in + d.out,
  }))

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#6366F1" stopOpacity={0.3} />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((r) => (
        <line key={r} x1={pad.left} y1={pad.top + chartH * (1 - r)}
          x2={pad.left + chartW} y2={pad.top + chartH * (1 - r)}
          stroke="#2C2C2E" strokeWidth={1} />
      ))}

      {points.map((p, i) => (
        <rect key={i} x={p.x - barW / 2} y={p.y} width={barW} height={p.h}
          rx={2} fill={`url(#barGrad)`} />
      ))}

      {data.length > 1 && data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0).map((d, i) => (
        <text key={i}
          x={pad.left + (data.indexOf(d) / Math.max(data.length - 1, 1)) * chartW}
          y={pad.top + chartH + 16}
          textAnchor="middle" fill="#98989D" fontSize={9} fontFamily="JetBrains Mono, monospace">
          {new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </text>
      ))}
    </svg>
  )
}
