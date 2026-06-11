import { useState, useRef, useEffect } from 'react'
import seedData from './data/sku_seed_data.json'
import type { Sku } from './types'
import { SkuCard } from './components/SkuCard'
import { SkuDetailOverlay } from './components/SkuDetailOverlay'
import { ProposeSuite } from './components/ProposeSuite'

const seedSkus = seedData.skus as Sku[]
const currentSkus = seedSkus.filter((s) => s.status === 'current')
const seedConceptSkus = seedSkus.filter((s) => s.status === 'concept')

const PROPOSALS_KEY = 'drmax_proposals'

function loadProposals(): Sku[] {
  try {
    const raw = localStorage.getItem(PROPOSALS_KEY)
    return raw ? (JSON.parse(raw) as Sku[]) : []
  } catch { return [] }
}

// SALT must match api/render.ts — bump both together to invalidate caches
const RENDER_SALT = 'v2:'

function hashPrompt(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

export default function App() {
  const [proposals, setProposals] = useState<Sku[]>(loadProposals)
  const conceptSkus = [...seedConceptSkus, ...proposals]

  const [renders, setRenders] = useState<Record<string, string>>({})
  const [renderingId, setRenderingId] = useState<string | null>(null)
  const [renderQueue, setRenderQueue] = useState<string[]>([])
  const [renderFailed, setRenderFailed] = useState<Set<string>>(new Set())
  const isRenderingAllRef = useRef(false)

  const [selectedSku, setSelectedSku] = useState<Sku | null>(null)

  useEffect(() => {
    fetch('/api/manifest')
      .then((r) => r.json())
      .then((manifest: Record<string, string>) => setRenders(manifest))
      .catch(() => {})
  }, [])

  const addToShelf = (sku: Sku) => {
    setProposals((prev) => {
      const updated = [...prev, sku]
      try { localStorage.setItem(PROPOSALS_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const onRenderResult = (hash: string, url: string, heroUrl: string | null) => {
    setRenders((prev) => {
      const next = { ...prev, [hash]: url }
      if (heroUrl) next[hash + '-hero'] = heroUrl
      return next
    })
  }

  const renderSku = async (sku: Sku) => {
    if (!sku.renderPrompt) return
    const hash = hashPrompt(RENDER_SALT + sku.renderPrompt)
    if (renders[hash]) return

    // Clear any previous failure for this SKU
    setRenderFailed((prev) => { const s = new Set(prev); s.delete(sku.id); return s })
    setRenderingId(sku.id)
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderPrompt: sku.renderPrompt }),
      })
      const { url, heroUrl } = await res.json() as { url?: string | null; heroUrl?: string | null }
      if (url) {
        setRenders((prev) => {
          const next = { ...prev, [hash]: url }
          if (heroUrl) next[hash + '-hero'] = heroUrl
          return next
        })
      } else {
        setRenderFailed((prev) => new Set([...prev, sku.id]))
      }
    } catch (e) {
      console.error('render error', sku.id, e)
      setRenderFailed((prev) => new Set([...prev, sku.id]))
    } finally {
      setRenderingId(null)
    }
  }

  const renderAllConcepts = async () => {
    if (isRenderingAllRef.current) return
    isRenderingAllRef.current = true

    const allConcepts = [...seedConceptSkus, ...proposals]
    const toRender = allConcepts.filter(
      (s) => s.renderPrompt && !renders[hashPrompt(s.renderPrompt)]
    )

    const ids = toRender.map((s) => s.id)
    setRenderQueue(ids)

    for (const sku of toRender) {
      setRenderQueue((q) => q.filter((id) => id !== sku.id))
      await renderSku(sku)
    }

    setRenderQueue([])
    isRenderingAllRef.current = false
  }

  const renderUrlFor = (sku: Sku): string | null =>
    sku.renderPrompt ? (renders[hashPrompt(RENDER_SALT + sku.renderPrompt)] ?? null) : null

  const heroRenderUrlFor = (sku: Sku): string | null =>
    sku.renderPrompt ? (renders[hashPrompt(RENDER_SALT + sku.renderPrompt) + '-hero'] ?? null) : null

  const unrenderedConceptCount = conceptSkus.filter(
    (s) => s.renderPrompt && !renderUrlFor(s)
  ).length

  const isRenderingAll = isRenderingAllRef.current || renderQueue.length > 0

  return (
    <div className="min-h-screen bg-cream">

      <header className="px-5 pt-10 pb-6 border-b border-ink/10">
        <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">
          Internal Decision Tool
        </p>
        <h1 className="font-display text-3xl font-light uppercase tracking-widest text-ink leading-none">
          Dr. Max's
        </h1>
        <p className="text-xs text-ink/40 mt-1.5 tracking-wide">
          SKU Roadmap Visualizer
        </p>
      </header>

      <main className="px-4 py-8 max-w-2xl mx-auto space-y-12">

        <section>
          <ProposeSuite onAddToShelf={addToShelf} onRenderResult={onRenderResult} />
        </section>

        <div className="h-px bg-ink/10" />

        {/* Current line */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[10px] uppercase tracking-widest text-ink/50">Current line</h2>
            <span className="text-[10px] text-ink/30">{currentSkus.length} SKUs</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentSkus.map((sku) => (
              <SkuCard
                key={sku.id}
                sku={sku}
                onClick={() => setSelectedSku(sku)}
              />
            ))}
          </div>
        </section>

        <div className="h-px bg-ink/10" />

        {/* Concept SKUs */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[10px] uppercase tracking-widest text-ink/50">Concept SKUs</h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-ink/30">{conceptSkus.length} across scenarios</span>
              {unrenderedConceptCount > 0 && (
                <button
                  type="button"
                  onClick={renderAllConcepts}
                  disabled={isRenderingAll || renderingId !== null}
                  className={[
                    'text-[9px] uppercase tracking-widest px-2 py-1 rounded-md border transition-colors leading-none',
                    isRenderingAll || renderingId !== null
                      ? 'border-ink/15 text-ink/25 cursor-not-allowed'
                      : 'border-ink/20 text-ink/50 hover:border-ink/35 hover:text-ink/70',
                  ].join(' ')}
                >
                  {renderQueue.length > 0
                    ? `${renderQueue.length} left…`
                    : renderingId !== null
                    ? 'rendering…'
                    : 'Render all'}
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {conceptSkus.map((sku) => (
              <SkuCard
                key={sku.id}
                sku={sku}
                renderUrl={renderUrlFor(sku)}
                isRendering={renderingId === sku.id}
                inQueue={renderQueue.includes(sku.id)}
                renderFailed={renderFailed.has(sku.id)}
                onRender={() => renderSku(sku)}
                onClick={() => setSelectedSku(sku)}
              />
            ))}
          </div>
        </section>

      </main>

      <footer className="px-5 py-8 border-t border-ink/10 mt-8">
        <p className="text-[10px] text-ink/30 text-center uppercase tracking-widest">
          {seedData.meta.brand} · {seedData.meta.source}
        </p>
      </footer>

      {selectedSku && (
        <SkuDetailOverlay
          sku={selectedSku}
          renderUrl={renderUrlFor(selectedSku)}
          heroRenderUrl={heroRenderUrlFor(selectedSku)}
          onClose={() => setSelectedSku(null)}
        />
      )}

    </div>
  )
}
