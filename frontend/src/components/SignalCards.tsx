interface Signal {
  score: number
  direction: string
  reason: string
}

interface SignalCardsProps {
  quant: Signal
  sentiment: Signal
  mispricing: Signal
  confidenceScore: number
  recommendation: string
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 65 ? '#00ff88' : score <= 35 ? '#ff4444' : '#ffaa00'
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#666' }}>Score</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}/100</span>
      </div>
      <div style={{ background: '#1a1a1a', borderRadius: 4, height: 5 }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function Card({ title, icon, signal }: { title: string; icon: string; signal: Signal }) {
  const directionColor = (d: string) =>
    ['BULLISH', 'POSITIVE', 'BUY_UP'].includes(d) ? '#00ff88'
    : ['BEARISH', 'NEGATIVE', 'BUY_DOWN'].includes(d) ? '#ff4444'
    : '#ffaa00'

  return (
    <div style={{
      background: '#111',
      border: '1px solid #222',
      borderRadius: 10,
      padding: 14,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#888' }}>{icon} {title}</span>
        <span style={{
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 20,
          background: `${directionColor(signal.direction)}20`,
          color: directionColor(signal.direction),
          border: `1px solid ${directionColor(signal.direction)}40`,
          whiteSpace: 'nowrap',
        }}>
          {signal.direction}
        </span>
      </div>
      <ScoreBar score={signal.score} />
      <p style={{ fontSize: 11, color: '#555', marginTop: 8, lineHeight: 1.5, margin: '8px 0 0' }}>
        {signal.reason}
      </p>
    </div>
  )
}

export default function SignalCards({ quant, sentiment, mispricing, confidenceScore, recommendation }: SignalCardsProps) {
  const recColor = recommendation === 'BUY_UP' ? '#00ff88'
    : recommendation === 'BUY_DOWN' ? '#ff4444' : '#ffaa00'

  return (
    <div>
      {/* Confidence Banner */}
      <div style={{
        background: '#111',
        border: `1px solid ${recColor}40`,
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Confidence Score</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: recColor, lineHeight: 1 }}>
            {confidenceScore}
            <span style={{ fontSize: 14, color: '#444' }}>/100</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Recommendation</div>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: recColor,
            background: `${recColor}15`,
            padding: '6px 14px',
            borderRadius: 8,
            border: `1px solid ${recColor}30`,
          }}>
            {recommendation}
          </div>
        </div>
      </div>

      {/* Signal Cards — stack on mobile */}
      <div style={{
        display: 'flex',
        gap: 10,
        flexDirection: window.innerWidth < 600 ? 'column' : 'row',
      }}>
        <Card title="Quant Signal" icon="📊" signal={quant} />
        <Card title="Naija Sentiment" icon="🇳🇬" signal={sentiment} />
        <Card title="Mispricing" icon="🔍" signal={mispricing} />
      </div>
    </div>
  )
}