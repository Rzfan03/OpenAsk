interface Alert {
  id: string
  message: string
  time: string
  type: 'peak' | 'vampire' | 'normal'
}

const alerts: Alert[] = [
  { id: '1', message: 'Pico de consumo detectado — 2.4 kW a las 19:32', time: 'Hace 12 min', type: 'peak' },
  { id: '2', message: 'Carga vampiro: TV en standby consume 12W', time: 'Hace 1h', type: 'vampire' },
  { id: '3', message: 'Consumo normal — 0.8 kW promedio', time: 'Hace 2h', type: 'normal' },
  { id: '4', message: 'Pico de consumo detectado — 3.1 kW a las 12:15', time: 'Hace 5h', type: 'peak' },
]

export default function AlertPanel() {
  return (
    <div className="rounded-2xl bg-card border border-[#2C2C2E] p-5 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Alertas</h3>
        <span className="flex items-center gap-1.5 text-xs text-[#32D74B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#32D74B]" />
          En Vivo
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg px-4 py-3 text-sm flex flex-col gap-1 ${
              alert.type === 'peak'
                ? 'bg-[#3A1C1C] border-l-4 border-[#FF453A]'
                : alert.type === 'vampire'
                ? 'bg-[#3A1C1C] border-l-4 border-[#FF453A]'
                : 'bg-[#1E1E1E] border border-[#2C2C2E]'
            }`}
          >
            <span className={`text-sm leading-snug ${
              alert.type === 'peak' || alert.type === 'vampire' ? 'text-[#FF453A]' : 'text-[#98989D]'
            }`}>
              {alert.message}
            </span>
            <span className="text-xs text-[#98989D]">{alert.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
