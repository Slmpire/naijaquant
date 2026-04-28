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

function getColor(score: number) {
  return score >= 65 ? '#22c55e' : score <= 35 ? '#ef4444' : '#f59e0b'
}

function ScoreBar({ score }: { score: number }) {
  const color = getColor(score)

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4,
        fontSize: 11,
      }}>
        <span style={{ color: '#64748b' }}>Score</span>
        <span style={{ fontWeight: 600, color }}>{score}/100</span>
      </div>

      <div style={{
        background: 'rgba(148,163,184,0.15)',
        borderRadius: 999,
        height: 6,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: color,
          borderRadius: 999,
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
    </div>
  )
}

function Card({ title, icon, signal }: { title: string; icon: string; signal: Signal }) {
  const color = getColor(signal.score)

  const getLabel = (d: string) => {
    if (['BULLISH', 'POSITIVE', 'BUY_UP'].includes(d)) return 'Bullish'
    if (['BEARISH', 'NEGATIVE', 'BUY_DOWN'].includes(d)) return 'Bearish'
    return 'Neutral'
  }

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      padding: 16,
      borderRadius: 16,
      background: 'rgba(15,23,42,0.6)',
      border: '1px solid rgba(148,163,184,0.1)',
      backdropFilter: 'blur(8px)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 12,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {icon} {title}
        </span>

        <span style={{
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 999,
          background: `${color}20`,
          color,
          border: `1px solid ${color}30`,
          fontWeight: 500,
        }}>
          {getLabel(signal.direction)}
        </span>
      </div>

      <ScoreBar score={signal.score} />

      <p style={{
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 10,
        lineHeight: 1.5,
      }}>
        {signal.reason}
      </p>
    </div>
  )
}

export default function SignalCards({
  quant,
  sentiment,
  mispricing,
  confidenceScore,
  recommendation
}: SignalCardsProps) {

  const color =
    recommendation === 'BUY_UP' ? '#22c55e'
    : recommendation === 'BUY_DOWN' ? '#ef4444'
    : '#f59e0b'

  const getLabel = () => {
    if (recommendation === 'BUY_UP') return 'Strong Buy'
    if (recommendation === 'BUY_DOWN') return 'Sell Signal'
    return 'Hold / Neutral'
  }

  return (
    <div>
      {/* Confidence Banner */}
      <div style={{
        padding: '18px 20px',
        borderRadius: 18,
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(2,6,23,0.9))',
        border: `1px solid ${color}30`,
        backdropFilter: 'blur(10px)',
      }}>
        {/* Left */}
        <div>
          <div style={{
            fontSize: 12,
            color: '#64748b',
            marginBottom: 4,
          }}>
            Confidence Score
          </div>

          <div style={{
            fontSize: 34,
            fontWeight: 800,
            color,
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
          }}>
            {confidenceScore}
            <span style={{ fontSize: 14, color: '#475569' }}>/100</span>
          </div>
        </div>

        {/* Right */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 12,
            color: '#64748b',
            marginBottom: 6,
          }}>
            Recommendation
          </div>

          <div style={{
            fontSize: 15,
            fontWeight: 600,
            color,
            background: `${color}15`,
            padding: '8px 16px',
            borderRadius: 10,
            border: `1px solid ${color}30`,
          }}>
            {getLabel()}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        display: 'flex',
        gap: 14,
        flexDirection: window.innerWidth < 600 ? 'column' : 'row',
      }}>
        <Card title="Quant Signal" icon="📊" signal={quant} />
        <Card title="Naija Sentiment" icon="🇳🇬" signal={sentiment} />
        <Card title="Mispricing" icon="🔍" signal={mispricing} />
      </div>
    </div>
  )
}