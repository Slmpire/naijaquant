import { PricePoint } from './services/coingecko'
import { FXRate } from './services/exchangerate'
import { NewsHeadline } from './services/news'

export interface DataStore {
  btcHistory: PricePoint[]
  btcCurrentPrice: number
  ngnRate: FXRate | null
  news: NewsHeadline[]
  lastUpdated: {
    btc: number | null
    fx: number | null
    news: number | null
  }
}

export const store: DataStore = {
  btcHistory: [],
  btcCurrentPrice: 0,
  ngnRate: null,
  news: [],
  lastUpdated: {
    btc: null,
    fx: null,
    news: null,
  },
}