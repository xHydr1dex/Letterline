export interface RssSource {
  name: string
  url: string
}

export const RSS_SOURCES: RssSource[] = [
  // AI sources
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' },
  { name: 'Anthropic Blog', url: 'https://www.anthropic.com/rss.xml' },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Meta AI Blog', url: 'https://ai.meta.com/blog/rss/' },
  { name: 'arXiv cs.AI', url: 'https://rss.arxiv.org/rss/cs.AI' },
  { name: 'arXiv cs.LG', url: 'https://rss.arxiv.org/rss/cs.LG' },
  // US Finance sources
  { name: 'CNBC Finance', url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html' },
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
  // Indian Finance sources
  { name: 'Economic Times Markets', url: 'https://economictimes.indiatimes.com/markets/stocks/rss.cms' },
  { name: 'Economic Times Economy', url: 'https://economictimes.indiatimes.com/economy/rss.cms' },
  { name: 'Business Standard Markets', url: 'https://www.business-standard.com/rss/markets-106.rss' },
]

export const HN_ALGOLIA_URL = 'https://hn.algolia.com/api/v1/search'
