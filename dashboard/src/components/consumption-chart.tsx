const data = [0.4, 0.6, 0.8, 1.2, 1.8, 2.4, 1.6, 1.0, 0.9, 1.1, 1.5, 2.0, 1.3, 0.7, 0.5, 0.8, 1.4, 2.2, 2.8, 2.1, 1.2, 0.6, 0.4, 0.3]

const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']

export default function ConsumptionChart() {
  const w = 720
  const h = 200
  const padding = { top: 16, right: 16, bottom: 28, left: 40 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom
  const maxVal = Math.max(...data)
  const stepX = chartW / (data.length - 1)

  const points = data.map((v, i) => `${padding.left + i * stepX},${padding.top + chartH * (1 - v / maxVal)}`)
  const areaPoints = `${padding.left},${padding.top + chartH} ` + points.join(' ') + ` ${padding.left + (data.length - 1) * stepX},${padding.top + chartH}`

  return (
    <div className="rounded-2xl bg-card border border-[#2C2C2E] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Consumo Hoy</h3>
        <span className="text-xs text-[#98989D]">Actualizado cada 5 min</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + chartH * (1 - ratio)}
            x2={padding.left + chartW}
            y2={padding.top + chartH * (1 - ratio)}
            stroke="#2C2C2E"
            strokeWidth={1}
          />
        ))}
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <text
            key={ratio}
            x={padding.left - 8}
            y={padding.top + chartH * (1 - ratio) + 4}
            textAnchor="end"
            fill="#98989D"
            fontSize={11}
            fontFamily="JetBrains Mono, monospace"
          >
            {(maxVal * ratio).toFixed(1)}
          </text>
        ))}
        {/* X-axis labels */}
        {hours.map((h, i) => (
          <text
            key={h}
            x={padding.left + (i * chartW) / (hours.length - 1)}
            y={padding.top + chartH + 18}
            textAnchor="middle"
            fill="#98989D"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
          >
            {h}
          </text>
        ))}
        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGrad)" />
        {/* Line */}
        <polyline points={points.join(' ')} fill="none" stroke="#6366F1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  )
}
