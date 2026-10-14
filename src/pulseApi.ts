const API = 'https://pro-investment-backend.onrender.com'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pending: Promise<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPulse(): Promise<any> {
  if (!pending) {
    pending = fetch(`${API}/market-pulse`)
      .then((r) => r.json())
      .catch((e) => {
        pending = null
        throw e
      })
  }
  return pending
}
