'use client'

interface EmailFormProps {
  onSend: (email: string) => void
  status: 'idle' | 'sending' | 'sent' | 'error'
}

export default function EmailForm({ onSend, status }: EmailFormProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('email') as HTMLInputElement
    if (input.value.trim()) onSend(input.value.trim())
  }

  if (status === 'sent') {
    return (
      <div className="border-t border-gray-200 pt-6">
        <p className="text-sm text-navy font-sans">Briefing sent. Check your inbox.</p>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <p className="text-xs text-muted font-sans mb-3 uppercase tracking-wide">Get this in your inbox</p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          name="email"
          type="email"
          placeholder="your@email.com"
          disabled={status === 'sending'}
          className="flex-1 border border-gray-300 bg-white px-4 py-2.5 text-sm font-sans text-navy placeholder:text-muted focus:outline-none focus:border-navy disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="bg-navy text-cream px-5 py-2.5 text-sm font-sans font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {status === 'sending' ? 'Sending...' : 'Send Briefing'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-red-600 mt-2">Failed to send. Copy the briefing text above manually.</p>
      )}
    </div>
  )
}
