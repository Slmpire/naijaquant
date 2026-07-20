import {
  getActiveEvents,
  placeOrder,
  getOpenOrders,
  cancelOrder,
  getPortfolio,
  mintShares,
  BayseEvent,
  getEvent,
} from './bayse'
import { getAggregatedSignal, AggregatedSignal } from '../signals/aggregator'
import { generateTradeExplanation } from '../services/explainer'
import { loadBotState, saveBotState } from '../services/botState'
import { saveTradeLog, updateTradeLog, getTradeLogs } from '../services/db'

// ── Bot State — persisted to disk ─────────────────────────

const state = loadBotState()
export let botPaused = state.paused

console.log(`[BOT] Starting in ${botPaused ? '⏸ PAUSED' : '▶ RUNNING'} state`)

export function setBotPaused(value: boolean) {
  botPaused = value
  saveBotState({
    paused: value,
    pausedAt: value ? Date.now() : null,
    resumedAt: value ? null : Date.now(),
  })
  console.log(`[BOT] ${value ? '⏸ Paused — state saved to disk' : '▶ Resumed — state saved to disk'}`)
}

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
  eventId?: string
  marketId?: string
  outcomeId?: string
  exitPrice?: number
  exitTimestamp?: number
}

// Removed in-memory array in favor of persistent database logs.

// ── Config ────────────────────────────────────────────────

const TRADE_AMOUNT = 100
const MAX_ORDER_AGE_SECS = 120
const TAKE_PROFIT_PERCENT = 0.20
const STOP_LOSS_PERCENT = 0.15
const BUY_UP_THRESHOLD = 65
const BUY_DOWN_THRESHOLD = 35
const MIN_SECONDS_TO_CLOSE = 60

// ── Last Signal Store ─────────────────────────────────────

let lastSignal: AggregatedSignal | null = null

// ── Helpers ───────────────────────────────────────────────

