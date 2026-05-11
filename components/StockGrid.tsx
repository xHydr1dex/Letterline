'use client'

import { useEffect, useState } from 'react'

type Quote = {
  symbol: string
  label: string
  price: number
  change: number
  currency: string
}

const INDEX_SYMBOLS = ['^GSPC', '^DJI', '^IXIC', '^NSEI', '^BSESN']

function formatPrice(price: number, currency: string) {
  const sym = currency === 'INR' ? '₹' : '$'
  if (price >= 10000) return `${sym}${Math.round(price).toLocaleString()}`
  return `${sym}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StockCard({ q }: { q: Quote }) {
  const up = q.change >= 0
  const isIndex = INDEX_SYMBOLS.includes(q.symbol)
  return (
    <div className="border border-gray-400 dark:border-gray-700 p-2">
      <p className={`text-xs font-sans truncate leading-tight ${isIndex ? 'text-navy dark:text-navy-light font-semibold' : 'text-muted'}`}>
        {q.label}
      </p>
      <p className="text-xs font-sans font-medium tabular-nums mt-1 text-dark dark:text-ink truncate">
        {formatPrice(q.price, q.currency)}
      </p>
      <p className={`text-xs font-sans tabular-nums mt-0.5 ${up ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
        {up ? '+' : ''}{q.change.toFixed(2)}%
      </p>
    </div>
  )
}

export default function StockGrid({ market }: { market: 'us' | 'india' }) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/stocks?market=${market}`)
      .then(r => r.json())
      .then(data => { setQuotes(data.quotes ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [market])

  const title = market === 'india' ? 'Indian Markets' : 'US Markets'

  if (loading) {
    return (
      <div className="mb-8">
        <p className="text-xs text-muted font-sans uppercase tracking-widest mb-3">{title}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border border-gray-400 dark:border-gray-700 p-2 animate-pulse">
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (quotes.length === 0) return null

  return (
    <div className="mb-8">
      <p className="text-xs text-muted font-sans uppercase tracking-widest mb-3">{title}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {quotes.map(q => <StockCard key={q.symbol} q={q} />)}
      </div>
      <p className="text-xs text-muted font-sans mt-2">Prices delayed ~15 min</p>
    </div>
  )
}
