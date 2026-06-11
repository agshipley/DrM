// scripts/qa-ai-flow.mjs
// Playwright QA for the AI proposal flow.
// Requires: vercel dev running on port 3000.
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'

const PORT = 3000
const BASE = `http://localhost:${PORT}`
const PASSCODE = 'drmax2026'

await mkdir('qa', { recursive: true })

console.log('Starting vercel dev on port', PORT)
const server = spawn('npx', ['vercel', 'dev', '--listen', PORT], {
  stdio: ['ignore', 'pipe', 'pipe'],
  cwd: process.cwd(),
})

let serverReady = false
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('vercel dev timed out after 30s')), 30000)
  const check = async () => {
    try {
      const res = await fetch(BASE)
      if (res.ok || res.status === 200) {
        clearTimeout(timeout)
        serverReady = true
        resolve()
      } else { setTimeout(check, 500) }
    } catch { setTimeout(check, 500) }
  }
  server.stdout.on('data', (d) => {
    const s = d.toString()
    if (s.includes('Ready') || s.includes('localhost')) setTimeout(check, 800)
  })
  server.stderr.on('data', (d) => {
    const s = d.toString()
    if (s.includes('Ready') || s.includes('localhost')) setTimeout(check, 800)
  })
  server.on('error', reject)
})
console.log('vercel dev ready.')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 390, height: 844 })

const failures = []

// ── Test 1: locked life stage ──────────────────────────────────────────────
console.log('\n── Test 1: sunscreen stick, locked 1-3y ──')
await page.goto(BASE)

// Passcode gate
const pwInput = page.locator('input[type=password], input[type=text]').first()
await pwInput.waitFor({ timeout: 8000 })
await pwInput.fill(PASSCODE)
await page.locator('button[type=submit]').click()
await page.waitForTimeout(500)

// Type idea
await page.locator('textarea').fill('a sunscreen stick for toddlers')

// Lock Life stage to 1-3y
const chip13y = page.locator('button').filter({ hasText: '1–3y' }).first()
await chip13y.click()

// Verify chip is active (bg-ink)
const isActive = await chip13y.evaluate((el) =>
  el.className.includes('bg-ink') && !el.className.includes('bg-ink/')
)
// Some classes might contain bg-ink/ so let's check differently
const chipClass = await chip13y.getAttribute('class')
if (!chipClass?.includes('bg-ink')) {
  // Check if it has bg-ink without /
  failures.push('1-3y chip did not become active after click')
}

// Click Generate
await page.locator('button').filter({ hasText: 'Generate' }).click()

// Wait for spec to render (up to 35s for AI) — "Add to shelf" button is unique to the hero
console.log('  Waiting for spec…')
await page.locator('button').filter({ hasText: 'Add to shelf' }).waitFor({ timeout: 40000 })
await page.waitForTimeout(300)

// Verify spec has name, price, rationale
// Hero h3 uses text-xl; card h3s use text-sm
const heroName = await page.locator('h3.text-xl').first().textContent()
console.log(`  Name: ${heroName}`)
if (!heroName || heroName.trim().length < 2) failures.push('Spec name is empty')

const rationale = await page.locator('text=Rationale').count()
if (rationale === 0) failures.push('Rationale section missing')

const priceEl = await page.locator('p').filter({ hasText: /^\$\d+/ }).first()
const priceText = await priceEl.textContent()
console.log(`  Price: ${priceText}`)
if (!priceText?.match(/\$\d+/)) failures.push('Price not rendered')

// Verify visual (PackageMockup SVG should be present)
const svgCount = await page.locator('section svg').count()
if (svgCount === 0) failures.push('Hero visual (SVG mockup) not present')
console.log(`  SVGs in hero: ${svgCount}`)

// Screenshot Test 1
await page.screenshot({ path: 'qa/04-hero-locked-age.png', fullPage: false })
console.log('  Screenshot: qa/04-hero-locked-age.png')

// Verify "Add to shelf" places it in concept section
const conceptCountBefore = await page.locator('section').filter({ hasText: 'Concept SKUs' }).locator('article').count()
console.log(`  Concept cards before add: ${conceptCountBefore}`)

await page.locator('button').filter({ hasText: 'Add to shelf' }).click()
await page.waitForTimeout(400)

const conceptCountAfter = await page.locator('section').filter({ hasText: 'Concept SKUs' }).locator('article').count()
console.log(`  Concept cards after add: ${conceptCountAfter}`)
if (conceptCountAfter !== conceptCountBefore + 1) {
  failures.push(`Add to shelf: expected ${conceptCountBefore + 1} concepts, got ${conceptCountAfter}`)
}

// ── Test 2: all-auto proposal ──────────────────────────────────────────────
console.log('\n── Test 2: all-auto "a gentle face wash" ──')
const textarea = page.locator('textarea')
await textarea.scrollIntoViewIfNeeded()
await textarea.fill('a gentle face wash for the whole family')

await page.locator('button').filter({ hasText: 'Generate' }).click()
console.log('  Waiting for spec…')
await page.locator('button').filter({ hasText: 'Add to shelf' }).waitFor({ timeout: 40000 })
await page.waitForTimeout(300)

const heroName2 = await page.locator('h3.text-xl').first().textContent()
console.log(`  Name: ${heroName2}`)
if (!heroName2 || heroName2.trim().length < 2) failures.push('Test 2: Spec name is empty')

// Screenshot Test 2
await page.screenshot({ path: 'qa/05-hero-all-auto.png', fullPage: false })
console.log('  Screenshot: qa/05-hero-all-auto.png')

// ── Done ───────────────────────────────────────────────────────────────────
await browser.close()
server.kill()

if (failures.length) {
  console.error('\nFAILURES:')
  failures.forEach((f) => console.error(' ✗', f))
  process.exit(1)
} else {
  console.log('\nAll QA checks passed.')
}
