import type { Format, AgeBand, ScenarioId } from '../types'

export type LockedState = {
  format: Format | null
  ageBand: AgeBand | null
  scenario: ScenarioId | null
  waterBased: 'true' | 'false' | null
  price: string | null
}

export const DEFAULT_LOCKED: LockedState = {
  format: null,
  ageBand: null,
  scenario: null,
  waterBased: null,
  price: null,
}

export function buildLockedParams(locked: LockedState): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (locked.format) out.format = locked.format
  if (locked.ageBand) out.ageBand = locked.ageBand
  if (locked.scenario) out.scenario = locked.scenario
  if (locked.waterBased !== null) out.waterBased = locked.waterBased === 'true'
  if (locked.price && !isNaN(Number(locked.price))) out.price = Number(locked.price)
  return out
}

const FORMAT_OPTIONS: { label: string; value: Format | null }[] = [
  { label: 'Auto', value: null },
  { label: 'Tin', value: 'tin' },
  { label: 'Tube', value: 'tube' },
  { label: 'Bottle', value: 'bottle' },
  { label: 'Jar', value: 'jar' },
  { label: 'Soap bar', value: 'soap-bar' },
  { label: 'Stick', value: 'stick' },
  { label: 'Carton', value: 'carton' },
]

const AGE_OPTIONS: { label: string; value: AgeBand | null }[] = [
  { label: 'Auto', value: null },
  { label: '0–12m', value: '0-12m' },
  { label: '0–3y', value: '0-3y' },
  { label: '1–3y', value: '1-3y' },
  { label: 'Adult', value: 'adult' },
  { label: 'Family', value: 'family' },
]

const BRANCH_OPTIONS: { label: string; value: ScenarioId | null }[] = [
  { label: 'Auto', value: null },
  { label: 'Phase 1', value: 'all-branch' },
  { label: 'Velocity', value: 'velocity' },
  { label: 'Duration', value: 'duration' },
]

const WATER_OPTIONS: { label: string; value: 'true' | 'false' | null }[] = [
  { label: 'Auto', value: null },
  { label: 'Allowed', value: 'true' },
  { label: 'Not allowed', value: 'false' },
]

function ChipRow<T extends string | null>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[9px] uppercase tracking-widest text-ink/40 w-[78px] flex-shrink-0 leading-none">
        {label}
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {options.map((opt) => (
          <button
            key={String(opt.value ?? '__auto__')}
            type="button"
            onClick={() => onChange(value === opt.value ? (null as T) : opt.value)}
            className={[
              'text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 transition-colors',
              value === opt.value
                ? 'bg-ink text-cream'
                : 'bg-ink/10 text-ink/50 hover:bg-ink/15 hover:text-ink/70',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface ProposePanelProps {
  idea: string
  setIdea: (v: string) => void
  locked: LockedState
  setLocked: (v: LockedState) => void
  onGenerate: () => void
  isGenerating: boolean
  error: string | null
}

export function ProposePanel({
  idea,
  setIdea,
  locked,
  setLocked,
  onGenerate,
  isGenerating,
  error,
}: ProposePanelProps) {
  const set = <K extends keyof LockedState>(key: K, value: LockedState[K]) =>
    setLocked({ ...locked, [key]: value })

  const canGenerate = idea.trim().length > 0 && !isGenerating

  return (
    <section className="bg-shell rounded-2xl p-5 space-y-4">
      <h2 className="text-[10px] uppercase tracking-widest text-ink/40">Propose a product</h2>

      <textarea
        placeholder="Describe the product…"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canGenerate) onGenerate()
        }}
        rows={3}
        className="w-full bg-cream/60 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink/30 resize-none focus:outline-none focus:border-ink/25 leading-relaxed"
      />

      <div className="space-y-2.5">
        <ChipRow
          label="Format"
          options={FORMAT_OPTIONS}
          value={locked.format}
          onChange={(v) => set('format', v)}
        />
        <ChipRow
          label="Life stage"
          options={AGE_OPTIONS}
          value={locked.ageBand}
          onChange={(v) => set('ageBand', v)}
        />
        <ChipRow
          label="Branch"
          options={BRANCH_OPTIONS}
          value={locked.scenario}
          onChange={(v) => set('scenario', v)}
        />
        <ChipRow
          label="Water-based"
          options={WATER_OPTIONS}
          value={locked.waterBased}
          onChange={(v) => set('waterBased', v)}
        />
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-ink/40 w-[78px] flex-shrink-0 leading-none">
            Price
          </span>
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-[10px] text-ink/40 pointer-events-none">$</span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Auto"
              value={locked.price ?? ''}
              onChange={(e) => set('price', e.target.value || null)}
              className="pl-6 pr-3 py-1 text-[10px] rounded-full bg-ink/10 text-ink/60 placeholder-ink/35 focus:outline-none focus:bg-ink/15 w-24 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-clay leading-snug">
          {error.length > 120 ? error.slice(0, 120) + '…' : error}
        </p>
      )}

      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className={[
          'w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-colors',
          canGenerate
            ? 'bg-ink text-cream hover:bg-ink/85'
            : 'bg-ink/15 text-ink/30 cursor-not-allowed',
        ].join(' ')}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-3.5 h-3.5 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
            Generating…
          </span>
        ) : (
          'Generate'
        )}
      </button>
    </section>
  )
}
