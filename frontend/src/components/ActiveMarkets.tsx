interface Market {
  id: string
  title: string
  closingDate: string
  markets: {
    id: string
    outcomes: { id: string; label: string; price: number }[]
  }[]
}

interface ActiveMarketsProps {
  events: Market[]
}

export default function ActiveMarkets({ events }: ActiveMarketsProps) {
  function timeLeft(closingDate: string) {
    const diff = new Date(closingDate).getTime() - Date.now()
    if (diff <= 0) return 'Closed'
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) return `${hrs}h ${mins % 60}m`
    return `${mins}m`
  }

  return (
    <div style={{
      background: '#111',
      border: '1px solid #222',
      borderRadius: 10,
      padding: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
        🏛️ Live Bayse Markets
        <span style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>
          {events.length} active
        </span>
      </div>

      {events.length === 0 ? (
        <div style={{ color: '#444', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
          No active markets right now
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map(event => {
            const market = event.markets[0]
            const upOutcome = market?.outcomes.find(o => o.label === 'Up' || o.label === 'YES') ?? market?.outcomes[0]
            const downOutcome = market?.outcomes.find(o => o.label === 'Down' || o.label === 'NO') ?? market?.outcomes[1]
            const upProb = upOutcome ? Math.round(upOutcome.price * 100) : 50

            return (
              <div key={event.id} style={{
                background: '#0a0a0a',
                borderRadius: 8,
                padding: 12,
                border: '1px solid #1a1a1a',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#ccc', flex: 1 }}>{event.title}</span>
                  <span style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap' }}>
                    ⏱ {timeLeft(event.closingDate)}
                  </span>
                </div>

                {market && (
                  <div style={{ marginTop: 8 }}>
                    {/* Probability bar */}
                    <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 6, marginBottom: 6 }}>
                      <div style={{ width: `${upProb}%`, background: '#00ff88' }} />
                      <div style={{ flex: 1, background: '#ff4444' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#00ff88' }}>
                        {upOutcome?.label} {upProb}%
                      </span>
                      <span style={{ fontSize: 10, color: '#ff4444' }}>
                        {downOutcome?.label} {100 - upProb}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}