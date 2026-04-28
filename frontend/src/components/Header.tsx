interface HeaderProps {
  btcPrice: number
  ngnRate: number
  isLive: boolean
}

export default function Header({ btcPrice, ngnRate, isLive }: HeaderProps) {
  return (
    <div
      style={{
        background: 'rgba(2, 6, 23, 0.8)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Brand + Live */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#22c55e',
            letterSpacing: '-0.3px',
          }}
        >
          NaijaQuant
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isLive
              ? 'rgba(34, 197, 94, 0.15)'
              : 'rgba(148, 163, 184, 0.15)',
            color: isLive ? '#22c55e' : '#94a3b8',
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 999,
            border: `1px solid ${
              isLive ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.2)'
            }`,
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isLive ? '#22c55e' : '#94a3b8',
              boxShadow: isLive
                ? '0 0 6px rgba(34,197,94,0.8)'
                : 'none',
            }}
          />
          {isLive ? 'LIVE' : 'CONNECTING'}
        </span>
      </div>

      {/* Right: Market Data */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* BTC */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 11,
              color: '#64748b',
              marginBottom: 2,
            }}
          >
            BTC/USD
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#f8fafc',
              letterSpacing: '-0.2px',
            }}
          >
            ${btcPrice.toLocaleString()}
          </div>
        </div>

        {/* NGN */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 11,
              color: '#64748b',
              marginBottom: 2,
            }}
          >
            USD/NGN
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#f8fafc',
              letterSpacing: '-0.2px',
            }}
          >
            ₦{ngnRate.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}