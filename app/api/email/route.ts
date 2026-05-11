export const runtime = 'nodejs'

import { after } from 'next/server'
import { headers } from 'next/headers'
import Groq from 'groq-sdk'
import { Resend } from 'resend'
import { fetchAllSources, formatArticles } from '@/lib/fetchNews'
import { buildSystemPrompt, buildDailyBriefingPrompt } from '@/lib/buildPrompt'
import { generateBriefingPdf } from '@/lib/generatePdf'
import { checkRateLimit } from '@/lib/rateLimit'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

async function sendBriefing(email: string, topic?: string) {
  const articles = await fetchAllSources()
  if (articles.length === 0) {
    console.warn('No articles found for briefing to', email)
    return
  }

  const context = formatArticles(articles)
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildDailyBriefingPrompt(context) },
    ],
    max_tokens: 4000,
    temperature: 0.3,
  })

  const briefingText = completion.choices[0]?.message?.content || ''
  if (!briefingText) throw new Error('Empty Groq response')

  const pdfBuffer = await generateBriefingPdf(briefingText, 'Daily AI & Finance Briefing')

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const filename = `letterline-${new Date().toISOString().split('T')[0]}.pdf`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to: email,
    subject: `Daily AI & Finance Briefing — ${date}`,
    text: 'Your daily Letterline briefing is attached.',
    attachments: [{ filename, content: pdfBuffer }],
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

export async function POST(req: Request) {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    if (!checkRateLimit(ip)) {
      return Response.json(
        { error: 'Too many requests. You can request up to 3 briefings per hour.' },
        { status: 429 }
      )
    }

    const { email, topic } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    after(async () => {
      try {
        await sendBriefing(email, topic || undefined)
      } catch (err) {
        console.error('Background briefing failed for', email, err)
      }
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('/api/email error:', err)
    return Response.json({ error: 'Unexpected error. Please try again.' }, { status: 500 })
  }
}
