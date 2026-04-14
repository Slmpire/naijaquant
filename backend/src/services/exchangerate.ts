import axios from 'axios'

export interface FXRate {
  usdToNgn: number
  timestamp: number
}

export async function getNGNRate(): Promise<FXRate> {
  const res = await axios.get(
    'https://open.er-api.com/v6/latest/USD'
  )
  return {
    usdToNgn: res.data.rates.NGN,
    timestamp: Date.now(),
  }
}