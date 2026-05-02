import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const STATE_FILE = join(process.cwd(), 'bot-state.json')

interface BotState {
  paused: boolean
  pausedAt: number | null
  resumedAt: number | null
}

const defaultState: BotState = {
  paused: false,
  pausedAt: null,
  resumedAt: null,
}

export function loadBotState(): BotState {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = readFileSync(STATE_FILE, 'utf-8')
      return { ...defaultState, ...JSON.parse(raw) }
    }
  } catch {
    console.warn('[STATE] Could not read state file — using default')
  }
  return defaultState
}

export function saveBotState(state: BotState): void {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch (err) {
    console.error('[STATE] Could not save state file:', err)
  }
}