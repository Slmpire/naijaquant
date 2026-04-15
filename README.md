# NaijaQuant

AI-powered trading bot for Bayse Markets combining Bitcoin quant signals, 
Nigerian naira sentiment, and crowd mispricing detection.

## Stack
- Backend: Node.js + TypeScript + Express
- Frontend: React + Vite + Recharts
- APIs: Bayse Markets, CoinGecko, ExchangeRate, Anthropic Claude

## Setup
1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your keys
3. `cd backend && npm install && npm run dev`
4. `cd frontend && npm install && npm run dev`

## Architecture
- `/backend` - Signal engine, Bayse trader, REST API
- `/frontend` - Live dashboard