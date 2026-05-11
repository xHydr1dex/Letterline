'use client'

import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import MarketStrip from './MarketStrip'

export default function Masthead() {
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }))
  }, [])

  return (
    <header className="border-b-2 border-navy dark:border-navy-light pb-4 mb-10">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-serif font-bold text-navy dark:text-navy-light tracking-widest">
          LETTERLINE.
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted font-sans">{date}</span>
          <ThemeToggle />
        </div>
      </div>
      <p className="text-xs text-muted font-sans mt-1">AI-curated market and technology briefings without the noise.</p>
      <MarketStrip />
    </header>
  )
}
