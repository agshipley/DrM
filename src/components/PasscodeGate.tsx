import { useState } from 'react'
import type { ReactNode } from 'react'

const EXPECTED = import.meta.env.VITE_PASSCODE || 'drmax2026'
const SESSION_KEY = 'drmax_auth'

export function PasscodeGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === EXPECTED) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setAuthed(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  if (authed) return <>{children}</>

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-2">Internal Access</p>
      <h1 className="font-display text-3xl font-light uppercase tracking-widest text-ink mb-10 leading-none">
        Dr. Max's
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError(false)
          }}
          placeholder="passcode"
          className={[
            'w-full bg-sand rounded-xl px-4 py-3 text-sm text-ink placeholder-ink/30',
            'outline-none ring-1',
            error ? 'ring-clay' : 'ring-ink/15 focus:ring-ink/40',
          ].join(' ')}
        />
        {error && (
          <p className="text-[11px] text-clay text-center">Incorrect passcode — try again</p>
        )}
        <button
          type="submit"
          className="w-full bg-ink text-cream rounded-xl px-4 py-3 text-sm uppercase tracking-widest font-medium mt-1"
        >
          Enter
        </button>
      </form>
    </div>
  )
}
