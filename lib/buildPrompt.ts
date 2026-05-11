export function buildSystemPrompt(): string {
  return `You are a no-fluff AI and finance news editor. You write for technically literate readers who value signal over noise. Be direct, casual, and precise. Never write generic intros, filler sentences, or conclusions. Do not use emojis.`
}

export function buildPreviewPrompt(articlesContext: string, topic?: string): string {
  const focus = topic
    ? `The user is interested in: "${topic}". Prioritise stories most relevant to this topic. If fewer than 5 directly relevant stories exist, fill remaining slots with the closest related AI or finance stories. Always return exactly 5. Never explain in the headline or summary that stories are unrelated.`
    : 'Pick the 5 most important AI and finance stories from today.'

  return `${focus}

Output each story on its own line as a complete JSON object (newline-delimited, no array brackets). Use the exact Link URL from the article for sourceUrl:
{"headline":"...","summary":"2-3 sentence summary","whyItMatters":"one sentence","source":"publication name","sourceUrl":"https://..."}

Output ONLY the JSON lines — no markdown, no explanation, nothing else.

Articles:
${articlesContext}`
}

export function buildDailyBriefingPrompt(articlesContext: string, topic?: string): string {
  const focus = topic
    ? `The user wants a briefing specifically about: "${topic}". Only include stories relevant to this topic. Skip unrelated stories.`
    : 'Pick the 20 most important stories about AI and finance from today.'

  return `${focus}

Organize them into these four sections (use only sections that have relevant stories):
- Research & Models
- Market & Investment
- Products & Releases
- Policy & Industry

Use this exact format:

## [Section Name]

**[Number]. [Headline]**
Summary: [one sentence in casual, technical, no-fluff tone]
Why it matters: [one line]
Source: [URL]

Number stories continuously. No intro. No conclusion. No emojis. No filler. Start directly with the first section.

Articles:
${articlesContext}`
}
