import { useState, useMemo } from 'react'

interface Market {
  id: string
  title: string
  closingDate: string
  markets: { id: string; outcomes: { label: string; price: number }[] }[]
}

interface MarketSelectorProps {
  events: Market[]
  selectedEventId: string | null
  onSelect: (eventId: string, marketId: string, title: string) => void
  isMobile: boolean
}

export default function MarketSelector({
  events,
  selectedEventId,
  onSelect,
  isMobile,
}: MarketSelectorProps) {
  const [search, setSearch] = useState('')

  function timeLeft(closingDate: string) {
    const diff = new Date(closingDate).getTime() - Date.now()
    if (diff <= 0) return 'Closing'
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) return `${hrs}h ${mins % 60}m`
    return `${mins}m left`
  }

  // 🔍 Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!search) return events

    const term = search.toLowerCase()

    return events.filter(event => {
      // Match event title
      if (event.title.toLowerCase().includes(term)) return true

      // Match outcomes inside markets
      return event.markets.some(m =>
        m.outcomes.some(o =>
          o.label.toLowerCase().includes(term)
        )
      )
    })
  }, [events, search])

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #222',
        borderRadius: 10,
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          marginBottom: 12,
        }}
      >
        🏛️ Select a Market to Predict
        <span style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>
          {filteredEvents.length} active
        </span>
      </div>

      {/* 🔍 Search Input */}
      <input
        type="text"
        placeholder="Search markets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 12,
          padding: '10px',
          borderRadius: 8,
          border: '1px solid #222',
          background: '#0a0a0a',
          color: '#fff',
          fontSize: 13,
          outline: 'none',
        }}
      />

      {/* Empty state */}
      {filteredEvents.length === 0 ? (
        <div
          style={{
            color: '#444',
            fontSize: 12,
            textAlign: 'center',
            padding: '20px 0',
          }}
        >
          No markets found
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          {filteredEvents.map(event => {
            const market = event.markets[0]
            if (!market) return null

            const upOutcome =
              market.outcomes.find(o =>
                ['Up', 'YES', 'Yes'].includes(o.label)
              ) ?? market.outcomes[0]

            const downOutcome =
              market.outcomes.find(o =>
                ['Down', 'NO', 'No'].includes(o.label)
              ) ?? market.outcomes[1]

            const upProb = upOutcome
              ? Math.round(upOutcome.price * 100)
              : 50

            const isSelected = selectedEventId === event.id

            return (
              <div
                key={event.id}
                onClick={() =>
                  onSelect(event.id, market.id, event.title)
                }
                style={{
                  background: isSelected ? '#00ff8810' : '#0a0a0a',
                  border: `1px solid ${
                    isSelected ? '#00ff8850' : '#1a1a1a'
                  }`,
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {/* Title row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: isSelected ? '#fff' : '#aaa',
                      flex: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    {event.title}
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: '#555',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⏱ {timeLeft(event.closingDate)}
                    </span>

                    {isSelected && (
                      <span
                        style={{
                          fontSize: 10,
                          color: '#00ff88',
                          background: '#00ff8820',
                          padding: '1px 6px',
                          borderRadius: 10,
                          border: '1px solid #00ff8840',
                        }}
                      >
                        ● Selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Probability bar */}
                <div
                  style={{
                    display: 'flex',
                    borderRadius: 3,
                    overflow: 'hidden',
                    height: 5,
                    marginBottom: 5,
                  }}
                >
                  <div
                    style={{
                      width: `${upProb}%`,
                      background: '#00ff88',
                    }}
                  />
                  <div style={{ flex: 1, background: '#ff4444' }} />
                </div>

                {/* Labels */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#00ff88' }}>
                    {upOutcome?.label ?? 'Up'} {upProb}%
                  </span>
                  <span style={{ fontSize: 10, color: '#ff4444' }}>
                    {downOutcome?.label ?? 'Down'} {100 - upProb}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}