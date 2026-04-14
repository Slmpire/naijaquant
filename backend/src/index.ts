import express from 'express'
import cors from 'cors'
import { config } from './config'
import { getBTCCurrentPrice, getBTCPriceHistory } from './services/coingecko'
import { getNGNRate } from './services/exchangerate'
import { getNigerianFinanceNews } from './services/news'

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

// Day 1 test route — confirms all 3 data sources work
app.get('/test', async (_, res) => {
  try {
    const [btcPrice, ngnRate, news] = await Promise.all([
      getBTCCurrentPrice(),
      getNGNRate(),
      getNigerianFinanceNews(),
    ])
    res.json({
      btcPrice,
      ngnRate,
      newsCount: news.length,
      firstHeadline: news[0]?.title,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(config.port, () => {
  console.log(`NaijaQuant backend running on port ${config.port}`)
})