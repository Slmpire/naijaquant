import {
  getActiveEvents,
  placeOrder,
  getOpenOrders,
  cancelOrder,
  getPortfolio,
  mintShares,
  BayseEvent,
} from './bayse'
import { getAggregatedSignal, AggregatedSignal } from '../signals/aggregator'

// ── Trade Log ─────────────────────────────────────────────

export interface TradeLog {
  id: string
  timestamp: number
  action: 'BUY_UP' | 'BUY_DOWN' | 'HOLD'
  confidenceScore: number
  quantScore: number
  sentimentScore: number
  mispricingScore: number
  eventTitle: string
  outcomeLabel: string
  price: number
  amount: number
  orderId: string | null
  reason: string
  status: 'EXECUTED' | 'HELD' | 'FAILED'
}

export const tradeLogs: TradeLog[] = []

// ── Config ────────────────────────────────────────────────

const TRADE_AMOUNT = 100        // NGN shares per trade
const BUY_UP_THRESHOLD = 65     // confidence score to BUY UP
const BUY_DOWN_THRESHOLD = 35   // confidence score to BUY DOWN
const MIN_SECONDS_TO_CLOSE = 60 // don't trade if market closes in less than 60s

// ── Helpers ───────────────────────────────────────────────

function generateId(): string {
  return `trade_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function secondsUntilClose(closingDate: string): number {
  return (new Date(closingDate).getTime() - Date.now()) / 1000
}

// ── Main Trade Function ───────────────────────────────────

export async function runTradeCycle(): Promise<TradeLog> {
  const signal = await getAggregatedSignal()
  const logId = generateId()

  console.log(`\n[TRADER] ── Cycle ${logId} ──`)
  console.log(`[TRADER] Confidence: ${signal.confidenceScore} | Recommendation: ${signal.recommendation}`)

  // Build base log entry
  const baseLog = {
    id: logId,
    timestamp: Date.now(),
    action: signal.recommendation,
    confidenceScore: signal.confidenceScore,
    quantScore: signal.quant.score,
    sentimentScore: signal.sentiment.score,
    mispricingScore: signal.mispricing.score,
    eventTitle: '',
    outcomeLabel: '',
    price: 0,
    amount: TRADE_AMOUNT,
    orderId: null,
    reason: '',
    status: 'HELD' as const,
  }

  // If HOLD — log and return
  if (signal.recommendation === 'HOLD') {
    const log: TradeLog = {
      ...baseLog,
      reason: `Confidence score ${signal.confidenceScore} is between thresholds (${BUY_DOWN_THRESHOLD}–${BUY_UP_THRESHOLD}). Holding.`,
      status: 'HELD',
    }
    tradeLogs.unshift(log)
    console.log(`[TRADER] HOLD — score not strong enough`)
    return log
  }

  // Find active market
  let events: BayseEvent[] = []
  try {
    events = await getActiveEvents()
  } catch (err: any) {
    const log: TradeLog = {
      ...baseLog,
      reason: `Could not fetch Bayse markets: ${err.message}`,
      status: 'FAILED',
    }
    tradeLogs.unshift(log)
    console.error(`[TRADER] Failed to fetch markets — ${err.message}`)
    return log
  }

  if (events.length === 0) {
    const log: TradeLog = {
      ...baseLog,
      reason: 'No active Bayse markets available right now',
      status: 'FAILED',
    }
    tradeLogs.unshift(log)
    console.log(`[TRADER] No active markets`)
    return log
  }

  // Pick the soonest closing market
  const event = events
    .filter(e => secondsUntilClose(e.closingDate) > MIN_SECONDS_TO_CLOSE)
    .sort((a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime())[0]

  if (!event) {
    const log: TradeLog = {
      ...baseLog,
      reason: 'All markets are closing too soon — skipping',
      status: 'HELD',
    }
    tradeLogs.unshift(log)
    console.log(`[TRADER] Markets closing too soon`)
    return log
  }

  const market = event.markets[0]
  if (!market) {
    const log: TradeLog = {
      ...baseLog,
      reason: 'No market found in event',
      status: 'FAILED',
    }
    tradeLogs.unshift(log)
    return log
  }

  // Pick outcome based on recommendation
  const isUpTrade = signal.recommendation === 'BUY_UP'
  const outcome = market.outcomes.find(o =>
    isUpTrade ? o.label === 'Up' : o.label === 'Down'
  ) ?? market.outcomes[0]

  console.log(`[TRADER] Market: "${event.title}"`)
  console.log(`[TRADER] Trading: ${outcome.label} @ ₦${outcome.price} | Amount: ${TRADE_AMOUNT} shares`)

  // Mint shares so we have inventory
  try {
    await mintShares(market.id, TRADE_AMOUNT)
    console.log(`[TRADER] Minted ${TRADE_AMOUNT} share pairs`)
  } catch (err: any) {
    console.warn(`[TRADER] Mint warning: ${err.message}`)
  }

  // Place the order
  try {
    const order = await placeOrder(
      event.id,
      market.id,
      outcome.id,
      'BUY',
      outcome.price,
      TRADE_AMOUNT
    )

    const log: TradeLog = {
      ...baseLog,
      eventTitle: event.title,
      outcomeLabel: outcome.label,
      price: outcome.price,
      orderId: order.id,
      reason: `Score ${signal.confidenceScore}/100. Quant: ${signal.quant.reason} Sentiment: ${signal.sentiment.reason} Mispricing: ${signal.mispricing.reason}`,
      status: 'EXECUTED',
    }

    tradeLogs.unshift(log)
    console.log(`[TRADER] ✓ Order placed — ID: ${order.id}`)
    return log

  } catch (err: any) {
    const log: TradeLog = {
      ...baseLog,
      eventTitle: event.title,
      outcomeLabel: outcome.label,
      price: outcome.price,
      reason: `Order failed: ${err.message}`,
      status: 'FAILED',
    }
    tradeLogs.unshift(log)
    console.error(`[TRADER] Order failed — ${err.message}`)
    return log
  }
}

// ── Portfolio Summary ─────────────────────────────────────

export async function getPortfolioSummary() {
  try {
    const [positions, openOrders] = await Promise.all([
      getPortfolio(),
      getOpenOrders(),
    ])
    return {
      positions,
      openOrderCount: openOrders.length,
      tradeCount: tradeLogs.length,
      executedTrades: tradeLogs.filter(t => t.status === 'EXECUTED').length,
      heldTrades: tradeLogs.filter(t => t.status === 'HELD').length,
      failedTrades: tradeLogs.filter(t => t.status === 'FAILED').length,
    }
  } catch (err: any) {
    return { error: err.message }
  }
}