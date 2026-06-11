import { useState } from 'react'
import type { GeneratedSpec, Sku } from '../types'
import { ProposePanel, DEFAULT_LOCKED, buildLockedParams } from './ProposePanel'
import type { LockedState } from './ProposePanel'
import { ProposalHero, specToSku } from './ProposalHero'

// Must match RENDER_SALT + hash in App.tsx and api/render.ts
const RENDER_SALT = 'v2:'
function hashRenderPrompt(renderPrompt: string): string {
  const s = RENDER_SALT + renderPrompt
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

interface ProposeSuiteProps {
  onAddToShelf: (sku: Sku) => void
  onRenderResult: (hash: string, url: string, heroUrl: string | null) => void
}

export function ProposeSuite({ onAddToShelf, onRenderResult }: ProposeSuiteProps) {
  const [idea, setIdea] = useState('')
  const [locked, setLocked] = useState<LockedState>(DEFAULT_LOCKED)
  const [spec, setSpec] = useState<GeneratedSpec | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [renderImage, setRenderImage] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)

  const generate = async () => {
    setIsGenerating(true)
    setGenerateError(null)
    setSpec(null)
    setRenderImage(null)
    setIsRendering(false)
    setRenderError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, locked: buildLockedParams(locked) }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }
      const newSpec: GeneratedSpec = await res.json()
      setSpec(newSpec)

      // Kick off render in parallel — failure is graceful
      setIsRendering(true)
      fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderPrompt: newSpec.renderPrompt }),
      })
        .then((r) => r.json())
        .then(({ url, heroUrl, error }: { url?: string | null; heroUrl?: string | null; error?: string }) => {
          if (url) {
            setRenderImage(url)
            // Notify App.tsx so the render appears in shelf card + overlay immediately
            onRenderResult(hashRenderPrompt(newSpec.renderPrompt), url, heroUrl ?? null)
          }
          else if (error) setRenderError(error)
        })
        .catch((e) => setRenderError(String(e)))
        .finally(() => setIsRendering(false))
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddToShelf = () => {
    if (!spec) return
    onAddToShelf(specToSku(spec))
  }

  return (
    <div className="space-y-4">
      <ProposePanel
        idea={idea}
        setIdea={setIdea}
        locked={locked}
        setLocked={setLocked}
        onGenerate={generate}
        isGenerating={isGenerating}
        error={generateError}
      />
      {(isGenerating || spec) && (
        <ProposalHero
          spec={spec}
          isGenerating={isGenerating}
          renderImage={renderImage}
          isRendering={isRendering}
          renderError={renderError}
          onAddToShelf={handleAddToShelf}
          onTryAgain={generate}
        />
      )}
    </div>
  )
}
