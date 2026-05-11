'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="text-xs font-sans text-muted hover:text-navy dark:hover:text-navy-light border border-gray-300 dark:border-gray-600 px-2 py-1 transition-colors"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}
