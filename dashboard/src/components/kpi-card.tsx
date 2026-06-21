import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  unit: string
  bs: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}

const trendIcons = { up: TrendingUp, down: TrendingDown, neutral: Minus }

export default function KpiCard({ label, value, unit, bs, icon: Icon, trend, trendLabel }: KpiCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null
  return (
    <div className="rounded-2xl bg-card border border-[#2C2C2E] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#98989D] font-medium tracking-wide uppercase">{label}</span>
        <Icon size={20} className="text-[#98989D]" />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-['JetBrains_Mono',monospace] font-bold text-[32px] leading-none text-primary tracking-tight">
          {value}
        </span>
        <span className="text-sm text-[#98989D] font-medium">{unit}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#98989D]">
          ≈ <span className="font-['JetBrains_Mono',monospace] font-medium text-[#32D74B]">{bs}</span>
        </span>
        {trend && TrendIcon && (
          <span className={`text-xs font-medium flex items-center gap-1 ${
            trend === 'up' ? 'text-[#FF453A]' : trend === 'down' ? 'text-[#32D74B]' : 'text-[#98989D]'
          }`}>
            <TrendIcon size={12} /> {trendLabel}
          </span>
        )}
      </div>
    </div>
  )
}
