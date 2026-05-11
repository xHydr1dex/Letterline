import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer, type DocumentProps } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { backgroundColor: '#FAF8F5', padding: 48, fontFamily: 'Helvetica' },
  masthead: {
    borderBottomWidth: 2, borderBottomColor: '#1B2B4B',
    paddingBottom: 12, marginBottom: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  brand: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B2B4B', letterSpacing: 2 },
  date: { fontSize: 10, color: '#6B6B6B' },
  queryLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1B2B4B', marginBottom: 20 },
  sectionHeader: {
    fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FAF8F5',
    backgroundColor: '#1B2B4B', paddingHorizontal: 8, paddingVertical: 4,
    marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1,
  },
  storyBlock: { marginBottom: 16, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: '#D0CFC9' },
  storyHeadline: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1A1A1A', marginBottom: 5 },
  storyLine: { fontSize: 10, color: '#1A1A1A', marginBottom: 3, lineHeight: 1.5 },
  footer: {
    position: 'absolute', bottom: 32, left: 48, right: 48,
    borderTopWidth: 0.5, borderTopColor: '#D0CFC9', paddingTop: 8,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#6B6B6B' },
})

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

type Block = { type: 'section'; title: string } | { type: 'story'; headline: string; lines: string[] }

function parseContent(text: string): Block[] {
  const blocks: Block[] = []
  const lines = text.split('\n')
  let currentStory: { headline: string; lines: string[] } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('## ')) {
      if (currentStory) { blocks.push({ type: 'story', ...currentStory }); currentStory = null }
      blocks.push({ type: 'section', title: trimmed.replace('## ', '') })
    } else if (/^\*\*\d+\./.test(trimmed)) {
      if (currentStory) blocks.push({ type: 'story', ...currentStory })
      currentStory = { headline: trimmed.replace(/\*\*/g, '').replace(/^\d+\.\s*/, ''), lines: [] }
    } else if (currentStory) {
      currentStory.lines.push(trimmed)
    }
  }
  if (currentStory) blocks.push({ type: 'story', ...currentStory })
  return blocks
}

function BriefingDocument({ briefingText, date }: { briefingText: string; date: Date }) {
  const blocks = parseContent(briefingText)

  return React.createElement(
    Document, null,
    React.createElement(
      Page, { size: 'A4', style: styles.page },
      React.createElement(View, { style: styles.masthead },
        React.createElement(Text, { style: styles.brand }, 'LETTERLINE.'),
        React.createElement(Text, { style: styles.date }, formatDate(date))
      ),
      React.createElement(Text, { style: styles.queryLabel }, 'Daily AI & Finance Briefing'),
      ...blocks.map((block, i) => {
        if (block.type === 'section') {
          return React.createElement(Text, { key: String(i), style: styles.sectionHeader }, block.title)
        }
        return React.createElement(View, { key: String(i), style: styles.storyBlock },
          React.createElement(Text, { style: styles.storyHeadline }, block.headline),
          ...block.lines.map((line, j) =>
            React.createElement(Text, { key: String(j), style: styles.storyLine }, line)
          )
        )
      }),
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, 'Sourced from 12 publications. Last 24 hours only.'),
        React.createElement(Text, { style: styles.footerText }, 'Summarized by AI. — Letterline.')
      )
    )
  )
}

export async function generateBriefingPdf(briefingText: string, _prompt: string): Promise<Buffer> {
  const doc = React.createElement(BriefingDocument, { briefingText, date: new Date() }) as unknown as React.ReactElement<DocumentProps>
  return await renderToBuffer(doc)
}
