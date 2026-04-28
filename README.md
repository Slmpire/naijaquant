# NaijaQuant 🇳🇬

**An AI-powered quantitative trading bot built for African prediction markets.**

NaijaQuant was built for the Bayse Markets Hackathon. It is the first trading
bot that combines classical quantitative finance signals with African
macroeconomic data to make intelligent, explainable predictions on any active
market on Bayse — not just Bitcoin.

---

## The Problem It Solves

Prediction markets in Africa are largely driven by gut feeling. Most traders
on Bayse place bets without any data advantage — they're essentially guessing.
Meanwhile, global quant trading tools are built for Wall Street and completely
ignore African economic signals like naira volatility, CBN policy changes, and
local inflation patterns.

NaijaQuant bridges that gap. It brings real quantitative finance methodology
to an African prediction market, using Nigerian economic data as a first-class
trading signal.

---

## How It Works

NaijaQuant runs three independent signal modules. Each produces a score from
0 to 100. These scores are combined into a single **Confidence Score** using a
weighted average. The confidence score drives the final trade decision.


Confidence Score = (Quant × 40%) + (Sentiment × 30%) + (Mispricing × 30%)
≥ 65  →  BUY UP
≤ 35  →  BUY DOWN
else  →  HOLD

---

### Signal 1 — Quant Engine (40% weight)

**What it does:** Analyses price history to detect momentum and trend direction.

**How it works:**
- Pulls the last 30 days of price data from the Binance public API
- Calculates three standard quant finance indicators:
  - **Moving Average Crossover** — compares the 7-day and 30-day averages.
    When the short-term average crosses above the long-term, it signals
    upward momentum
  - **RSI (Relative Strength Index)** — measures whether an asset is
    overbought (>70) or oversold (<30), indicating likely reversals
  - **Momentum Score** — measures the rate of price change over 10 periods
- Combines all three into a directional score: Bullish / Bearish / Neutral

**Data source:** Binance Public API — no key required, always free

---

### Signal 2 — Nigerian Macro Sentiment (30% weight)

**What it does:** Measures the mood of the Nigerian financial market using
live economic data and AI-powered news analysis.

**How it works:**
- Fetches the live NGN/USD exchange rate every 10 minutes and detects
  whether the naira is strengthening, stable, or weakening
- Pulls the latest Nigerian financial news headlines from GNews
- Sends both the naira direction and headlines to Google Gemini AI with
  a prompt asking it to score overall market sentiment from 0 to 100
- Falls back to a naira-direction-only calculation if the AI call fails

**Why this matters:** No global trading bot uses Nigerian economic data.
When the naira weakens sharply or CBN makes a surprise policy decision,
that directly affects how traders feel and behave on Nigerian platforms like
Bayse. NaijaQuant captures that signal.

**Data sources:** Open ExchangeRate API + GNews API + Google Gemini 1.5 Flash

---

### Signal 3 — Crowd Mispricing Detection (30% weight)

**What it does:** Finds markets where the Bayse crowd is collectively wrong
and bets against them.

**How it works:**
- Reads the live market price from Bayse for the selected market. On Bayse,
  prices are implied probabilities — a price of 0.44 means the crowd thinks
  there is a 44% chance of that outcome occurring
- Independently calculates what the probability *should* be using historical
  price movement data and recent momentum
- Compares the two. If there is a gap greater than 8 percentage points, the
  crowd is significantly mispriced
- The larger the gap, the stronger the signal

**Example:** If Bayse users are pricing BTC going up at 44% but our model
says the real probability is 58%, that 14-point gap means the crowd is
underpricing the Up outcome — and we buy it.

**This is the core of quantitative arbitrage** — finding systematic
mispricing and profiting from it.

**Data source:** Bayse Markets API

---

### AI Trade Explanation

After every trade decision — whether the bot executed, held, or skipped —
Google Gemini generates a plain English explanation of exactly why. This
makes NaijaQuant transparent and educational, not a black box.

Example explanation:
> "NaijaQuant placed an upward bet with 75/100 confidence. Bitcoin's
> technical indicators were bullish with RSI at 61 and the 7-day moving
> average sitting above the 30-day. The naira was stable while the Bayse
> crowd was underpricing the Up outcome by 13%, giving the bot a clear
> statistical edge to exploit."

---

## Market Coverage

NaijaQuant works on **any active market on Bayse** — not just Bitcoin.
The dashboard lets you select any open prediction market and instantly
see a confidence prediction tailored to that market. The sentiment and
mispricing signals are market-agnostic. The quant signal uses Bitcoin
as a global risk sentiment proxy, which correlates with overall market
confidence even for non-crypto predictions.

---

## Live Dashboard

The React dashboard updates every 15 seconds and shows:

- **Market Selector** — browse and select any active Bayse market
- **3 Signal Cards** — live scores for Quant, Sentiment, and Mispricing
- **Confidence Meter** — animated gauge needle showing the combined score
- **Trade Recommendation** — BUY UP / BUY DOWN / HOLD
- **BTC Price Chart** — 30-day area chart with trend indicator
- **Session Stats** — trade counts by status
- **Trade Journal** — every decision the bot has made with AI explanation

