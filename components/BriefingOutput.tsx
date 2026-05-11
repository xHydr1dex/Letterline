'use client'

interface BriefingOutputProps {
  text: string
  isStreaming: boolean
}

export default function BriefingOutput({ text, isStreaming }: BriefingOutputProps) {
  if (!text && !isStreaming) return null
  return (
    <div className="mb-10">
      <div className="border-t-2 border-navy pt-4 mb-6">
        <h2 className="text-xs font-sans font-bold text-navy tracking-widest uppercase">Your Briefing</h2>
      </div>
      <div className="font-sans text-sm text-dark leading-relaxed whitespace-pre-wrap">
        {text}
        {isStreaming && <span className="inline-block w-0.5 h-4 bg-navy ml-0.5 animate-pulse" />}
      </div>
    </div>
  )
}
