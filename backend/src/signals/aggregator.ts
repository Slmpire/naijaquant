import { getQuantSignal, QuantSignal } from './quant'
import { getSentimentSignal, SentimentSignal } from './sentiment'
import { getMispricingSignal, MispricingSignal } from './mispricing'

export interface AggregatedSignal {
  confidenceScore: number
  recommendation: 'BUY_UP' | 'BUY_DOWN' | 'HOLD'
  quant: QuantSignal
  sentiment: SentimentSignal
  mispricing: MispricingSignal
  timestamp: number
}

export async function getAggregatedSignal(): Promise<AggregatedSignal> {
  // Run all 3 signals in parallel
  const [quant, sentiment, mispricing] = await Promise.all([
    Promise.resolve(getQuantSignal()),
    getSentimentSignal(),
    getMispricingSignal(),
  ])

  // Weighted combination
  // Quant: 40% — most reliable signal
  // Sentiment: 30% — Nigerian macro context
  // Mispricing: 30% — crowd arbitrage opportunity
  const confidenceScore = Math.round(
    quant.score * 0.4 +
    sentiment.score * 0.3 +
    mispricing.score * 0.3
  )

  // Final recommendation
  let recommendation: 'BUY_UP' | 'BUY_DOWN' | 'HOLD' = 'HOLD'
  if (confidenceScore >= 65) recommendation = 'BUY_UP'
  else if (confidenceScore <= 35) recommendation = 'BUY_DOWN'

  return {
    confidenceScore,
    recommendation,
    quant,
    sentiment,
    mispricing,
    timestamp: Date.now(),
  }
}