---

## Why It Benefits Bayse

- **Trading volume** — every bot cycle generates transactions that earn
  Bayse fee revenue
- **Market liquidity** — active orders make it easier for human traders
  to buy and sell
- **Platform credibility** — a working quant bot proves Bayse's API is
  mature enough for serious financial tooling
- **African context** — NaijaQuant brings uniquely Nigerian economic data
  onto the platform, which no other tool does

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend runtime | Node.js + TypeScript | Signal engine and API server |
| Web framework | Express | REST endpoints for the dashboard |
| Frontend | React + Vite | Live dashboard UI |
| Charts | Recharts | BTC price area chart |
| AI | Google Gemini 1.5 Flash | Sentiment scoring + trade explanations |
| Prediction market | Bayse Markets API | Market data + order placement |
| Price data | Binance Public API | BTC price history — free, no key |
| FX data | Open ExchangeRate API | Live NGN/USD rate — free |
| News | GNews API | Nigerian financial headlines |
| Scheduler | node-cron | Automated data refresh pipeline |
| Backend hosting | Google Cloud Run | Auto-scaling serverless container |
| Frontend hosting | Firebase Hosting | Global CDN, fast load times |

---

## System Architecture

┌─────────────────────────────────────────────┐
│            EXTERNAL DATA SOURCES            │
│  Binance API │ ExchangeRate API │ GNews API  │
└──────────────────────┬──────────────────────┘
│ refresh every 5–30 min
┌──────────────────────▼──────────────────────┐
│              IN-MEMORY DATA STORE           │
│   BTC history │ Current price │ NGN rate    │
│   News headlines │ Last updated timestamps  │
└──────────────────────┬──────────────────────┘
│
┌──────────────────────▼──────────────────────┐
│               SIGNAL ENGINE                 │
│                                             │
│  Quant Module     Sentiment Module          │
│  ─ MA Crossover   ─ Naira direction         │
│  ─ RSI            ─ News headlines          │
│  ─ Momentum       ─ Gemini AI scoring       │
│                                             │
│  Mispricing Module                          │
│  ─ Bayse implied probability                │
│  ─ Model probability                        │
│  ─ Gap detection                            │
└──────────────────────┬──────────────────────┘
│
┌──────────────────────▼──────────────────────┐
│           CONFIDENCE AGGREGATOR             │
│   Score = Quant×40% + Sentiment×30%        │
│                     + Mispricing×30%        │
│   ≥65 → BUY UP  │  ≤35 → BUY DOWN          │
└──────────────────────┬──────────────────────┘
│
┌──────────────────────▼──────────────────────┐
│              BAYSE TRADER                   │
│  ─ Fetches active markets                   │
│  ─ Selects optimal market and outcome       │
│  ─ Mints shares                             │
│  ─ Places limit order via Bayse API         │
└──────────────────────┬──────────────────────┘
│
┌──────────────────────▼──────────────────────┐
│           GEMINI EXPLAINER                  │
│  Generates plain English explanation        │
│  for every trade decision                   │
└──────────────────────┬──────────────────────┘
│
┌──────────────────────▼──────────────────────┐
│            REACT DASHBOARD                  │
│  Polls backend every 15 seconds             │
│  Shows signals, meter, trades, markets      │
└─────────────────────────────────────────────┘

---

## Run Locally

**Requirements:** Node.js 18+, npm

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/naijaquant
cd naijaquant

# 2. Set up backend
cd backend
cp .env.example .env
# Fill in .env with your keys (see below)
npm install
npm run dev

# 3. Set up frontend (new terminal)
cd frontend
npm install
npm run dev

# 4. Open http://localhost:5173
```

**Required environment variables** (in `backend/.env`):

```bash
BAYSE_API_KEY=pk_live_...       # From Bayse dashboard
BAYSE_SECRET_KEY=sk_live_...    # From Bayse dashboard
GEMINI_API_KEY=AIzaSy...        # From aistudio.google.com
PORT=3001
```

**Optional:**
```bash
NEWS_API_KEY=                   # GNews key for live headlines
BACKEND_URL=                    # Your Cloud Run URL for keep-alive ping
```

---

## Deployment

```bash
# Backend → Google Cloud Run
cd backend
gcloud run deploy naijaquant-backend \
  --source . --region us-central1 \
  --allow-unauthenticated --port 3001

# Frontend → Firebase Hosting
cd frontend
npm run build
firebase deploy --only hosting
```

---

## Built in 8 Days

| Day | What was built |
|---|---|
| 1 | Project scaffold, API connections verified |
| 2 | Automated data pipeline with scheduled refresh |
| 3 | Full signal engine — quant, sentiment, mispricing |
| 4 | Bayse API client and auto trader |
| 5 | Gemini AI trade explanation engine |
| 6 | Live React dashboard with market selector |
| 7 | Testing, bug fixes, mobile responsive design |
| 8 | Deployment, confidence meter, final polish |

---

## Team

built for the Bayse Markets Hackathon.

*"The first quant bot that knows the naira."* 🇳🇬