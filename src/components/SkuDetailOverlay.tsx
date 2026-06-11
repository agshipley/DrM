import { useEffect, useRef } from 'react'
import type { Sku } from '../types'
import SkuVisual from './SkuVisual'

const PRICE_LADDER = [
  { name: 'Nipple Balm', price: 15 },
  { name: 'Baby Balm', price: 18 },
  { name: 'Diaper Ointment', price: 20 },
  { name: 'Salve-All', price: 22 },
]

function ladderLabel(price: number): string {
  const below = PRICE_LADDER.filter((p) => p.price < price)
  const above = PRICE_LADDER.filter((p) => p.price > price)
  if (below.length === 0 && above.length === 0) return 'matches hero price'
  if (below.length === 0) return `below ${above[0].name} ($${above[0].price})`
  if (above.length === 0) return `above ${below[below.length - 1].name} ($${below[below.length - 1].price})`
  return `between ${below[below.length - 1].name} ($${below[below.length - 1].price}) and ${above[0].name} ($${above[0].price})`
}

const SCENARIO_LABELS: Record<string, string> = {
  'all-branch': 'Phase 1',
  velocity: 'Velocity',
  duration: 'Duration',
}

const AGE_LABELS: Record<string, string> = {
  '0-12m': '0–12m',
  '1-3y': '1–3y',
  '0-3y': '0–3y',
  adult: 'Adult',
  family: 'Family',
}

interface SkuDetailOverlayProps {
  sku: Sku
  renderUrl: string | null
  heroRenderUrl?: string | null
  onClose: () => void
}

export function SkuDetailOverlay({ sku, renderUrl, heroRenderUrl, onClose }: SkuDetailOverlayProps) {
  // Hero overlay uses the plate-composited image; falls back to card render or SVG visual
  const heroSrc = heroRenderUrl ?? renderUrl
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isConcept = sku.status === 'concept'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={sku.name}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet: bottom sheet on mobile, centered card on md+ */}
      <div className="relative z-10 w-full md:max-w-3xl md:mx-4 bg-cream rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl max-h-[92vh]">

        {/* Close */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-ink/10 text-ink/50 hover:bg-ink/20 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Image — hero composite fills the column; falls back to card render or SVG */}
        <div className={`md:w-5/12 flex-shrink-0 relative overflow-hidden ${heroSrc ? 'bg-transparent' : 'bg-shell flex items-center justify-center p-6'} min-h-52 max-h-64 md:max-h-none md:min-h-0`}>
          {heroSrc ? (
            <img
              src={heroSrc}
              alt={sku.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-40 h-48">
              <SkuVisual sku={sku} />
            </div>
          )}
          {isConcept && (
            <span className="absolute top-3 left-3 text-[9px] uppercase tracking-widest font-semibold bg-calendula text-cream px-1.5 py-0.5 rounded-sm leading-none">
              concept
            </span>
          )}
          {sku.waterBased && (
            <span
              className="absolute bottom-3 left-3 text-base leading-none opacity-60"
              title="Water-based — gated by preservative decision"
            >
              🔒
            </span>
          )}
        </div>

        {/* Details — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 pr-8">
            {isConcept && sku.scenario && (
              <span className="text-[9px] uppercase tracking-widest bg-calendula/15 text-calendula px-2 py-0.5 rounded-full font-semibold">
                {SCENARIO_LABELS[sku.scenario] ?? sku.scenario}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-widest bg-ink/8 text-ink/50 px-2 py-0.5 rounded-full">
              {AGE_LABELS[sku.ageBand] ?? sku.ageBand}
            </span>
            <span className="text-[9px] uppercase tracking-widest bg-ink/8 text-ink/50 px-2 py-0.5 rounded-full">
              {sku.format}
            </span>
            {sku.waterBased && (
              <span className="text-[9px] uppercase tracking-widest bg-clay/15 text-clay px-2 py-0.5 rounded-full">
                water-based
              </span>
            )}
          </div>

          {/* Name + tagline */}
          <div>
            <h2 className="font-display text-2xl font-light uppercase tracking-wide text-ink leading-tight">
              {sku.name}
            </h2>
            {sku.tagline && (
              <p className="text-sm text-ink/55 italic mt-1 leading-snug">{sku.tagline}</p>
            )}
          </div>

          {/* Price + ladder context */}
          {sku.price != null && (
            <div>
              <p className="text-xl font-medium text-ink tabular-nums">${sku.price}</p>
              <p className="text-[10px] text-ink/40 mt-0.5">{ladderLabel(sku.price)}</p>
            </div>
          )}

          {/* Key Ingredients */}
          {sku.heroIngredients && sku.heroIngredients.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-ink/40">Key Ingredients</p>
              <p className="text-sm text-ink/65 italic leading-snug">
                {sku.heroIngredients.join(', ')}
              </p>
            </div>
          )}

          {/* Uses */}
          {sku.uses && sku.uses.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-ink/40">Uses</p>
              <ul className="space-y-0.5">
                {sku.uses.map((u) => (
                  <li key={u} className="text-sm text-ink/65 leading-snug flex gap-2">
                    <span className="text-ink/25 flex-shrink-0">·</span>
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rationale */}
          {sku.rationale && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-ink/40">Rationale</p>
              <p className="text-sm text-ink/60 leading-relaxed">{sku.rationale}</p>
            </div>
          )}

          {/* Regulatory */}
          {sku.regulatory && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-ink/40">Regulatory</p>
              <p className="text-xs text-ink/50 leading-relaxed">{sku.regulatory}</p>
            </div>
          )}

          {/* Water-based gate callout */}
          {sku.waterBased && (
            <div className="bg-clay/8 rounded-xl px-4 py-3">
              <p className="text-[10px] text-clay/80 leading-relaxed">
                🔒 Gated — requires the Refined preservative-promise path to proceed.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
