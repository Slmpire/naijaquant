import { store } from '../store'
import { createHmac, createHash } from 'node:crypto'
import { config } from '../config'

export interface MispricingSignal {
  score: number
  direction: 'BUY_UP' | 'BUY_DOWN' | 'NEUTRAL'
  bayseImpliedProb: number
  modelProb: number
  gap: number
  reason: string
}

function sign(secretKey: string, method: string, path: string, body: string, timestamp: string): string {
  const bodyHash = body ? createHash('sha256').update(body).digest('hex') : ''
  const message = `${timestamp}.${method}.${path}.${bodyHash}`
  return createHmac('sha256', secretKey).update(message).digest('base64')
}

async function bayseRequest(method: string, path: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Public-Key': config.bayse.apiKey,
  }
  if (method !== 'GET') {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = sign(config.bayse.secretKey, method, path, '', timestamp)
    headers['X-Timestamp'] = timestamp
    headers['X-Signature'] = signature
  }
  const res = await fetch(`https://relay.bayse.markets${path}`, { method, headers })
  if (!res.ok) throw new Error(`Bayse API ${res.status}`)
  return res.json()
}

// Calculate real probability of BTC going up in next 15 minutes
// based on historical 15-minute movements
function calculateModelProbability(): number {
  const prices = store.btcHistory.map(p => p.price)
  if (prices.length < 10) return 0.5

  // Count how many recent daily moves were positive
  const recentMoves = prices.slice(-20)
  const upMoves = recentMoves.filter((p, i) =>
    i > 0 && p > recentMoves[i - 1]
  ).length
  const totalMoves = recentMoves.length - 1

  // Blend base rate with recent momentum
  const baseRate = upMoves / totalMoves
  const currentPrice = store.btcCurrentPrice
  const ma7 = prices.slice(-7).reduce((a, b) => a + b, 0) / 7

  // If current price is above MA7, slightly boost up probability
  const momentumBoost = currentPrice > ma7 ? 0.05 : -0.05

  return Math.min(0.85, Math.max(0.15, baseRate + momentumBoost))
}

export async function getMispricingSignal(
  targetEventId?: string,
  targetMarketId?: string
): Promise<MispricingSignal> {
  try {
    let event: any = null

    if (targetEventId) {
      // Fetch the specific selected market
      const data = await bayseRequest('GET', `/v1/pm/events/${targetEventId}`)
      event = data.event ?? data
    } else {
      // Default — fetch first active BTC 15-min market
      const data = await bayseRequest(
        'GET',
        '/v1/pm/events?status=open&seriesSlug=crypto-btc-15min&currency=NGN&limit=5'
      )
      const events = data.events ?? []
      event = events[0]
    }

    if (!event) {
      return {
        score: 50,
        direction: 'NEUTRAL',
        bayseImpliedProb: 0.5,
        modelProb: 0.5,
        gap: 0,
        reason: 'No active Bayse markets found',
      }
    }

    const market = targetMarketId
      ? event.markets?.find((m: any) => m.id === targetMarketId) ?? event.markets?.[0]
      : event.markets?.[0]

    if (!market) throw new Error('No market found in event')

    const bayseUpPrice = market.outcome1Price ?? 0.5
    const bayseImpliedProb = bayseUpPrice
    const modelProb = calculateModelProbability()
    const gap = modelProb - bayseImpliedProb

    let direction: 'BUY_UP' | 'BUY_DOWN' | 'NEUTRAL' = 'NEUTRAL'
    let score = 50

    if (gap > 0.08) {
      direction = 'BUY_UP'
      score = Math.min(100, Math.round(50 + gap * 400))
    } else if (gap < -0.08) {
      direction = 'BUY_DOWN'
      score = Math.max(0, Math.round(50 + gap * 400))
    }

    const reason = `Bayse crowd prices UP at ${(bayseImpliedProb * 100).toFixed(1)}%. Our model says ${(modelProb * 100).toFixed(1)}%. Gap: ${gap > 0 ? '+' : ''}${(gap * 100).toFixed(1)}% — ${direction === 'NEUTRAL' ? 'no significant mispricing' : `crowd mispriced, ${direction}`}.`

    return { score, direction, bayseImpliedProb, modelProb, gap, reason }

  } catch (err: any) {
    return {
      score: 50,
      direction: 'NEUTRAL',
      bayseImpliedProb: 0.5,
      modelProb: calculateModelProbability(),
      gap: 0,
      reason: `Mispricing check failed: ${err.message}`,
    }
  }
}