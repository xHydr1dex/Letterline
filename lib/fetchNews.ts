import Parser from 'rss-parser'
import type { Article } from '@/types'
import { RSS_SOURCES, HN_ALGOLIA_URL } from '@/lib/sources'

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Letterline/1.0; +https://letterline.fyi)' },
})
const CUTOFF_MS = 24 * 60 * 60 * 1000

export function filterByLastDay(articles: Article[]): Article[] {
  const cutoff = Date.now() - CUTOFF_MS
  return articles.filter(a => {
    const date = new Date(a.pubDate).getTime()
    return !isNaN(date) && date >= cutoff
  })
}

export function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Set<string>()
  return articles.filter(a => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function formatArticles(articles: Article[]): string {
  if (articles.length === 0) return ''
  return articles
    .slice(0, 40)
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title}\nSource: ${a.source}\nDescription: ${a.description.slice(0, 200)}\nLink: ${a.link}`
    )
    .join('\n\n')
}

async function fetchRssSource(url: string, name: string): Promise<Article[]> {
  try {
    const feed = await parser.parseURL(url)
    return (feed.items || []).map(item => ({
      title: item.title || '',
      description: item.contentSnippet || item.content || '',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || '',
      source: name,
    }))
  } catch {
    return []
  }
}

async function fetchHackerNews(): Promise<Article[]> {
  try {
    const cutoffTimestamp = Math.floor((Date.now() - CUTOFF_MS) / 1000)
    const url = `${HN_ALGOLIA_URL}?tags=story&query=artificial+intelligence+OR+machine+learning+OR+LLM&hitsPerPage=15&numericFilters=created_at_i>${cutoffTimestamp}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.hits || []).map((hit: Record<string, string | number>) => ({
      title: String(hit.title || ''),
      description: String(hit.story_text || ''),
      link: String(hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`),
      pubDate: new Date(Number(hit.created_at_i) * 1000).toISOString(),
      source: 'Hacker News',
    }))
  } catch {
    return []
  }
}

export async function fetchAllSources(): Promise<Article[]> {
  const rssPromises = RSS_SOURCES.map(s => fetchRssSource(s.url, s.name))
  const results = await Promise.allSettled([...rssPromises, fetchHackerNews()])
  const articles = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))
  return deduplicateArticles(filterByLastDay(articles))
}
