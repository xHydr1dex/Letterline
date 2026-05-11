'use client'

import { useEffect, useState } from 'react'

type Quote = { price: number; change: number; label: string } | null
type MarketData = { sp500: Quote; nasdaq: Quote; btc: Quote }

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function Ticker({ q, prefix = '' }: { q: Quote; prefix?: string }) {
  if (!q) return <span className="text-muted">—</span>
  const up = q.change >= 0
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-muted font-sans">{q.label}</span>
      <span className="text-dark dark:text-ink font-sans tabular-nums">
        {prefix}{fmt(q.price, q.label === 'BTC' ? 0 : 2)}
      </span>
      {q.change !== 0 && (
        <span className={`text-xs font-sans tabular-nums ${up ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
          {up ? '+' : ''}{fmt(q.change)}%
        </span>
      )}
    </span>
  )
}

export default function MarketStrip() {
  const [data, setData] = useState<MarketData | null>(null)

  useEffect(() => {
    fetch('/api/market')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="flex gap-6 mt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
      <Ticker q={data.sp500} />
      <Ticker q={data.nasdaq} />
      <Ticker q={data.btc} prefix="$" />
    </div>
  )
}
