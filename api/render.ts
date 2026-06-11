import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put } from '@vercel/blob'
import OpenAI, { toFile } from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

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

  // Resize product to ~65% of plate, preserving aspect ratio
  const PRODUCT_MAX = Math.round(PLATE_SIZE * 0.65) // 665px

  const productResized = await sharp(cardPngBuffer)
    .resize(PRODUCT_MAX, PRODUCT_MAX, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  const { width: pw = PRODUCT_MAX, height: ph = PRODUCT_MAX } = await sharp(productResized).metadata()

  // Center product, nudged slightly above vertical center (like real product shots)
  const left = Math.round((PLATE_SIZE - pw) / 2)
  const top = Math.max(0, Math.round((PLATE_SIZE - ph) / 2) - 20)

  // Ground shadow: warm dark ellipse, offset to lower-right (light from upper-left)
  const SHADOW_OFFSET_X = 22
  const SHADOW_OFFSET_Y = 32
  const shadowW = Math.round(pw * 0.80)
  const shadowH = Math.max(20, Math.round(pw * 0.07))
  const shadowLeft = Math.max(0, left + Math.round((pw - shadowW) / 2) + SHADOW_OFFSET_X)
  const shadowTop = Math.max(0, top + ph - Math.round(shadowH * 0.4) + SHADOW_OFFSET_Y)

  const shadowSvg = Buffer.from(
    `<svg width="${shadowW}" height="${shadowH * 4}" xmlns="http://www.w3.org/2000/svg">` +
    `<ellipse cx="${shadowW / 2}" cy="${shadowH * 2}" rx="${shadowW / 2}" ry="${shadowH}" fill="rgba(30,18,8,0.50)"/>` +
    `</svg>`
  )
  const shadowLayer = await sharp(shadowSvg).blur(16).png().toBuffer()

  // Composite: blurred plate → shadow ellipse → sharp product
  return sharp(plateBuffer)
    .resize(PLATE_SIZE, PLATE_SIZE, { fit: 'cover', position: 'centre' })
    .composite([
      { input: shadowLayer, left: shadowLeft, top: shadowTop },
      { input: productResized, left, top },
    ])
    .jpeg({ quality: 90 })
    .toBuffer()
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
