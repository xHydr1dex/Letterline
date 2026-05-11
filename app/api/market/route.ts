export const runtime = 'nodejs'

type Quote = { price: number; change: number; label: string } | null

async function fetchYahoo(symbol: string, label: string): Promise<Quote> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const price: number = meta.regularMarketPrice
    const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = prev ? ((price - prev) / prev) * 100 : 0
    return { price, change, label }
  } catch {
    return null
  }
}

async function fetchBtc(): Promise<Quote> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const price = parseFloat(data.data?.amount)
    if (isNaN(price)) return null
    return { price, change: 0, label: 'BTC' }
  } catch {
    return null
  }
}

export async function GET() {
  const [sp500, nasdaq, btc] = await Promise.all([
    fetchYahoo('^GSPC', 'S&P 500'),
    fetchYahoo('^IXIC', 'NASDAQ'),
    fetchBtc(),
  ])
  return Response.json({ sp500, nasdaq, btc })
}
