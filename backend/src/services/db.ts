import { Firestore } from '@google-cloud/firestore'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { TradeLog } from '../trading/trader'

const JSON_FILE = join(process.cwd(), 'trades-db.json')
let firestore: Firestore | null = null

// Auto-detect Firestore configuration
const isFirestoreAvailable = !!(
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.K_SERVICE || // Set dynamically in Cloud Run
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.FIRESTORE_EMULATOR_HOST
)

if (isFirestoreAvailable) {
  try {
    firestore = new Firestore()
    console.log('[DB] Firestore client initialized successfully.')
  } catch (err: any) {
    console.warn(`[DB] Firestore initialization warning: ${err.message}. Falling back to Local JSON mode.`)
    firestore = null
  }
} else {
  console.log('[DB] Running in Local JSON mode (trades-db.json)')
}

// Local JSON fallback store
let localTrades: TradeLog[] = []

function loadLocalTrades(): TradeLog[] {
  try {
    if (existsSync(JSON_FILE)) {
      const raw = readFileSync(JSON_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (err: any) {
    console.error('[DB] Failed to read local trades JSON:', err.message)
  }
  return []
}

function saveLocalTrades(trades: TradeLog[]) {
  try {
    writeFileSync(JSON_FILE, JSON.stringify(trades, null, 2), 'utf-8')
  } catch (err: any) {
    console.error('[DB] Failed to write local trades JSON:', err.message)
  }
}

// Initial load if running in JSON mode on start
if (!firestore) {
  localTrades = loadLocalTrades()
}

export async function saveTradeLog(log: TradeLog): Promise<void> {
  if (firestore) {
    try {
      await firestore.collection('trades').doc(log.id).set(log)
      console.log(`[DB] Trade log ${log.id} saved to Firestore`)
      return
    } catch (err: any) {
      console.error(`[DB] Firestore save error: ${err.message}. Falling back to Local JSON.`)
    }
  }

  // Prepend to array
  localTrades = loadLocalTrades()
  localTrades.unshift(log)
  saveLocalTrades(localTrades)
  console.log(`[DB] Trade log ${log.id} saved to trades-db.json`)
}

export async function updateTradeLog(id: string, updates: Partial<TradeLog>): Promise<void> {
  if (firestore) {
    try {
      await firestore.collection('trades').doc(id).update(updates)
      console.log(`[DB] Trade log ${id} updated in Firestore`)
      return
    } catch (err: any) {
      console.error(`[DB] Firestore update error: ${err.message}. Falling back to Local JSON update.`)
    }
  }

  localTrades = loadLocalTrades()
  const idx = localTrades.findIndex(t => t.id === id)
  if (idx !== -1) {
    localTrades[idx] = { ...localTrades[idx], ...updates }
    saveLocalTrades(localTrades)
    console.log(`[DB] Trade log ${id} updated in trades-db.json`)
  } else {
    console.warn(`[DB] Trade log ${id} not found locally for update`)
  }
}

export async function getTradeLogs(limit = 100): Promise<TradeLog[]> {
  if (firestore) {
    try {
      const snapshot = await firestore.collection('trades')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get()

      const results: TradeLog[] = []
      snapshot.forEach(doc => {
        results.push(doc.data() as TradeLog)
      })
      return results
    } catch (err: any) {
      console.error(`[DB] Firestore fetch error: ${err.message}. Falling back to Local JSON.`)
    }
  }

  localTrades = loadLocalTrades()
  return localTrades.slice(0, limit)
}
