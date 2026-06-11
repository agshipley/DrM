export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'
  return (
    <svg className={`${cls} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="text-ink/20" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-ink/50"
      />
    </svg>
  )
}
