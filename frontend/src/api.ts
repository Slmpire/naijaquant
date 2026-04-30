import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://naijaquant-backend-575071861522.us-central1.run.app'

export const api = {
  getSnapshot: () => axios.get(`${BASE}/snapshot`).then(r => r.data),
  getSignals: (eventId?: string, marketId?: string, eventTitle?: string) => {
    const params = new URLSearchParams()
    if (eventId) params.set('eventId', eventId)
    if (marketId) params.set('marketId', marketId)
    if (eventTitle) params.set('eventTitle', eventTitle)
    return axios.get(`${BASE}/signals?${params}`).then(r => r.data)
  },
  getTrades: () => axios.get(`${BASE}/trades`).then(r => r.data),
  getPortfolio: () => axios.get(`${BASE}/portfolio`).then(r => r.data),
  getMarkets: () => axios.get(`${BASE}/markets`).then(r => r.data),
  triggerTrade: (eventId?: string, marketId?: string) => {
    return axios.post(`${BASE}/trade`, { eventId, marketId }).then(r => r.data)
  },
  getStatus: () => fetch(`${BASE}/status`).then(r => r.json()),
  pauseBot: () => fetch(`${BASE}/pause`, { method: 'POST' }).then(r => r.json()),
  resumeBot: () => fetch(`${BASE}/resume`, { method: 'POST' }).then(r => r.json()),
}