import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface BTCChartProps {
    history: { timestamp: number; price: number }[]
}

export default function BTCChart({ history }: BTCChartProps) {
    if (!history || history.length === 0) return null

    const data = history.map(p => ({
        date: new Date(p.timestamp).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
        price: Math.round(p.price),
    }))

    const min = Math.min(...data.map(d => d.price))
    const max = Math.max(...data.map(d => d.price))
    const isUp = data[data.length - 1]?.price > data[0]?.price

    return (
        <div style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: 10,
            padding: 16,
        }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                📈 BTC — 30 Day Chart
                <span style={{ fontSize: 11, color: isUp ? '#00ff88' : '#ff4444', marginLeft: 8 }}>
                    {isUp ? '▲' : '▼'} {(((data[data.length - 1]?.price - data[0]?.price) / data[0]?.price) * 100).toFixed(1)}%
                </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
                <LineChart data={data}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#444' }} tickLine={false} axisLine={false} interval={6} />
                    <YAxis domain={[min * 0.99, max * 1.01]} tick={{ fontSize: 9, fill: '#444' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={36} />
                    <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: '#888' }}
                        itemStyle={{ color: '#00ff88' }}
                        formatter={(v) => {
                            if (typeof v !== 'number') return ['', 'BTC']
                            return [`$${v.toLocaleString()}`, 'BTC']
                        }}
                    />
                    <Line type="monotone" dataKey="price" stroke={isUp ? '#00ff88' : '#ff4444'} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}