function generateId(): string {
  return `trade_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function secondsUntilClose(closingDate: string): number {
  return (new Date(closingDate).getTime() - Date.now()) / 1000
}

// ── Main Trade Function ───────────────────────────────────

export async function runTradeCycle(): Promise<TradeLog> {

  // ── PAUSE CHECK ─────────────────────────────────────────
  if (botPaused) {
    console.log('[TRADER] Bot is paused — skipping cycle')
    const log: TradeLog = {
      id: generateId(),
      timestamp: Date.now(),
      action: 'HOLD',
      confidenceScore: 0,
      quantScore: 0,
      sentimentScore: 0,
      mispricingScore: 0,
      eventTitle: '',
      outcomeLabel: '',
      price: 0,
      amount: 0,
      orderId: null,
      reason: 'Bot is paused by user. Resume the bot to allow trading.',
      status: 'HELD',
    }
    return log
  }

  const signal = await getAggregatedSignal()
  lastSignal = signal
  const logId = generateId()

  console.log(`\n[TRADER] ── Cycle ${logId} ──`)
  console.log(`[TRADER] Confidence: ${signal.confidenceScore} | Recommendation: ${signal.recommendation}`)

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

  // ── HOLD ────────────────────────────────────────────────
  if (signal.recommendation === 'HOLD') {
    const log: TradeLog = {
      ...baseLog,
      reason: `Confidence score ${signal.confidenceScore} is between thresholds. Holding.`,
      status: 'HELD',
    }
    await saveTradeLog(log)
    generateTradeExplanation(signal, log).then(async explanation => {
      log.reason = explanation
      await updateTradeLog(log.id, { reason: explanation })
      console.log(`[EXPLAINER] ${explanation}`)
    })
    console.log(`[TRADER] HOLD — score not strong enough`)
    return log
  }

  // ── FIND MARKET ─────────────────────────────────────────
  let events: BayseEvent[] = []
  try {
    events = await getActiveEvents()
  } catch (err: any) {
    const log: TradeLog = {
      ...baseLog,
      reason: `Could not fetch Bayse markets: ${err.message}`,
      status: 'FAILED',
    }
    await saveTradeLog(log)
    console.error(`[TRADER] Failed to fetch markets — ${err.message}`)
    return log
  }

  if (events.length === 0) {
    const log: TradeLog = {
      ...baseLog,
      reason: 'No active Bayse markets available right now',
      status: 'FAILED',
    }
    await saveTradeLog(log)
    console.log(`[TRADER] No active markets`)
    return log
  }

  // Pick the soonest closing market that isn't about to close
  const event = events
    .filter(e => secondsUntilClose(e.closingDate) > MIN_SECONDS_TO_CLOSE)
    .sort((a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime())[0]

  if (!event) {
    const log: TradeLog = {
      ...baseLog,
      reason: 'All markets are closing too soon — skipping',
      status: 'HELD',
    }
    await saveTradeLog(log)
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
    await saveTradeLog(log)
    return log
  }

  // Pick outcome based on recommendation
  const isUpTrade = signal.recommendation === 'BUY_UP'
  const outcome = market.outcomes.find(o =>
    isUpTrade ? o.label === 'Up' : o.label === 'Down'
  ) ?? market.outcomes[0]

  console.log(`[TRADER] Market: "${event.title}"`)
  console.log(`[TRADER] Trading: ${outcome.label} @ ₦${outcome.price} | Amount: ${TRADE_AMOUNT} shares`)

  // Mint shares
  try {
    await mintShares(market.id, TRADE_AMOUNT)
    console.log(`[TRADER] Minted ${TRADE_AMOUNT} share pairs`)
  } catch (err: any) {
    console.warn(`[TRADER] Mint warning: ${err.message}`)
  }

  // ── PLACE ORDER ─────────────────────────────────────────
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
      reason: `Score ${signal.confidenceScore}/100 — generating explanation...`,
      status: 'EXECUTED',
      eventId: event.id,
      marketId: market.id,
      outcomeId: outcome.id,
    }

    await saveTradeLog(log)
    console.log(`[TRADER] ✓ Order placed — ID: ${order.id}`)

    generateTradeExplanation(signal, log).then(async explanation => {
      log.reason = explanation
      await updateTradeLog(log.id, { reason: explanation })
      console.log(`[EXPLAINER] ${explanation}`)
    })

    return log

  } catch (err: any) {
    const log: TradeLog = {
      ...baseLog,
      eventTitle: event.title,
      outcomeLabel: outcome.label,
      price: outcome.price,
      reason: `Order failed: ${err.message}`,
      status: 'FAILED',
      eventId: event.id,
      marketId: market.id,
      outcomeId: outcome.id,
    }

    await saveTradeLog(log)
    console.error(`[TRADER] Order failed — ${err.message}`)

    if (lastSignal) {
      generateTradeExplanation(lastSignal, log).then(async explanation => {
        const fullReason = explanation + ` (Order error: ${err.message})`
        log.reason = fullReason
        await updateTradeLog(log.id, { reason: fullReason })
      })
    }

    return log
  }
}

// ── Portfolio Summary ─────────────────────────────────────

export async function getPortfolioSummary() {
  try {
    const [positions, openOrders, dbTrades] = await Promise.all([
      getPortfolio(),
      getOpenOrders(),
      getTradeLogs(500),
    ])
    return {
      positions,
      openOrderCount: openOrders.length,
      tradeCount: dbTrades.length,
      executedTrades: dbTrades.filter(t => t.status === 'EXECUTED').length,
      heldTrades: dbTrades.filter(t => t.status === 'HELD').length,
      failedTrades: dbTrades.filter(t => t.status === 'FAILED').length,
      botPaused,
    }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ── Risk Management ───────────────────────────────────────

export async function cleanupStaleOrders() {
  if (botPaused) return
  
  try {
    const openOrders = await getOpenOrders()
    if (openOrders.length === 0) return

    const dbTrades = await getTradeLogs(100)
    
    for (const openOrder of openOrders) {
      const match = dbTrades.find(t => t.orderId === openOrder.id)
      if (match) {
        const ageSecs = (Date.now() - match.timestamp) / 1000
        if (ageSecs > MAX_ORDER_AGE_SECS) {
          console.log(`[RISK] Order ${openOrder.id} is stale (${ageSecs.toFixed(0)}s > ${MAX_ORDER_AGE_SECS}s). Cancelling...`)
          try {
            await cancelOrder(openOrder.id)
            await updateTradeLog(match.id, {
              status: 'FAILED',
              reason: match.reason + ` (Canceled by Risk Manager: stale after ${ageSecs.toFixed(0)}s)`
            })
            console.log(`[RISK] ✓ Canceled stale order ${openOrder.id}`)
          } catch (cancelErr: any) {
            console.error(`[RISK] Failed to cancel order ${openOrder.id}:`, cancelErr.message)
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[RISK] Error during stale order cleanup:', err.message)
  }
}

export async function managePositionRisks() {
  if (botPaused) return

  try {
    const positions = await getPortfolio()
    const activePositions = positions.filter(p => p.available > 0)
    if (activePositions.length === 0) return

    // Fetch top 20 active events first to map prices
    const activeEvents = await getActiveEvents()
    const outcomePriceMap = new Map<string, { price: number; eventId: string; marketId: string; title: string }>()
    
    for (const event of activeEvents) {
      for (const market of event.markets) {
        for (const outcome of market.outcomes) {
          outcomePriceMap.set(outcome.id, {
            price: outcome.price,
            eventId: event.id,
            marketId: market.id,
            title: event.title,
          })
        }
      }
    }

    const dbTrades = await getTradeLogs(200)

    for (const position of activePositions) {
      // Find open database trade log for this outcome (status EXECUTED, exitTimestamp undefined/null)
      const trade = dbTrades.find(t => 
        t.outcomeId === position.outcomeId && 
        t.status === 'EXECUTED' && 
        !t.exitTimestamp
      )

      if (trade) {
        let currentInfo = outcomePriceMap.get(position.outcomeId)
        
        // Fallback: fetch details directly if it fell off active list
        if (!currentInfo && trade.eventId && trade.marketId) {
          try {
            const e = await getEvent(trade.eventId)
            const m = e.markets.find((m: any) => m.id === trade.marketId)
            const o = m?.outcomes.find((o: any) => o.id === position.outcomeId)
            if (o) {
              currentInfo = {
                price: o.price,
                eventId: e.id,
                marketId: m!.id,
                title: e.title,
              }
            }
          } catch (fallbackErr: any) {
            console.warn(`[RISK] Fallback fetch failed for event ${trade.eventId}:`, fallbackErr.message)
          }
        }

        if (currentInfo) {
          const currentPrice = currentInfo.price
          const entryPrice = trade.price
          
          const profitPct = (currentPrice - entryPrice) / entryPrice
          const lossPct = (entryPrice - currentPrice) / entryPrice

          const isTakeProfit = profitPct >= TAKE_PROFIT_PERCENT
          const isStopLoss = lossPct >= STOP_LOSS_PERCENT

          if (isTakeProfit || isStopLoss) {
            const triggerType = isTakeProfit ? 'Take Profit' : 'Stop Loss'
            const pctText = isTakeProfit ? `+${(profitPct * 100).toFixed(1)}%` : `-${(lossPct * 100).toFixed(1)}%`
            console.log(`[RISK] Triggered ${triggerType} (${pctText}) on ${position.outcomeId}. Entry: ₦${entryPrice}, Current: ₦${currentPrice}. Liquidating ${position.available} shares...`)

            try {
              // Place SELL orders
              const sellOrder = await placeOrder(
                currentInfo.eventId,
                currentInfo.marketId,
                position.outcomeId,
                'SELL',
                currentPrice,
                position.available
              )

              // Record trade exits in db
              await updateTradeLog(trade.id, {
                exitPrice: currentPrice,
                exitTimestamp: Date.now(),
                reason: trade.reason + ` \n[RISK EXIT] Liquidated position via ${triggerType} at ₦${currentPrice} (${pctText})`
              })

              console.log(`[RISK] ✓ Exited position. Order ID: ${sellOrder.id}`)
            } catch (exitErr: any) {
              console.error(`[RISK] Failed to execute liquidation:`, exitErr.message)
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[RISK] Error in managePositionRisks:', err.message)
  }
}