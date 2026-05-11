'use client'

interface PromptFormProps {
  onSubmit: (prompt: string) => void
  isLoading: boolean
}

export default function PromptForm({ onSubmit, isLoading }: PromptFormProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('prompt') as HTMLInputElement
    if (input.value.trim()) onSubmit(input.value.trim())
  }

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-serif text-navy mb-2">What would you like to know today?</h2>
      <p className="text-sm text-muted font-sans mb-5">Our AI reads everything. You get what matters.</p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          name="prompt"
          type="text"
          placeholder='e.g. "NLP in finance today" or "AI market news"'
          disabled={isLoading}
          className="flex-1 border border-gray-300 bg-white px-4 py-3 text-sm font-sans text-navy placeholder:text-muted focus:outline-none focus:border-navy disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-navy text-cream px-6 py-3 text-sm font-sans font-medium tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading ? 'Reading...' : 'Go →'}
        </button>
      </form>
    </div>
  )
}
