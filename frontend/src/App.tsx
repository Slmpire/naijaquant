import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import Header from './components/Header'
import SignalCards from './components/SignalCards'
import TradeLog from './components/TradeLog'
import BTCChart from './components/BTCChart'
import Portfolio from './components/Portfolio'
import MarketSelector from './components/MarketSelector'
import BotControls from './components/BotControls'

const REFRESH_INTERVAL = 15000

export default function App() {
  const [snapshot, setSnapshot] = useState<any>(null)
  const [signals, setSignals] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [portfolio, setPortfolio] = useState<any>(null)
  const [markets, setMarkets] = useState<any[]>([])
  const [isTrading, setIsTrading] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Selected market state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null)
  const [selectedTitle, setSelectedTitle] = useState<string>('All Markets')
  const [botPaused, setBotPaused] = useState(false)
  

  const handlePause = async () => {
    await api.pauseBot()
    setBotPaused(true)
  }

  const handleResume = async () => {
    await api.resumeBot()
    setBotPaused(false)
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchSignals = useCallback(async () => {
    try {
      const sig = await api.getSignals(
        selectedEventId ?? undefined,
        selectedMarketId ?? undefined,
        selectedTitle
      )
      setSignals(sig)
    } catch (err) {
      console.error('Signal fetch error:', err)
    }
  }, [selectedEventId, selectedMarketId, selectedTitle])

    const fetchAll = useCallback(async () => {
  try {
    const [snap, td, port, mkt, status] = await Promise.all([
      api.getSnapshot(),
      api.getTrades(),
      api.getPortfolio(),
      api.getMarkets(),
      api.getStatus(),        // add this
    ])
    setSnapshot(snap)
    setTrades(td.trades || [])
    setPortfolio(port)
    setMarkets(mkt.events || [])
    setBotPaused(status.paused)   // add this
    setIsLive(true)
  } catch {
    setIsLive(false)
  }
}, [])

  // Fetch everything on load
  useEffect(() => {
    fetchAll()
    fetchSignals()
    const interval = setInterval(() => {
      fetchAll()
      fetchSignals()
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAll, fetchSignals])

  // Re-fetch signals whenever selected market changes
  useEffect(() => {
    fetchSignals()
  }, [selectedEventId, fetchSignals])

  const handleMarketSelect = (eventId: string, marketId: string, title: string) => {
    setSelectedEventId(eventId)
    setSelectedMarketId(marketId)
    setSelectedTitle(title)
  }

  const handleTrade = async () => {
    setIsTrading(true)
    try {
      await api.triggerTrade(
        selectedEventId ?? undefined,
        selectedMarketId ?? undefined
      )
      await fetchAll()
    } catch (err) {
      console.error('Trade error:', err)
    } finally {
      setIsTrading(false)
    }
  }

  const defaultSignal = { score: 0, direction: 'NEUTRAL', reason: 'Loading signals...' }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <Header
        btcPrice={snapshot?.btcPrice ?? 0}
        ngnRate={snapshot?.usdToNgn ?? 0}
        isLive={isLive}
      />

      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: isMobile ? '12px' : '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>

        {/* Signals */}
        {signals && (
          <SignalCards
            quant={signals.quant ?? defaultSignal}
            sentiment={signals.sentiment ?? defaultSignal}
            mispricing={signals.mispricing ?? defaultSignal}
            confidenceScore={signals.confidenceScore ?? 0}
            recommendation={signals.recommendation ?? 'HOLD'}
          />
        )}

        {/* Chart + Portfolio */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: 12,
        }}>
          <BTCChart history={snapshot?.btcHistory ?? []} />
          <Portfolio
            total={portfolio?.tradeCount ?? 0}
            executed={portfolio?.executedTrades ?? 0}
            held={portfolio?.heldTrades ?? 0}
            failed={portfolio?.failedTrades ?? 0}
            openOrders={portfolio?.openOrderCount ?? 0}
          />
        </div>

        {/* Trade Log */}
        <TradeLog
          trades={trades}
          onTriggerTrade={handleTrade}
          isTrading={isTrading}
        />

        {}
         <BotControls
    paused={botPaused}
    isTrading={isTrading}
    onPause={handlePause}
    onResume={handleResume}
    onTriggerTrade={handleTrade}
  />

         {/* Market Selector */}
        <MarketSelector
          events={markets}
          selectedEventId={selectedEventId}
          onSelect={handleMarketSelect}
          isMobile={isMobile}
        />

        {/* Selected market label */}
        {selectedEventId && (
          <div style={{
            fontSize: 12,
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ color: '#00ff88' }}>●</span>
            Showing predictions for:
            <span style={{ color: '#aaa' }}>{selectedTitle}</span>
            <span
              onClick={() => {
                setSelectedEventId(null)
                setSelectedMarketId(null)
                setSelectedTitle('All Markets')
              }}
              style={{ color: '#444', cursor: 'pointer', marginLeft: 4, textDecoration: 'underline' }}
            >
              clear
            </span>
          </div>
        )}

      </div>
    </div>
  )
}