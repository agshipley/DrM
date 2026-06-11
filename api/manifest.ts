import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list } from '@vercel/blob'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { blobs } = await list({ prefix: 'renders/' })
    const manifest: Record<string, string> = {}
    for (const blob of blobs) {
      // pathname is "renders/{hash}.png" — extract the hash
      const hash = blob.pathname.replace(/^renders\//, '').replace(/\.png$/, '')
      manifest[hash] = blob.url
    }
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(manifest)
  } catch (e) {
    console.error('manifest error:', e)
    return res.status(200).json({})
  }
}
