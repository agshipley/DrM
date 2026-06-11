import type { Sku } from '../types'
import SkuVisual from './SkuVisual'

const AGE_BAND_LABELS: Record<string, string> = {
  '0-12m': '0–12m',
  '1-3y': '1–3y',
  '0-3y': '0–3y',
  adult: 'Adult',
  family: 'Family',
}

const AGE_BAND_COLOR: Record<string, string> = {
  '0-12m': 'bg-sage',
  '1-3y': 'bg-sage',
  '0-3y': 'bg-sage',
  adult: 'bg-clay',
  family: 'bg-ink',
}

const SCENARIO_LABELS: Record<string, string> = {
  'all-branch': 'Phase 1',
  velocity: 'Velocity',
  duration: 'Duration',
}

interface SkuCardProps {
  sku: Sku
  renderUrl?: string | null
  isRendering?: boolean
  onRender?: () => void
  onClick?: () => void
}

export function SkuCard({ sku, renderUrl, isRendering, onRender, onClick }: SkuCardProps) {
  const isConcept = sku.status === 'concept'
  const isGated = sku.waterBased === true

  return (
    <article
      className={[
        'relative flex flex-col rounded-2xl p-4 gap-3 select-none',
        'bg-sand',
        isConcept ? 'ring-1 ring-calendula/30' : '',
        onClick
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-[transform,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-cream'
          : '',
      ].join(' ')}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View details for ${sku.name}` : undefined}
      onClick={onClick}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick() } }}
    >
      {/* Concept badge */}
      {isConcept && (
        <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest font-semibold bg-calendula text-cream px-1.5 py-0.5 rounded-sm leading-none">
          concept
        </span>
      )}

      {/* Visual */}
      <div className="relative h-32 overflow-hidden">
        {renderUrl ? (
          <img
            src={renderUrl}
            alt={sku.name}
            className="w-full h-full object-contain drop-shadow-md"
          />
        ) : (
          <SkuVisual sku={sku} />
        )}

        {/* Render in-progress overlay */}
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-shell/70">
            <span className="text-[8px] uppercase tracking-widest text-ink/40 animate-pulse">
              rendering…
            </span>
          </div>
        )}

        {/* Render button */}
        {!renderUrl && !isRendering && onRender && sku.renderPrompt && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRender() }}
            className="absolute bottom-1.5 right-1.5 text-[8px] uppercase tracking-widest bg-cream/80 backdrop-blur-sm text-ink/50 px-1.5 py-0.5 rounded border border-ink/10 hover:bg-cream transition-colors leading-none"
          >
            Render
          </button>
        )}

        {/* Lock badge */}
        {isGated && !isRendering && (
          <span
            className="absolute bottom-1 left-1 text-base leading-none opacity-60"
            title="Water-based — gated by preservative decision"
          >
            🔒
          </span>
        )}
      </div>

      {/* Age band */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${AGE_BAND_COLOR[sku.ageBand]}`} />
        <span className="text-[10px] uppercase tracking-wider text-ink/50 leading-none">
          {AGE_BAND_LABELS[sku.ageBand]}
        </span>
      </div>

      {/* Name */}
      <h3 className="font-display font-light uppercase tracking-wide text-ink text-sm leading-snug">
        {sku.name}
      </h3>

      {/* Hero botanical */}
      {sku.heroIngredients && sku.heroIngredients.length > 0 && (
        <p className="text-[10px] text-ink/40 italic -mt-1 leading-snug">
          {sku.heroIngredients.slice(0, 2).join(', ')}
        </p>
      )}

      {/* Footer: format + price + scenario */}
      <div className="flex items-end justify-between mt-auto pt-1">
        <span className="text-[10px] uppercase tracking-wider text-ink/40">
          {sku.format}
          {sku.scenario && (
            <span className="ml-1.5 text-sage font-medium">{SCENARIO_LABELS[sku.scenario]}</span>
          )}
        </span>
        <span className="text-xs font-medium text-ink tabular-nums">
          {sku.price != null ? `$${sku.price}` : '—'}
        </span>
      </div>
    </article>
  )
}
