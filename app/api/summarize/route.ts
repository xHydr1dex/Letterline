import Groq from 'groq-sdk'
import { fetchAllSources, formatArticles } from '@/lib/fetchNews'
import { buildSystemPrompt, buildDailyBriefingPrompt } from '@/lib/buildPrompt'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response('Missing prompt', { status: 400 })
    }

    const articles = await fetchAllSources()

    if (articles.length === 0) {
      return new Response('No recent articles found in the last 24 hours. Try again later.', { status: 200 })
    }

    const context = formatArticles(articles)
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildDailyBriefingPrompt(context) },
      ],
      stream: true,
      max_tokens: 1500,
      temperature: 0.3,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) controller.enqueue(encoder.encode(text))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    })
  } catch (err) {
    console.error('/api/summarize error:', err)
    return new Response('Failed to generate briefing. Please try again.', { status: 500 })
  }
}
