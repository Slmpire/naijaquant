import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'

interface BTCChartProps {
  history: { timestamp: number; price: number }[]
}

export default function BTCChart({ history }: BTCChartProps) {
  if (!history || history.length === 0) return null

  const data = history.map(p => ({
    date: new Date(p.timestamp).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric'
    }),
    price: Math.round(p.price),
  }))

  const min = Math.min(...data.map(d => d.price))
  const max = Math.max(...data.map(d => d.price))
  const isUp = data[data.length - 1]?.price > data[0]?.price

  const change =
    ((data[data.length - 1]?.price - data[0]?.price) /
      data[0]?.price) *
    100

  const color = isUp ? '#22c55e' : '#ef4444'

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        background: 'transparent',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#e2e8f0',
        }}>
          BTC — 30 Day Chart
        </div>

        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>{isUp ? '▲' : '▼'}</span>
          {change.toFixed(1)}%
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          {/* Grid (very subtle) */}
          <CartesianGrid
            stroke="rgba(148,163,184,0.08)"
            vertical={false}
          />

          {/* X Axis */}
          <XAxis
            dataKey="date"
            tick={{
              fontSize: 10,
              fill: '#64748b',
            }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />

          {/* Y Axis */}
          <YAxis
            domain={[min * 0.99, max * 1.01]}
            tick={{
              fontSize: 10,
              fill: '#64748b',
            }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />

          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 10,
              fontSize: 12,
              backdropFilter: 'blur(6px)',
            }}
            labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
            itemStyle={{ color }}
            formatter={(v) => {
              if (typeof v !== 'number') return ['', 'BTC']
              return [`$${v.toLocaleString()}`, 'BTC']
            }}
          />

          {/* Line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 4,
              stroke: color,
              strokeWidth: 2,
              fill: '#020617',
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}80)`
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}