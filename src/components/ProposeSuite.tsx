import { useState } from 'react'
import type { GeneratedSpec, Sku } from '../types'
import { ProposePanel, DEFAULT_LOCKED, buildLockedParams } from './ProposePanel'
import type { LockedState } from './ProposePanel'
import { ProposalHero, specToSku } from './ProposalHero'

interface ProposeSuiteProps {
  onAddToShelf: (sku: Sku) => void
}

export function ProposeSuite({ onAddToShelf }: ProposeSuiteProps) {
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
        .then(({ url, error }: { url?: string | null; error?: string }) => {
          if (url) setRenderImage(url)
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
      {spec && (
        <ProposalHero
          spec={spec}
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
