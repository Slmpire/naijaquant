import { createHmac, createHash } from 'node:crypto'
import { config } from '../config'

const BASE_URL = 'https://relay.bayse.markets'

function sign(
  secretKey: string,
  method: string,
  path: string,
  body: string,
  timestamp: string
): string {
  const bodyHash = body
    ? createHash('sha256').update(body).digest('hex')
    : ''
  const message = `${timestamp}.${method}.${path}.${bodyHash}`
  return createHmac('sha256', secretKey).update(message).digest('base64')
}

async function request(method: string, path: string, body: object | null = null): Promise<any> {
  const bodyStr = body ? JSON.stringify(body) : ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Public-Key': config.bayse.apiKey,
  }

  if (method !== 'GET') {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signPath = path.split('?')[0]
    const signature = sign(config.bayse.secretKey, method, signPath, bodyStr, timestamp)
    headers['X-Timestamp'] = timestamp
    headers['X-Signature'] = signature
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(bodyStr ? { body: bodyStr } : {}),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bayse ${method} ${path} → ${res.status}: ${text}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

// ── Market Discovery ──────────────────────────────────────

export interface BayseOutcome {
  id: string
  label: string
  price: number
}

export interface BayseMarket {
  id: string
  outcomes: BayseOutcome[]
}

export interface BayseEvent {
  id: string
  title: string
  closingDate: string
  markets: BayseMarket[]
}

export async function getActiveEvents(seriesSlug?: string): Promise<BayseEvent[]> {
  const params = new URLSearchParams({
    status: 'open',
    currency: 'NGN',
    limit: '20',
  })
  if (seriesSlug) params.set('seriesSlug', seriesSlug)
  const data = await request('GET', `/v1/pm/events?${params}`)
  return (data.events ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    closingDate: e.closingDate,
    markets: (e.markets ?? []).map((m: any) => ({
      id: m.id,
      outcomes: [
        { id: m.outcome1Id, label: m.outcome1Label, price: m.outcome1Price },
        { id: m.outcome2Id, label: m.outcome2Label, price: m.outcome2Price },
      ],
    })),
  }))
}

// ── Orders ────────────────────────────────────────────────

export interface PlacedOrder {
  id: string
  outcomeId: string
  side: 'BUY' | 'SELL'
  price: number
  amount: number
  status: string
}

export async function placeOrder(
  eventId: string,
  marketId: string,
  outcomeId: string,
  side: 'BUY' | 'SELL',
  price: number,
  amount: number
): Promise<PlacedOrder> {
  const body = {
    outcomeId,
    side,
    price: Math.round(price * 100) / 100,
    amount,
    type: 'LIMIT',
    currency: 'NGN',
  }
  return request('POST', `/v1/pm/events/${eventId}/markets/${marketId}/orders`, body)
}

export async function cancelOrder(orderId: string): Promise<void> {
  await request('DELETE', `/v1/pm/orders/${orderId}`)
}

export async function getOpenOrders(): Promise<PlacedOrder[]> {
  const data = await request('GET', '/v1/pm/orders')
  return data.orders ?? []
}

// ── Portfolio ─────────────────────────────────────────────

export interface Position {
  outcomeId: string
  available: number
  locked: number
}

export async function getPortfolio(): Promise<Position[]> {
  const data = await request('GET', '/v1/pm/portfolio')
  return (data.outcomeBalances ?? []).map((ob: any) => ({
    outcomeId: ob.outcomeId,
    available: ob.availableBalance ?? 0,
    locked: (ob.balance ?? 0) - (ob.availableBalance ?? 0),
  }))
}

// ── Share Minting ─────────────────────────────────────────

export async function mintShares(marketId: string, quantity: number): Promise<void> {
  await request('POST', `/v1/pm/markets/${marketId}/mint`, {
    quantity,
    currency: 'NGN',
  })
}

export async function burnShares(marketId: string, quantity: number): Promise<void> {
  await request('POST', `/v1/pm/markets/${marketId}/burn`, {
    quantity,
    currency: 'NGN',
  })
}