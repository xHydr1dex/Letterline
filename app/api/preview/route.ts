export const runtime = 'nodejs'

import Groq from 'groq-sdk'
import { fetchAllSources, formatArticles } from '@/lib/fetchNews'
import { buildSystemPrompt, buildPreviewPrompt } from '@/lib/buildPrompt'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const topic: string | undefined = body.topic || undefined

    const articles = await fetchAllSources()
    if (articles.length === 0) {
      return Response.json({ error: 'No articles found.' }, { status: 500 })
    }

    const context = formatArticles(articles)
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildPreviewPrompt(context, topic) },
      ],
      max_tokens: 1500,
      temperature: 0.3,
      stream: true,
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
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('/api/preview error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
