import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM = `You are the product strategist for Dr. Max's, a physician-formulated natural skincare brand (drmaxs.com). Brand: multi-use, whole-family, all-natural; free from parabens, sulfates, phthalates, petrolatum, plastics, preservatives, synthetic fragrance and dyes; hero botanicals are calendula, chamomile, yarrow, arnica, sea buckthorn, olive oil, beeswax, colloidal oatmeal, zinc oxide. Current line and price ladder: Nipple Balm $15, Baby Balm $18, Diaper Ointment $20, Salve-All $22 (hero). Voice: plain, clinical-warm; never 'miracle' or cure claims. The user proposes a product idea plus optional locked parameters. Locked parameters are non-negotiable — obey them exactly. For everything not locked, use your best judgment to produce a commercially sensible, brand-consistent spec. If the idea requires a water-based formula and waterBased is locked false, choose the closest anhydrous format and note the tradeoff in rationale. Respond with ONLY a JSON object, no markdown fences, no preamble: { name, tagline, format (one of: tin|tube|bottle|jar|soap-bar|stick|carton), ageBand (one of: 0-12m|0-3y|1-3y|adult|family), price (number), heroIngredients (string[]), uses (string[]), waterBased (boolean), scenario (all-branch|velocity|duration), rationale (2-3 sentences: why this spec, where it sits in the price ladder, what it trades off), renderPrompt (one paragraph describing the product for photorealistic rendering: container shape and materials, label text verbatim, lighting 'soft diffused studio'. No backdrop, no background, no shadow — the image will be composited onto a brand card. Focus on the product object itself.) }.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { idea, locked = {} } = req.body as { idea: string; locked: Record<string, unknown> }
  if (!idea?.trim()) return res.status(400).json({ error: 'idea is required' })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const lockedPart = Object.keys(locked).length
    ? `\nLocked parameters (non-negotiable): ${JSON.stringify(locked)}`
    : ''

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Product idea: ${idea}${lockedPart}` }],
  })

  let text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  // Strip markdown fences defensively
  text = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()

  try {
    const spec = JSON.parse(text)
    return res.status(200).json(spec)
  } catch {
    return res.status(500).json({ error: 'Failed to parse model response', raw: text })
  }
}
