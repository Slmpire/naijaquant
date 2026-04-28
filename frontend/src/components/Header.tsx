interface HeaderProps {
  btcPrice: number
  ngnRate: number
  isLive: boolean
}

export default function Header({ btcPrice, ngnRate, isLive }: HeaderProps) {
  return (
    <div style={{
      background: '#0f0f0f',
      borderBottom: '1px solid #222',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#00ff88' }}>
          NaijaQuant
        </span>
        <span style={{
          background: '#00ff8820',
          color: '#00ff88',
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 20,
          border: '1px solid #00ff8840',
        }}>
          {isLive ? '● LIVE' : '○ CONNECTING'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#666' }}>BTC/USD</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            ${btcPrice.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#666' }}>USD/NGN</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            ₦{ngnRate.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}