import axios from 'axios'

export interface PricePoint {
  timestamp: number
  price: number
}

export async function getBTCPriceHistory(days = 30): Promise<PricePoint[]> {
  const res = await axios.get(
    'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
    { params: { vs_currency: 'usd', days, interval: 'daily' } }
  )
  return res.data.prices.map(([timestamp, price]: [number, number]) => ({
    timestamp,
    price,
  }))
}

export async function getBTCCurrentPrice(): Promise<number> {
  const res = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price',
    { params: { ids: 'bitcoin', vs_currencies: 'usd' } }
  )
  return res.data.bitcoin.usd
}