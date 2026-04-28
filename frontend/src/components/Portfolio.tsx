interface PortfolioProps {
  total: number
  executed: number
  held: number
  failed: number
  openOrders: number
}

export default function Portfolio({
  total,
  executed,
  held,
  failed,
  openOrders
}: PortfolioProps) {

  const stats = [
    { label: 'Total Cycles', value: total, color: '#e2e8f0' },
    { label: 'Executed', value: executed, color: '#22c55e' },
    { label: 'Held', value: held, color: '#f59e0b' },
    { label: 'Failed', value: failed, color: '#ef4444' },
    { label: 'Open Orders', value: openOrders, color: '#94a3b8' },
  ]

  return (
    <div style={{
      borderRadius: 16,
      padding: 16,
      background: 'transparent',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#e2e8f0',
        marginBottom: 14,
      }}>
        💼 Session Stats
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {stats.map(stat => (
          <div
            key={stat.label}
            style={{
              borderRadius: 12,
              padding: '12px 14px',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(148,163,184,0.1)',
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Label */}
            <div style={{
              fontSize: 11,
              color: '#64748b',
              marginBottom: 4,
            }}>
              {stat.label}
            </div>

            {/* Value */}
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: stat.color,
              letterSpacing: '-0.3px',
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}