export const runtime = 'nodejs'

const US_SYMBOLS: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^DJI': 'Dow Jones',
  '^IXIC': 'Nasdaq',
  'AAPL': 'Apple',
  'MSFT': 'Microsoft',
  'NVDA': 'Nvidia',
  'GOOGL': 'Alphabet',
  'AMZN': 'Amazon',
  'META': 'Meta',
  'TSLA': 'Tesla',
  'JPM': 'JPMorgan',
  'V': 'Visa',
}

const INDIA_SYMBOLS: Record<string, string> = {
  '^NSEI': 'Nifty 50',
  '^BSESN': 'Sensex',
  'RELIANCE.NS': 'Reliance',
  'TCS.NS': 'TCS',
  'HDFCBANK.NS': 'HDFC Bank',
  'INFY.NS': 'Infosys',
  'ICICIBANK.NS': 'ICICI Bank',
  'HINDUNILVR.NS': 'HUL',
  'BHARTIARTL.NS': 'Airtel',
  'WIPRO.NS': 'Wipro',
  'KOTAKBANK.NS': 'Kotak Bank',
  'LT.NS': 'L&T',
}

async function fetchQuote(symbol: string, label: string) {
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
    const prev: number = meta.chartPreviousClose ?? price
    const change = prev ? ((price - prev) / prev) * 100 : 0
    const currency: string = meta.currency ?? 'USD'
    return { symbol, label, price, change, currency }
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const market = searchParams.get('market') === 'india' ? 'india' : 'us'
  const symbols = market === 'india' ? INDIA_SYMBOLS : US_SYMBOLS

  const results = await Promise.all(
    Object.entries(symbols).map(([sym, label]) => fetchQuote(sym, label))
  )

  const quotes = results.filter(Boolean)
  return Response.json({ market, quotes })
}
