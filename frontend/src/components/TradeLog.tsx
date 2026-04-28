import { useState } from 'react'

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
  const [isOpen, setIsOpen] = useState(true)
  const [openTradeId, setOpenTradeId] = useState<string | null>(null)


  const actionColor = (a: string) =>
    a === 'BUY_UP' ? '#22c55e' : a === 'BUY_DOWN' ? '#ef4444' : '#f59e0b'

  const actionLabel = (a: string) =>
    a === 'BUY_UP' ? 'Buy' : a === 'BUY_DOWN' ? 'Sell' : 'Hold'

  return (
    <div style={{ borderRadius: 16, padding: 16, background: 'transparent' }}>
      
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isOpen ? 16 : 0,
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <span
          style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', cursor: 'pointer' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          ⚡ Trade Activity {isOpen ? '▾' : '▸'}
        </span>

        <button
          onClick={onTriggerTrade}
          disabled={isTrading}
          style={{
            background: isTrading
              ? 'rgba(148,163,184,0.1)'
              : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: isTrading ? '#64748b' : '#020617',
            border: 'none',
            borderRadius: 10,
            padding: '8px 18px',
            fontSize: 12,
            cursor: isTrading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {isTrading ? '⏳ Running...' : 'Run Trade Cycle'}
        </button>
      </div>

      {/* COLLAPSIBLE CONTENT */}
      {isOpen && (
        <>
          {trades.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#64748b',
              padding: '30px 0',
              fontSize: 13,
            }}>
              No trades yet — run a cycle to generate signals
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trades.map(trade => {
                const isExpanded = openTradeId === trade.id

                return (
                  <div
                    key={trade.id}
                    style={{
                      borderRadius: 14,
                      padding: 12,
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid rgba(148,163,184,0.1)',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      setOpenTradeId(isExpanded ? null : trade.id)
                    }
                  >
                    {/* COLLAPSED SUMMARY ROW */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: `${actionColor(trade.action)}20`,
                          color: actionColor(trade.action),
                        }}>
                          {actionLabel(trade.action)}
                        </span>

                        <span style={{
                          fontSize: 11,
                          color: '#94a3b8',
                        }}>
                          {trade.confidenceScore}/100
                        </span>

                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </div>

                    {/* EXPANDED DETAILS */}
                    {isExpanded && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                          {trade.eventTitle} →{' '}
                          <span style={{ color: '#e2e8f0' }}>
                            {trade.outcomeLabel}
                          </span>
                          {trade.price > 0 && (
                            <span style={{ color: '#64748b' }}> @ {trade.price}</span>
                          )}
                        </div>

                        <p style={{
                          fontSize: 12,
                          color: '#64748b',
                          margin: 0,
                          lineHeight: 1.4,
                        }}>
                          {trade.reason}
                        </p>

                        {trade.orderId && (
                          <div style={{
                            fontSize: 11,
                            color: '#475569',
                            marginTop: 6,
                          }}>
                            Order ID: {trade.orderId}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}