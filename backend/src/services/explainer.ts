import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../config'
import { AggregatedSignal } from '../signals/aggregator'
import { TradeLog } from '../trading/trader'

const genAI = new GoogleGenerativeAI(config.gemini.apiKey)

export async function generateTradeExplanation(
  signal: AggregatedSignal,
  trade: TradeLog
): Promise<string> {
  // If Gemini key is missing just return a basic explanation
  if (!config.gemini.apiKey) {
    return buildFallbackExplanation(signal, trade)
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are NaijaQuant, an AI trading bot for African prediction markets. 
Explain this trading decision in 2-3 simple sentences that a non-technical person can understand.
Be specific about the numbers. Write confidently. No bullet points, just flowing sentences.

Trade Decision: ${trade.action}
Confidence Score: ${trade.confidenceScore}/100
Status: ${trade.status}

Signal Breakdown:
- Quant Score: ${signal.quant.score}/100 (${signal.quant.direction})
  ${signal.quant.reason}
- Sentiment Score: ${signal.sentiment.score}/100 (${signal.sentiment.direction})
  Naira is ${signal.sentiment.ngnDirection}. ${signal.sentiment.reason}
- Mispricing Score: ${signal.mispricing.score}/100 (${signal.mispricing.direction})
  ${signal.mispricing.reason}

Market: ${trade.eventTitle || 'BTC 15-min market'}
Outcome: ${trade.outcomeLabel || 'N/A'} at price ${trade.price}

Write the explanation now:`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    return text || buildFallbackExplanation(signal, trade)

  } catch (err: any) {
    console.warn(`[EXPLAINER] Gemini failed — using fallback: ${err.message}`)
    return buildFallbackExplanation(signal, trade)
  }
}

function buildFallbackExplanation(signal: AggregatedSignal, trade: TradeLog): string {
  if (trade.status === 'HELD') {
    return `NaijaQuant held this cycle with a confidence score of ${trade.confidenceScore}/100 — not strong enough to trigger a trade. The quant signals showed ${signal.quant.direction.toLowerCase()} momentum while the naira was ${signal.sentiment.ngnDirection.toLowerCase()}, creating mixed signals that didn't meet the trading threshold.`
  }

  if (trade.status === 'FAILED') {
    return `NaijaQuant attempted to trade with a confidence score of ${trade.confidenceScore}/100 but the order could not be placed. The signal was ${signal.quant.direction.toLowerCase()} on quant indicators with sentiment scoring ${signal.sentiment.score}/100.`
  }

  const direction = trade.action === 'BUY_UP' ? 'upward' : 'downward'
  return `NaijaQuant placed a ${direction} bet with ${trade.confidenceScore}/100 confidence. Bitcoin's technical indicators were ${signal.quant.direction.toLowerCase()} with RSI at ${signal.quant.rsi.toFixed(1)}, the naira was ${signal.sentiment.ngnDirection.toLowerCase()} adding ${signal.sentiment.direction.toLowerCase()} sentiment, and the Bayse crowd was mispricing the ${trade.outcomeLabel} outcome by ${(signal.mispricing.gap * 100).toFixed(1)}%.`
}