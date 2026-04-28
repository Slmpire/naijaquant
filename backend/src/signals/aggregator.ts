import { getQuantSignal, QuantSignal } from './quant'
import { getSentimentSignal, SentimentSignal } from './sentiment'
import { getMispricingSignal, MispricingSignal } from './mispricing'

export interface AggregatedSignal {
  confidenceScore: number
  recommendation: 'BUY_UP' | 'BUY_DOWN' | 'HOLD'
  quant: QuantSignal
  sentiment: SentimentSignal
  mispricing: MispricingSignal
  marketId?: string
  eventId?: string
  eventTitle?: string
  timestamp: number
}

export async function getAggregatedSignal(
  eventId?: string,
  marketId?: string,
  eventTitle?: string
): Promise<AggregatedSignal> {
  const [quant, sentiment, mispricing] = await Promise.all([
    Promise.resolve(getQuantSignal()),
    getSentimentSignal(),
    getMispricingSignal(eventId, marketId),
  ])

  const confidenceScore = Math.round(
    quant.score * 0.4 +
    sentiment.score * 0.3 +
    mispricing.score * 0.3
  )

  let recommendation: 'BUY_UP' | 'BUY_DOWN' | 'HOLD' = 'HOLD'
  if (confidenceScore >= 65) recommendation = 'BUY_UP'
  else if (confidenceScore <= 35) recommendation = 'BUY_DOWN'

  return {
    confidenceScore,
    recommendation,
    quant,
    sentiment,
    mispricing,
    marketId,
    eventId,
    eventTitle,
    timestamp: Date.now(),
  }
}