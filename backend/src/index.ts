import express from 'express'
import cors from 'cors'
import { config } from './config'
import { initDataPipeline } from './scheduler'
import { store } from './store'

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

// Returns everything currently in the store
app.get('/data', (_, res) => {
  res.json({
    btcCurrentPrice: store.btcCurrentPrice,
    btcHistoryCount: store.btcHistory.length,
    btcHistoryLatest: store.btcHistory.slice(-3),
    ngnRate: store.ngnRate,
    newsCount: store.news.length,
    news: store.news,
    lastUpdated: store.lastUpdated,
  })
})

// Returns just the latest prices — quick snapshot
app.get('/snapshot', (_, res) => {
  const isReady = store.btcCurrentPrice > 0 && store.ngnRate !== null

  res.json({
    ready: isReady,
    btcPrice: store.btcCurrentPrice,
    usdToNgn: store.ngnRate?.usdToNgn ?? null,
    newsHeadlines: store.news.map(n => n.title),
    lastUpdated: store.lastUpdated,
  })
})

// Start pipeline then server
async function bootstrap() {
  await initDataPipeline()

  app.listen(config.port, () => {
    console.log(`[SERVER] NaijaQuant running on port ${config.port}`)
    console.log(`[SERVER] Test endpoints:`)
    console.log(`         http://localhost:${config.port}/data`)
    console.log(`         http://localhost:${config.port}/snapshot\n`)
  })
}

bootstrap()