import { useState } from 'react'
import type { GeneratedSpec, Sku } from '../types'
import PackageMockup from './mockups/PackageMockup'
import { Spinner } from './Spinner'

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

export function specToSku(spec: GeneratedSpec): Sku {
  return {
    id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: spec.name,
    tagline: spec.tagline,
    status: 'concept',
    scenario: spec.scenario,
    format: spec.format,
    ageBand: spec.ageBand,
    price: spec.price,
    waterBased: spec.waterBased,
    heroIngredients: spec.heroIngredients,
    uses: spec.uses,
    rationale: spec.rationale,
    renderPrompt: spec.renderPrompt,
  }
}

interface ProposalHeroProps {
  spec: GeneratedSpec | null
  isGenerating: boolean
  renderImage: string | null
  isRendering: boolean
  renderError?: string | null
  onAddToShelf: () => void
  onTryAgain: () => void
}

export function ProposalHero({
  spec,
  isGenerating,
  renderImage,
  isRendering,
  renderError,
  onAddToShelf,
  onTryAgain,
}: ProposalHeroProps) {
  const [showRender, setShowRender] = useState(false)
  const [added, setAdded] = useState(false)

  const handleRenderLoad = () => setShowRender(true)

  const handleAdd = () => {
    onAddToShelf()
    setAdded(true)
  }

  // Keep scrim in DOM when spec exists so it can CSS-transition out.
  // Show scrim while: actively rendering, OR photo arrived but hasn't loaded yet.
  // This prevents a bare-comp flash between "URL set" and "onLoad fires".
  const isLoadingPhoto = isRendering || (!!renderImage && !showRender)
  const hasFailed = !!renderError && !renderImage && !isRendering
  const showOverlay = isLoadingPhoto || hasFailed

  const mockupSku = spec ? specToSku(spec) : null

  return (
    <section className="rounded-2xl overflow-hidden border border-ink/8">
      <div className="md:flex">

        {/* Visual column — full-width when generating (no spec yet), 3/5 once spec arrives */}
        <div
          className={`relative bg-shell flex items-center justify-center p-6 min-h-56 ${spec ? 'md:w-3/5' : 'w-full'}`}
          aria-busy={isGenerating || isRendering}
        >
          {/* ── Layer 1: PackageMockup comp ── */}
          {mockupSku && (
            <div
              className={`absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-700 ${
                showRender
                  ? 'opacity-0'
                  : showOverlay && !hasFailed
                  ? 'opacity-40'   // dimmed under render scrim
                  : 'opacity-100'
              }`}
            >
              <PackageMockup sku={mockupSku} />
            </div>
          )}

          {/* ── Layer 2: AI render photo ── */}
          {renderImage && (
            <img
              src={renderImage}
              alt={spec?.name ?? ''}
              onLoad={handleRenderLoad}
              className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-700 drop-shadow-lg ${
                showRender ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* ── Layer 3: Generating state (no spec yet) ── */}
          {isGenerating && !spec && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Spinner size="md" />
              <span className="text-[10px] uppercase tracking-widest text-ink/50">
                Generating concept…
              </span>
            </div>
          )}

          {/* ── Layer 4: Render scrim — cream 70% + blur over comp ──
               Stays in DOM (controlled by opacity) so it crossfades out
               at the same time as the comp when showRender fires. */}
          {spec && (
            <div
              className={`absolute inset-0 bg-cream/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 transition-opacity duration-700 ${
                showOverlay && !hasFailed ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <Spinner size="md" />
              <span className="text-[10px] uppercase tracking-widest text-ink/50 text-center px-4">
                Rendering photo — ~20 seconds
              </span>
            </div>
          )}

          {/* ── Layer 5: Error scrim — replaces render scrim on failure ── */}
          {spec && (
            <div
              className={`absolute inset-0 bg-cream/85 flex flex-col items-center justify-center gap-2 transition-opacity duration-500 ${
                hasFailed ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <span className="text-[10px] uppercase tracking-widest text-clay/70">
                Render failed
              </span>
              <button
                type="button"
                onClick={onTryAgain}
                className="text-[9px] uppercase tracking-widest px-3 py-1 rounded-md border border-clay/30 text-clay/70 hover:bg-clay/10 transition-colors leading-none"
              >
                Try again
              </button>
            </div>
          )}

          {/* Render/Comp toggle — only when photo is ready */}
          {renderImage && showRender && (
            <button
              type="button"
              onClick={() => setShowRender((r) => !r)}
              className="absolute bottom-3 right-3 text-[9px] uppercase tracking-widest bg-cream/80 text-ink/60 px-2.5 py-1 rounded-md backdrop-blur-sm border border-ink/10 hover:bg-cream transition-colors"
            >
              Comp
            </button>
          )}
        </div>

        {/* Spec details — only once spec is available */}
        {spec && (
          <div className="md:w-2/5 bg-sand p-5 space-y-4 flex flex-col">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] uppercase tracking-widest bg-calendula text-cream px-2 py-0.5 rounded-sm font-semibold leading-none">
                  concept
                </span>
                {spec.scenario && (
                  <span className="text-[9px] uppercase tracking-widest text-sage font-semibold">
                    {SCENARIO_LABELS[spec.scenario]}
                  </span>
                )}
                <span className="text-[9px] text-ink/35 uppercase tracking-widest">
                  {AGE_LABELS[spec.ageBand]}
                </span>
              </div>
              <h3 className="font-display text-xl font-light uppercase tracking-wide text-ink leading-tight">
                {spec.name}
              </h3>
              {spec.tagline && (
                <p className="text-xs text-ink/55 italic leading-snug">{spec.tagline}</p>
              )}
            </div>

            <div>
              <p className="text-lg font-medium text-ink tabular-nums">${spec.price}</p>
              <p className="text-[10px] text-ink/40 leading-snug mt-0.5">{ladderLabel(spec.price)}</p>
            </div>

            {spec.heroIngredients?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-widest text-ink/40">Key ingredients</p>
                <p className="text-xs text-ink/65 italic leading-snug">
                  {spec.heroIngredients.join(', ')}
                </p>
              </div>
            )}

            {spec.uses?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-widest text-ink/40">Uses</p>
                <ul className="space-y-0.5">
                  {spec.uses.slice(0, 4).map((u) => (
                    <li key={u} className="text-xs text-ink/65 leading-snug flex gap-1.5">
                      <span className="text-ink/25 flex-shrink-0">·</span>
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {spec.rationale && (
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-widest text-ink/40">Rationale</p>
                <p className="text-xs text-ink/60 leading-relaxed">{spec.rationale}</p>
              </div>
            )}

            <div className="flex gap-2 mt-auto pt-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={added}
                className={[
                  'flex-1 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-colors',
                  added
                    ? 'bg-sage/20 text-sage cursor-default'
                    : 'bg-ink text-cream hover:bg-ink/85',
                ].join(' ')}
              >
                {added ? 'Added to shelf ✓' : 'Add to shelf'}
              </button>
              <button
                type="button"
                onClick={onTryAgain}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium tracking-wide bg-ink/10 text-ink/60 hover:bg-ink/15 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
