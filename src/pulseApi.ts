
export type PulseStock = {
  symbol: string
  price: number
  change_percent: number
}

export type MarketPulseData = {
  mood: string
  nifty: {
    price: number
    change_percent: number
    above_sma50: boolean
  } | null
  breadth: {
    above_sma50: number
    total: number
    percent: number
  }
  gainers: PulseStock[]
  losers: PulseStock[]
  updated: string
  cached?: boolean
  error?: string
}

const API = 'https://pro-investment-backend.onrender.com'

export async function getPulse(): Promise<MarketPulseData> {
  const controller = new AbortController()

  const timeout = setTimeout(() => controller.abort(), 45000)

  try {
    const response = await fetch(`${API}/market-pulse`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Market API error: ${response.status}`)
    }

    const data = (await response.json()) as MarketPulseData

    if (data.error) {
      throw new Error(data.error)
    }

    if (!data.breadth) {
      throw new Error('Market breadth data unavailable')
    }

    return data
  } finally {
    clearTimeout(timeout)
  }
}
