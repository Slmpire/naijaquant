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
    return `${mins}m`
  }

  const filteredEvents = useMemo(() => {
    if (!search) return events
    const term = search.toLowerCase()

    return events.filter(event => {
      if (event.title.toLowerCase().includes(term)) return true
      return event.markets.some(m =>
        m.outcomes.some(o => o.label.toLowerCase().includes(term))
      )
    })
  }, [events, search])

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(148,163,184,0.1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
          🏛️ Markets
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
            {filteredEvents.length} active
          </span>
        </div>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search markets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          boxSizing: 'border-box',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.15)',
          background: 'rgba(2,6,23,0.6)',
          color: '#e2e8f0',
          fontSize: 13,
          outline: 'none',
          marginBottom: 12,
        }}
      />

      {/* EMPTY */}
      {filteredEvents.length === 0 ? (
        <div style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#64748b',
          padding: '30px 0',
        }}>
          No markets found
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {filteredEvents.map(event => {
            const market = event.markets[0]
            if (!market) return null

            const upOutcome =
              market.outcomes.find(o => ['Up', 'YES', 'Yes'].includes(o.label)) ??
              market.outcomes[0]

            const downOutcome =
              market.outcomes.find(o => ['Down', 'NO', 'No'].includes(o.label)) ??
              market.outcomes[1]

            const upProb = upOutcome ? Math.round(upOutcome.price * 100) : 50
            const isSelected = selectedEventId === event.id

            return (
              <div
                key={event.id}
                onClick={() =>
                  onSelect(event.id, market.id, event.title)
                }
                style={{
                  borderRadius: 14,
                  padding: 12,
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(34,197,94,0.08)'
                    : 'rgba(2,6,23,0.5)',
                  border: isSelected
                    ? '1px solid rgba(34,197,94,0.35)'
                    : '1px solid rgba(148,163,184,0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* TOP ROW */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 8,
                }}>
                  <div style={{
                    fontSize: 12,
                    color: isSelected ? '#e2e8f0' : '#94a3b8',
                    lineHeight: 1.4,
                    flex: 1,
                  }}>
                    {event.title}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 4,
                  }}>
                    <span style={{
                      fontSize: 10,
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                    }}>
                      ⏱ {timeLeft(event.closingDate)}
                    </span>

                    {isSelected && (
                      <span style={{
                        fontSize: 10,
                        color: '#22c55e',
                        background: 'rgba(34,197,94,0.1)',
                        padding: '2px 6px',
                        borderRadius: 999,
                        border: '1px solid rgba(34,197,94,0.25)',
                      }}>
                        Selected
                      </span>
                    )}
                  </div>
                </div>

                {/* BAR */}
                <div style={{
                  display: 'flex',
                  height: 4,
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginBottom: 6,
                }}>
                  <div style={{
                    width: `${upProb}%`,
                    background: '#22c55e',
                  }} />
                  <div style={{
                    flex: 1,
                    background: '#ef4444',
                  }} />
                </div>

                {/* LABELS */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                }}>
                  <span style={{ color: '#22c55e' }}>
                    {upOutcome?.label ?? 'Up'} {upProb}%
                  </span>
                  <span style={{ color: '#ef4444' }}>
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