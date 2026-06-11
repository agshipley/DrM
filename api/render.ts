import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put } from '@vercel/blob'
import OpenAI from 'openai'

function hashPrompt(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({ url: null, error: 'no key' })
  }

  const { renderPrompt } = req.body as { renderPrompt: string }
  if (!renderPrompt) return res.status(400).json({ error: 'renderPrompt is required' })

  const hash = hashPrompt(renderPrompt)
  const blobPath = `renders/${hash}.png`

  // Return cached Blob URL if it already exists
  try {
    const { blobs } = await list({ prefix: blobPath })
    if (blobs.length > 0) {
      return res.status(200).json({ url: blobs[0].url })
    }
  } catch (e) {
    console.error('blob list error:', e)
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const response = await client.images.generate({
      model: 'gpt-image-1',
      prompt: renderPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium',
      background: 'transparent',
      output_format: 'png',
    })
    const b64 = response.data?.[0]?.b64_json
    if (!b64) return res.status(200).json({ url: null, error: 'no image data' })

    const buffer = Buffer.from(b64, 'base64')
    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
    })

    return res.status(200).json({ url: blob.url })
  } catch (e) {
    console.error('render error:', e)
    return res.status(200).json({ url: null, error: String(e) })
  }
}
