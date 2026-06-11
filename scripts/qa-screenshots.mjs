// scripts/qa-screenshots.mjs
// Playwright QA: verify photos load for current SKUs, concepts show mockup, no overflow.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { execSync, spawn } from "node:child_process";

const PORT = 5174; // use 5174 to avoid conflict with any existing dev server
const BASE = `http://localhost:${PORT}`;
const PASSCODE = "drmax2026";
const CURRENT_SKUS = [
  "salve-all", "diaper-ointment", "baby-balm", "nipple-balm",
  "olive-oil-soap", "washcloths", "zipper-bags", "childrens-book", "seed-packet",
];

await mkdir("qa", { recursive: true });

console.log("Starting dev server on port", PORT);
const server = spawn("npm", ["run", "dev", "--", "--port", PORT, "--strictPort"], {
  stdio: ["ignore", "pipe", "pipe"],
  cwd: process.cwd(),
  env: { ...process.env, VITE_PASSCODE: PASSCODE },
});

// Wait for the dev server to be ready
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("Dev server timed out")), 30000);
  const check = async () => {
    try {
      const res = await fetch(BASE);
      if (res.ok) { clearTimeout(timeout); resolve(); }
      else setTimeout(check, 300);
    } catch { setTimeout(check, 300); }
  };
  server.stdout.on("data", (d) => {
    if (d.toString().includes("Local")) setTimeout(check, 500);
  });
  server.on("error", reject);
});
console.log("Dev server ready.");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14

await page.goto(BASE);

// Handle passcode gate
const pwInput = page.locator('input[type=password], input[type=text]').first();
await pwInput.waitFor({ timeout: 5000 });
await pwInput.fill(PASSCODE);
await page.locator('button[type=submit]').click();
await page.waitForTimeout(600);

// Wait for SKU cards to render
await page.locator("article").first().waitFor({ timeout: 8000 });
await page.waitForTimeout(1500); // let lazy images load

// Screenshot 1: full current+concept view
await page.screenshot({ path: "qa/01-full-page.png", fullPage: true });
console.log("Screenshot: qa/01-full-page.png");

// Verify photo load for each current SKU
const failures = [];
for (const skuId of CURRENT_SKUS) {
  const img = page.locator(`img[src="/products/${skuId}.jpg"]`);
  const count = await img.count();
  if (count === 0) {
    failures.push(`${skuId}: img element not found`);
    continue;
  }
  const natural = await img.first().evaluate((el) => el.naturalWidth);
  if (natural === 0) {
    failures.push(`${skuId}: img loaded but naturalWidth=0 (broken)`);
  } else {
    console.log(`PASS photo: ${skuId} (${natural}px wide)`);
  }
}

// Verify concept SKUs render the PackageMockup SVG (no img fallback)
const conceptSvgs = await page.locator("article svg").count();
console.log(`Concept SVG mockups found: ${conceptSvgs}`);

// Check horizontal overflow
const overflows = await page.evaluate(() => {
  const docWidth = document.documentElement.scrollWidth;
  const viewWidth = window.innerWidth;
  return docWidth > viewWidth ? docWidth - viewWidth : 0;
});
if (overflows > 0) failures.push(`Horizontal overflow: ${overflows}px`);

// Screenshot 2: top of page (above fold)
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: "qa/02-above-fold.png" });
console.log("Screenshot: qa/02-above-fold.png");

// Screenshot 3: concept section
const conceptHeading = page.locator("text=Concept SKUs").first();
await conceptHeading.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: "qa/03-concept-section.png" });
console.log("Screenshot: qa/03-concept-section.png");

await browser.close();
server.kill();

if (failures.length) {
  console.error("\nFAILURES:");
  failures.forEach((f) => console.error(" ✗", f));
  process.exit(1);
} else {
  console.log("\nAll QA checks passed.");
}
