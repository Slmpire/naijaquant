interface Trade {
  id: string
  timestamp: number
  action: string
  confidenceScore: number
  status: string
  eventTitle: string
  outcomeLabel: string
  price: number
  orderId: string | null
  reason: string
}

interface TradeLogProps {
  trades: Trade[]
  onTriggerTrade: () => void
  isTrading: boolean
}

export default function TradeLog({ trades, onTriggerTrade, isTrading }: TradeLogProps) {
  const statusColor = (s: string) =>
    s === 'EXECUTED' ? '#00ff88' : s === 'HELD' ? '#ffaa00' : '#ff4444'

  const actionColor = (a: string) =>
    a === 'BUY_UP' ? '#00ff88' : a === 'BUY_DOWN' ? '#ff4444' : '#ffaa00'

  return (
    <div style={{
      background: '#111',
      border: '1px solid #222',
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>⚡ Trade Log</span>
        <button
          onClick={onTriggerTrade}
          disabled={isTrading}
          style={{
            background: isTrading ? '#222' : '#00ff8820',
            color: isTrading ? '#444' : '#00ff88',
            border: '1px solid #00ff8840',
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 12,
            cursor: isTrading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {isTrading ? '⏳ Trading...' : '▶ Run Trade Cycle'}
        </button>
      </div>

      {trades.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#444', padding: '40px 0', fontSize: 13 }}>
          No trades yet — click "Run Trade Cycle" to start
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trades.map(trade => (
            <div key={trade.id} style={{
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: `${actionColor(trade.action)}20`,
                    color: actionColor(trade.action),
                    border: `1px solid ${actionColor(trade.action)}40`,
                    fontWeight: 600,
                  }}>
                    {trade.action}
                  </span>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: `${statusColor(trade.status)}15`,
                    color: statusColor(trade.status),
                  }}>
                    {trade.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#444' }}>
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#555' }}>
                  Confidence: <span style={{ color: '#fff' }}>{trade.confidenceScore}/100</span>
                </span>
              </div>

              {trade.eventTitle && (
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                  {trade.eventTitle} → <span style={{ color: '#888' }}>{trade.outcomeLabel}</span>
                  {trade.price > 0 && <span style={{ color: '#555' }}> @ {trade.price}</span>}
                </div>
              )}

              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5, margin: 0 }}>
                {trade.reason}
              </p>

              {trade.orderId && (
                <div style={{ fontSize: 11, color: '#333', marginTop: 6 }}>
                  Order: {trade.orderId}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}