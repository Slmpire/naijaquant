import { store } from '../store'

export interface QuantSignal {
  score: number
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  ma7: number
  ma30: number
  rsi: number
  momentum: number
  reason: string
}

function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return 0
  const slice = prices.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50

  const changes = prices.slice(-period - 1).map((p, i, arr) =>
    i === 0 ? 0 : p - arr[i - 1]
  ).slice(1)

  const gains = changes.filter(c => c > 0)
  const losses = changes.filter(c => c < 0).map(Math.abs)

  const avgGain = gains.reduce((a, b) => a + b, 0) / period
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function calculateMomentum(prices: number[], period = 10): number {
  if (prices.length < period) return 0
  const latest = prices[prices.length - 1]
  const earlier = prices[prices.length - period]
  return ((latest - earlier) / earlier) * 100
}

export function getQuantSignal(): QuantSignal {
  const prices = store.btcHistory.map(p => p.price)

  if (prices.length < 30) {
    return {
      score: 50,
      direction: 'NEUTRAL',
      ma7: 0,
      ma30: 0,
      rsi: 50,
      momentum: 0,
      reason: 'Not enough price history yet',
    }
  }

  const ma7 = calculateMA(prices, 7)
  const ma30 = calculateMA(prices, 30)
  const rsi = calculateRSI(prices)
  const momentum = calculateMomentum(prices)

  // Score each indicator 0-100
  // MA crossover: ma7 > ma30 = bullish
  const maScore = ma7 > ma30
    ? Math.min(100, 50 + ((ma7 - ma30) / ma30) * 1000)
    : Math.max(0, 50 - ((ma30 - ma7) / ma30) * 1000)

  // RSI: 50-70 bullish zone, 70+ overbought (bearish), 30- oversold (bullish bounce)
  let rsiScore = 50
  if (rsi > 70) rsiScore = 30        // overbought — expect drop
  else if (rsi > 50) rsiScore = 70   // bullish momentum
  else if (rsi < 30) rsiScore = 80   // oversold — expect bounce
  else rsiScore = 35                  // bearish momentum

  // Momentum: positive = bullish
  const momentumScore = Math.min(100, Math.max(0, 50 + momentum * 5))

  // Weighted average: MA 40%, RSI 30%, Momentum 30%
  const score = Math.round(maScore * 0.4 + rsiScore * 0.3 + momentumScore * 0.3)

  const direction = score >= 60 ? 'BULLISH' : score <= 40 ? 'BEARISH' : 'NEUTRAL'

  const reason = `MA7 ($${ma7.toFixed(0)}) is ${ma7 > ma30 ? 'above' : 'below'} MA30 ($${ma30.toFixed(0)}). RSI at ${rsi.toFixed(1)} — ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'normal range'}. Momentum ${momentum > 0 ? '+' : ''}${momentum.toFixed(2)}%.`

  return { score, direction, ma7, ma30, rsi, momentum, reason }
}