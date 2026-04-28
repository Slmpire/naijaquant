interface PortfolioProps {
  total: number
  executed: number
  held: number
  failed: number
  openOrders: number
}

export default function Portfolio({ total, executed, held, failed, openOrders }: PortfolioProps) {
  const stats = [
    { label: 'Total Cycles', value: total, color: '#fff' },
    { label: 'Executed', value: executed, color: '#00ff88' },
    { label: 'Held', value: held, color: '#ffaa00' },
    { label: 'Failed', value: failed, color: '#ff4444' },
    { label: 'Open Orders', value: openOrders, color: '#888' },
  ]

  return (
    <div style={{
      background: '#111',
      border: '1px solid #222',
      borderRadius: 10,
      padding: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
        💼 Session Stats
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            background: '#0a0a0a',
            borderRadius: 8,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}