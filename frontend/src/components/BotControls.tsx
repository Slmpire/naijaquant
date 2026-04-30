interface BotControlsProps {
  paused: boolean
  isTrading: boolean
  onPause: () => void
  onResume: () => void
  onTriggerTrade: () => void
}

export default function BotControls({ paused, isTrading, onPause, onResume, onTriggerTrade }: BotControlsProps) {
  return (
    <div className="card fade-1" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      borderColor: paused ? 'rgba(224,90,74,0.3)' : 'rgba(212,160,84,0.2)',
    }}>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 10, height: 10,
          borderRadius: '50%',
          background: paused ? 'var(--red-soft)' : 'var(--amber)',
          animation: paused ? 'none' : 'pulse-dot 1.8s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 700,
            color: paused ? 'var(--red-soft)' : 'var(--amber)',
          }}>
            {paused ? 'Bot Paused' : 'Bot Running'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
            {paused
              ? 'All trade cycles are suspended — no orders will be placed'
              : 'Scanning markets and trading automatically every 15 minutes'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>

        {/* Manual trade — only when running */}
        {!paused && (
          <button
            className="btn-trade"
            onClick={onTriggerTrade}
            disabled={isTrading}
            style={{ fontSize: 11 }}
          >
            {isTrading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 9, height: 9,
                  border: '1.5px solid var(--amber)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Running...
              </span>
            ) : '▶ Run Now'}
          </button>
        )}

        {/* Pause / Resume toggle */}
        <button
          onClick={paused ? onResume : onPause}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '8px 18px',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: `1px solid ${paused ? 'var(--amber)' : 'var(--red-soft)'}`,
            background: paused
              ? 'rgba(212,160,84,0.1)'
              : 'rgba(224,90,74,0.1)',
            color: paused ? 'var(--amber)' : 'var(--red-soft)',
          }}
        >
          {paused ? '▶ Resume Bot' : '⏸ Pause Bot'}
        </button>

      </div>
    </div>
  )
}