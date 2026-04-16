import { GoogleGenerativeAI } from '@google/generative-ai'
import { store } from '../store'
import { config } from '../config'

export interface SentimentSignal {
  score: number
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  ngnDirection: 'WEAKENING' | 'STABLE' | 'STRENGTHENING'
  reason: string
}

let previousNgnRate: number | null = null

function getNgnDirection(current: number): 'WEAKENING' | 'STABLE' | 'STRENGTHENING' {
  if (previousNgnRate === null) {
    previousNgnRate = current
    return 'STABLE'
  }
  const change = ((current - previousNgnRate) / previousNgnRate) * 100
  previousNgnRate = current
  if (change > 0.5) return 'WEAKENING'
  if (change < -0.5) return 'STRENGTHENING'
  return 'STABLE'
}

export async function getSentimentSignal(): Promise<SentimentSignal> {
  const ngnRate = store.ngnRate
  const headlines = store.news.map(n => n.title)

  if (!ngnRate || headlines.length === 0) {
    return {
      score: 50,
      direction: 'NEUTRAL',
      ngnDirection: 'STABLE',
      reason: 'No sentiment data available yet',
    }
  }

  const ngnDirection = getNgnDirection(ngnRate.usdToNgn)

  try {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a Nigerian financial market analyst. Analyze these inputs and return a JSON sentiment score.

NGN/USD Rate: ${ngnRate.usdToNgn} (naira is ${ngnDirection})
Recent Nigerian financial headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Return ONLY a JSON object with no extra text, no markdown, no backticks:
{
  "score": <number 0-100, where 0=very negative, 50=neutral, 100=very positive>,
  "direction": <"POSITIVE" or "NEGATIVE" or "NEUTRAL">,
  "reason": <one sentence explaining the score>
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      score: parsed.score,
      direction: parsed.direction,
      ngnDirection,
      reason: parsed.reason,
    }

  } catch (err: any) {
    // Fallback to naira direction only if AI fails
    const fallbackScore = ngnDirection === 'STRENGTHENING' ? 65
      : ngnDirection === 'WEAKENING' ? 35 : 50

    return {
      score: fallbackScore,
      direction: ngnDirection === 'STRENGTHENING' ? 'POSITIVE'
        : ngnDirection === 'WEAKENING' ? 'NEGATIVE' : 'NEUTRAL',
      ngnDirection,
      reason: `Naira is ${ngnDirection.toLowerCase()} at ₦${ngnRate.usdToNgn} per dollar`,
    }
  }
}