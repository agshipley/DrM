import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put } from '@vercel/blob'
import OpenAI, { toFile } from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Jimp } from 'jimp'

// Bump SALT to invalidate previous renders without deleting old blobs
const SALT = 'v2:'
const NUM_PLATES = 3
const PLATE_SIZE = 1024

// Brand style instruction prepended to every renderPrompt before sending to OpenAI.
// Hashing uses only SALT + renderPrompt, so updating BRAND_INSTRUCTION also requires
// bumping SALT to actually invalidate cached renders.
const BRAND_INSTRUCTION = `Using the brand packaging design language shown in these reference photos, create a NEW product with EXACTLY this visual style:
- CARTON BOX is the visual hero: cream matte paper, dense hand-drawn folk-botanical illustration border in dark ink along all edges, DR·MAX'S hand-lettered wordmark with dot and diamond motifs at top, vintage seed-packet apothecary aesthetic
- Candy-stripe side panels in the accent color specified below
- The carton lid or flap is slightly open so the container inside is partly visible; the product container also sits beside or slightly in front of the carton
- FORBIDDEN on all surfaces: amber glass, dark glass, chrome, plastic-looking gloss — bottles and tubes must be cream or white matte; tins are pale brushed metal with cream paper label wrap; jars are clear glass with cream matte lid only
- LABEL TEXT RULE: show ONLY two text items spelled exactly as given — the DR·MAX'S wordmark and the product name. No ingredient text, taglines, sub-headers, or any other words anywhere on the carton or container
- Transparent background. Single product composition. Soft warm studio light from upper left.

Product to render:
`

function hashPrompt(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

function plateIndex(hash: string): number {
  return parseInt(hash, 36) % NUM_PLATES
}

async function compositeHero(cardPngBuffer: Buffer, plateIdx: number): Promise<Buffer> {
  const platePath = join(process.cwd(), 'public', 'plates', `plate-${plateIdx}.jpg`)
  const plateBuffer = readFileSync(platePath)

  const PRODUCT_MAX = Math.round(PLATE_SIZE * 0.65) // 665px

  // Load plate (blurred coastal backdrop), cover-resize to square
  const plate = await Jimp.read(plateBuffer)
  plate.cover({ w: PLATE_SIZE, h: PLATE_SIZE })

  // Load product PNG, contain-resize to fit within PRODUCT_MAX
  const productImg = await Jimp.read(cardPngBuffer)
  productImg.contain({ w: PRODUCT_MAX, h: PRODUCT_MAX })

  const pw = productImg.bitmap.width
  const ph = productImg.bitmap.height

  // Center product, nudge slightly above vertical center (like real product shots)
  const left = Math.round((PLATE_SIZE - pw) / 2)
  const top = Math.max(0, Math.round((PLATE_SIZE - ph) / 2) - 20)

  // Drop shadow: clone product, colorize dark warm brown, blur, offset lower-right
  // (light from upper-left per brand photography)
  const SHADOW_OFFSET_X = 22
  const SHADOW_OFFSET_Y = 32
  const shadowImg = productImg.clone()
  const { data: sd, width: sw, height: sh } = shadowImg.bitmap
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4
      if (sd[idx + 3] > 0) {
        sd[idx] = 30        // R
        sd[idx + 1] = 18    // G
        sd[idx + 2] = 8     // B
        sd[idx + 3] = Math.floor(sd[idx + 3] * 0.55)
      }
    }
  }
  shadowImg.blur(14)

  // Composite: plate → shadow (offset) → product (centered)
  plate.composite(shadowImg, left + SHADOW_OFFSET_X, top + SHADOW_OFFSET_Y)
  plate.composite(productImg, left, top)

  return plate.getBuffer('image/jpeg', { quality: 90 }) as Promise<Buffer>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({ url: null, heroUrl: null, error: 'no key' })
  }

  const { renderPrompt } = req.body as { renderPrompt: string }
  if (!renderPrompt) return res.status(400).json({ error: 'renderPrompt is required' })

  const hash = hashPrompt(SALT + renderPrompt)
  const cardBlobPath = `renders/${hash}.png`
  const heroBlobPath = `renders/${hash}-hero.jpg`

  // ── Cache check ────────────────────────────────────────────────────────────
  let cachedCardUrl: string | null = null
  let cachedCardBuffer: Buffer | null = null

  try {
    const [{ blobs: cardBlobs }, { blobs: heroBlobs }] = await Promise.all([
      list({ prefix: cardBlobPath }),
      list({ prefix: heroBlobPath }),
    ])

    if (cardBlobs.length > 0 && heroBlobs.length > 0) {
      return res.status(200).json({ url: cardBlobs[0].url, heroUrl: heroBlobs[0].url })
    }

    if (cardBlobs.length > 0) {
      // Card cached but hero missing — download card, composite hero below
      cachedCardUrl = cardBlobs[0].url
      const resp = await fetch(cachedCardUrl)
      cachedCardBuffer = Buffer.from(await resp.arrayBuffer())
    }
  } catch (e) {
    console.error('blob list/fetch error:', e)
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // ── Generate card via images.edit with reference conditioning ──────────────
  let cardUrl: string | null = cachedCardUrl
  let cardBuffer: Buffer | null = cachedCardBuffer

  if (!cardBuffer) {
    const refNames = ['salve-all.jpg', 'baby-balm.jpg', 'diaper-ointment.jpg']
    const refFiles = await Promise.all(
      refNames.map(async (name) => {
        const buf = readFileSync(join(process.cwd(), 'public', 'products', name))
        return toFile(buf, name, { type: 'image/jpeg' })
      })
    )

    const fullPrompt = BRAND_INSTRUCTION + renderPrompt

    try {
      // images.edit accepts an array of reference images for style conditioning
      const response = await client.images.edit({
        model: 'gpt-image-1',
        image: refFiles as unknown as Parameters<typeof client.images.edit>[0]['image'],
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'medium',
        background: 'transparent',
        output_format: 'png',
      } as Parameters<typeof client.images.edit>[0])

      const b64 = response.data?.[0]?.b64_json
      if (!b64) return res.status(200).json({ url: null, heroUrl: null, error: 'no image data' })

      cardBuffer = Buffer.from(b64, 'base64')

      const cardBlob = await put(cardBlobPath, cardBuffer, {
        access: 'public',
        contentType: 'image/png',
        addRandomSuffix: false,
      })
      cardUrl = cardBlob.url
    } catch (e) {
      console.error('render error:', e)
      return res.status(200).json({ url: null, heroUrl: null, error: String(e) })
    }
  }

  // ── Composite hero onto coastal plate ─────────────────────────────────────
  let heroUrl: string | null = null
  try {
    const heroBuffer = await compositeHero(cardBuffer!, plateIndex(hash))
    const heroBlob = await put(heroBlobPath, heroBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
    })
    heroUrl = heroBlob.url
  } catch (e) {
    console.error('hero composite error:', e)
  }

  return res.status(200).json({ url: cardUrl, heroUrl })
}
