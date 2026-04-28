import express from 'express'
import cors from 'cors'
import { config } from './config'
import { initDataPipeline } from './scheduler'
import { store } from './store'
import { getAggregatedSignal } from './signals/aggregator'
import { runTradeCycle, tradeLogs, getPortfolioSummary } from './trading/trader'
import { generateTradeExplanation } from './services/explainer'
import { getActiveEvents } from './trading/bayse'

const app = express()
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://naijaquant-f9d6d.web.app',     // your Firebase URL
    'https://naijaquant-f9d6d.firebaseapp.com', // Firebase alternate URL
  ],
  methods: ['GET', 'POST', 'DELETE'],
}))
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
    btcHistory: store.btcHistory,
    newsHeadlines: store.news.map(n => n.title),
    lastUpdated: store.lastUpdated,
  })
})

// Get aggregated trading signal, optionally filtered by Bayse event/market
app.get('/signals', async (req, res) => {
  try {
    const { eventId, marketId, eventTitle } = req.query as {
      eventId?: string
      marketId?: string
      eventTitle?: string
    }
    const signal = await getAggregatedSignal(eventId, marketId, eventTitle)
    res.json(signal)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Manually trigger one trade cycle
app.post('/trade', async (_, res) => {
  try {
    const log = await runTradeCycle()
    res.json(log)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get all trade logs
app.get('/trades', (_, res) => {
  res.json({
    total: tradeLogs.length,
    trades: tradeLogs.slice(0, 20), // last 20 trades
  })
})

// Get portfolio summary
app.get('/portfolio', async (_, res) => {
  try {
    const summary = await getPortfolioSummary()
    res.json(summary)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
 // Get active markets/events from Bayse

app.get('/markets', async (_, res) => {
  try {
    const events = await getActiveEvents()
    res.json({ events, total: events.length })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Regenerate explanation for a specific trade
app.post('/explain/:tradeId', async (req, res) => {
  try {
    const trade = tradeLogs.find(t => t.id === req.params.tradeId)
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' })
    }
    const signal = await getAggregatedSignal()
    const explanation = await generateTradeExplanation(signal, trade)
    trade.reason = explanation
    res.json({ explanation })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
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