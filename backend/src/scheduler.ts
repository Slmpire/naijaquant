import cron from 'node-cron'
import { getBTCPriceHistory, getBTCCurrentPrice } from './services/coingecko'
import { getNGNRate } from './services/exchangerate'
import { getNigerianFinanceNews } from './services/news'
import { store } from './store'

async function refreshBTC() {
  try {
    const [history, currentPrice] = await Promise.all([
      getBTCPriceHistory(30),
      getBTCCurrentPrice(),
    ])
    store.btcHistory = history
    store.btcCurrentPrice = currentPrice
    store.lastUpdated.btc = Date.now()
    console.log(`[BTC] Updated — $${currentPrice.toLocaleString()}`)
  } catch (err: any) {
    console.error(`[BTC] Fetch failed — ${err.message}`)
  }
}

async function refreshFX() {
  try {
    const rate = await getNGNRate()
    store.ngnRate = rate
    store.lastUpdated.fx = Date.now()
    console.log(`[FX] Updated — $1 = ₦${rate.usdToNgn.toLocaleString()}`)
  } catch (err: any) {
    console.error(`[FX] Fetch failed — ${err.message}`)
  }
}

async function refreshNews() {
  try {
    const headlines = await getNigerianFinanceNews()
    store.news = headlines
    store.lastUpdated.news = Date.now()
    console.log(`[NEWS] Updated — ${headlines.length} headlines loaded`)
  } catch (err: any) {
    console.error(`[NEWS] Fetch failed — ${err.message}`)
  }
}

export async function initDataPipeline() {
  console.log('\n[PIPELINE] Starting initial data fetch...\n')

  // Fetch everything immediately on startup
  await Promise.all([refreshBTC(), refreshFX(), refreshNews()])

  console.log('\n[PIPELINE] Initial fetch complete. Scheduling refreshes...\n')

  // BTC price — every 5 minutes
  cron.schedule('*/5 * * * *', refreshBTC)

  // BTC history — every 1 hour (doesn't change much)
  cron.schedule('0 * * * *', () => getBTCPriceHistory(30).then(h => {
    store.btcHistory = h
    store.lastUpdated.btc = Date.now()
  }))

  // FX rate — every 10 minutes
  cron.schedule('*/10 * * * *', refreshFX)

  // News — every 30 minutes
  cron.schedule('*/30 * * * *', refreshNews)

  console.log('[PIPELINE] Schedules active:')
  console.log('  • BTC price    → every 5 minutes')
  console.log('  • BTC history  → every 1 hour')
  console.log('  • NGN/USD rate → every 10 minutes')
  console.log('  • News         → every 30 minutes\n')
}