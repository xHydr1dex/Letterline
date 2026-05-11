'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Masthead from '@/components/Masthead'
import StockGrid from '@/components/StockGrid'

function detectMarket(topic: string): 'us' | 'india' | null {
  const t = topic.toLowerCase()
  if (t.match(/india|nifty|sensex|nse|bse|dalal|mumbai|rupee/)) return 'india'
  if (t.match(/us market|us stock|s&p|dow|nasdaq|nyse|wall street|american stock/)) return 'us'
  if (t.match(/stock market|share market|equity market|market today/)) return 'us'
  return null
}

type EmailStatus = 'idle' | 'loading' | 'sent' | 'error'

type Story = {
  headline: string
  summary: string
  whyItMatters: string
  source: string
  sourceUrl?: string
}

const SUGGESTIONS = ['AI and Finance news', 'LLMs and NLP', 'Robotics', 'Crypto markets', 'AI policy']

export default function Home() {
  const [topic, setTopic] = useState('')
  const [submittedTopic, setSubmittedTopic] = useState('')
  const [stories, setStories] = useState<Story[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [previewError, setPreviewError] = useState('')

  const [detectedMarket, setDetectedMarket] = useState<'us' | 'india' | null>(null)
  const [animatingChip, setAnimatingChip] = useState<string | null>(null)
  const [inputFlash, setInputFlash] = useState(false)
  const [leftWidth, setLeftWidth] = useState(42)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const onDividerMouseDown = useCallback(() => {
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.min(Math.max(pct, 25), 68))
    }
    function onMouseUp() {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  function handleChipClick(s: string) {
    setAnimatingChip(s)
    setTimeout(() => {
      setTopic(s)
      setAnimatingChip(null)
      setInputFlash(true)
      setTimeout(() => setInputFlash(false), 350)
    }, 220)
  }

  async function streamPreview(t: string) {
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t }),
      })
      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({}))
        setPreviewError(err.error || `API error ${response.status}`)
        setPreviewLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }

      const skipPhrases = [
        'none of the provided', 'no directly relevant',
        'no articles were found', 'no relevant articles',
      ]

      const found: Story[] = []
      let pos = 0
      while (pos < full.length) {
        const start = full.indexOf('{', pos)
        if (start === -1) break
        let depth = 0, end = -1
        for (let i = start; i < full.length; i++) {
          if (full[i] === '{') depth++
          else if (full[i] === '}') { depth--; if (depth === 0) { end = i; break } }
        }
        if (end === -1) break
        pos = end + 1
        try {
          const obj: Story = JSON.parse(full.slice(start, end + 1))
          if (!obj.headline) continue
          if (skipPhrases.some(p => obj.headline.toLowerCase().includes(p))) continue
          found.push(obj)
        } catch { continue }
      }

      setStories(found)
    } finally {
      setPreviewLoading(false)
    }
  }

  function handleTopicSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = topic.trim()
    if (!t) return
    setSubmittedTopic(t)
    setShowPreview(true)
    setPreviewLoading(true)
    setStories([])
    setPreviewError('')
    setEmailStatus('idle')
    setErrorMsg('')
    setDetectedMarket(detectMarket(t))
    streamPreview(t)
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('email') as HTMLInputElement
    const email = input.value.trim()
    if (!email) return

    setEmailStatus('loading')
    setErrorMsg('')

    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, topic: submittedTopic }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setEmailStatus('sent')
        else { setErrorMsg(data.error || 'Something went wrong.'); setEmailStatus('error') }
      })
      .catch(() => { setErrorMsg('Something went wrong. Please try again.'); setEmailStatus('error') })
  }

  return (
    <div ref={containerRef} className="flex min-h-screen">
      {/* Left panel */}
      <div
        style={{
          width: showPreview ? `${leftWidth}%` : '100%',
          transition: 'width 0.5s ease-in-out',
        }}
        className="overflow-y-auto border-r border-gray-200 dark:border-gray-700 flex-shrink-0"
      >
        <main className="max-w-2xl mx-auto px-6 py-12">
          <Masthead />

          {/* Step 1: Topic prompt */}
          <div className="mb-8">
            <p className="text-xs text-muted font-sans mb-1 tracking-wide uppercase">What would you like to know about today?</p>
            <form onSubmit={handleTopicSubmit} className="flex gap-2 mt-3">
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. AI and Finance, NLP breakthroughs, crypto markets..."
                disabled={previewLoading}
                className={`flex-1 border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-sans text-navy dark:text-ink placeholder:text-muted focus:outline-none focus:border-navy dark:focus:border-navy-light disabled:opacity-50 transition-colors duration-300 ${inputFlash ? 'bg-navy/5 dark:bg-navy-light/10' : 'bg-white dark:bg-surface-dark'}`}
              />
              <button
                type="submit"
                disabled={previewLoading}
                className="bg-navy dark:bg-navy-light text-cream dark:text-surface-dark px-5 py-3 text-sm font-sans font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                →
              </button>
            </form>

            {!showPreview && !topic && (
              <div className="flex flex-wrap gap-2 mt-3">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleChipClick(s)}
                    className={`text-xs font-sans font-medium text-muted border border-gray-200 dark:border-gray-700 px-4 py-1 hover:border-navy dark:hover:border-navy-light hover:text-navy dark:hover:text-navy-light hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${animatingChip === s ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Email input — appears after preview loads */}
          {showPreview && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              {submittedTopic && (
                <p className="text-xs text-muted font-sans mb-4">
                  Showing results for <span className="text-navy dark:text-navy-light font-medium">&ldquo;{submittedTopic}&rdquo;</span>
                </p>
              )}

              {emailStatus === 'sent' ? (
                <div className="border-l-2 border-navy dark:border-navy-light pl-4">
                  <p className="text-sm font-sans text-navy dark:text-navy-light font-medium">
                    Your briefing is on its way.
                  </p>
                  <p className="text-xs text-muted font-sans mt-1">
                    Check your inbox — it arrives as a PDF with all 20 stories.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-base font-serif text-navy dark:text-navy-light mb-1">
                    Like what you see?
                  </p>
                  <p className="text-xs text-muted font-sans mb-4">
                    Get all 20 stories delivered as a PDF to your inbox.
                  </p>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      disabled={emailStatus === 'loading'}
                      required
                      className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark px-4 py-3 text-sm font-sans text-navy dark:text-ink placeholder:text-muted focus:outline-none focus:border-navy dark:focus:border-navy-light disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={emailStatus === 'loading'}
                      className="bg-navy dark:bg-navy-light text-cream dark:text-surface-dark px-6 py-3 text-sm font-sans font-medium tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                    >
                      {emailStatus === 'loading' ? 'Sending...' : 'Send my briefing →'}
                    </button>
                  </form>
                  {emailStatus === 'error' && (
                    <p className="text-xs text-red-500 font-sans mt-3">{errorMsg}</p>
                  )}
                </>
              )}
            </div>
          )}

          <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 pt-6">
            <p className="text-xs text-muted font-sans">
              Sourced from 12 publications. Last 24 hours only. Summarized by AI.
            </p>
          </footer>
        </main>
      </div>

      {/* Drag divider */}
      {showPreview && (
        <div
          onMouseDown={onDividerMouseDown}
          className="w-1 flex-shrink-0 cursor-col-resize bg-gray-200 dark:bg-gray-700 hover:bg-navy dark:hover:bg-navy-light transition-colors"
        />
      )}

      {/* Right panel */}
      <div
        style={{
          width: showPreview ? `${100 - leftWidth - 0.1}%` : '0',
          opacity: showPreview ? 1 : 0,
          transition: 'width 0.5s ease-in-out, opacity 0.5s ease-in-out',
        }}
        className="overflow-hidden flex-shrink-0"
      >
        <div className="h-full overflow-y-auto px-8 py-12 min-w-0">
          <h2 className="text-xl font-serif font-bold text-navy dark:text-navy-light mb-1 tracking-wide">
            Top Stories
          </h2>
          <p className="text-xs text-muted font-sans mb-8">
            Preview — full briefing of 20 stories sent to your inbox.
          </p>

          {detectedMarket && <StockGrid market={detectedMarket} />}

          {previewLoading && stories.length === 0 ? (
            <div className="space-y-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5 mb-1" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/5 mb-3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/4" />
                </div>
              ))}
            </div>
          ) : stories.length > 0 ? (
            <div className="space-y-8">
              {stories.map((story, i) => (
                <div key={i} className="border-l-2 border-navy dark:border-navy-light pl-4">
                  <p className="text-xs text-muted font-sans font-medium mb-1 tracking-widest">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-sm font-serif font-bold text-navy dark:text-navy-light mb-2 leading-snug">
                    {story.headline}
                  </h3>
                  <p className="text-xs font-sans text-dark dark:text-ink leading-relaxed mb-2">
                    {story.summary}
                  </p>
                  <p className="text-xs font-sans text-muted italic mb-3">
                    {story.whyItMatters}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-sans text-muted border border-gray-300 dark:border-gray-600 px-2 py-0.5">
                      {story.source}
                    </span>
                    {story.sourceUrl && (
                      <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-sans text-navy dark:text-navy-light hover:underline">
                        Read →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 dark:border-gray-600 px-4 py-3">
              {previewError ? (
                <>
                  <p className="text-xs font-sans text-red-500 font-medium mb-1">Failed to load stories</p>
                  <p className="text-xs font-sans text-muted font-mono">{previewError}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-sans text-muted">
                    No stories found for <span className="text-navy dark:text-navy-light font-medium">&ldquo;{submittedTopic}&rdquo;</span> in the last 24 hours.
                  </p>
                  <p className="text-xs font-sans text-muted mt-1">
                    We cover AI and Finance news. Try &ldquo;AI agents&rdquo;, &ldquo;OpenAI&rdquo;, &ldquo;crypto markets&rdquo;, or &ldquo;Indian stocks&rdquo;.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
