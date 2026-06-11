// scripts/fetch-photos.mjs
// Downloads real product photography from drmaxs.com (public Shopify endpoint)
// into public/products/{skuId}.jpg. Run once: `node scripts/fetch-photos.mjs`
import { mkdir, writeFile } from "node:fs/promises";

// Map our seed-data SKU ids -> Shopify product handles on drmaxs.com.
// If a handle 404s, the script lists available handles so you can correct it.
const HANDLE_MAP = {
  "salve-all": "salve-all",
  "diaper-ointment": "diaper-ointment",
  "baby-balm": "baby-balm",
  "nipple-balm": "nipple-balm",
  "olive-oil-soap": "olive-oil-soap",
  "washcloths": "washcloths",
  "zipper-bags": "zipper-bags",
  "childrens-book": "childrens-book",
  "seed-packet": "seed-packet",
};

const BASE = "https://drmaxs.com";

const res = await fetch(`${BASE}/products.json?limit=250`);
if (!res.ok) {
  console.error(`Failed to fetch product list: ${res.status}`);
  process.exit(1);
}
const { products } = await res.json();
const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));

console.log("Available handles on the store:");
products.forEach((p) => console.log("  -", p.handle));

await mkdir("public/products", { recursive: true });

let ok = 0;
for (const [skuId, handle] of Object.entries(HANDLE_MAP)) {
  const product = byHandle[handle];
  if (!product || !product.images?.length) {
    console.warn(`MISS: ${skuId} (handle "${handle}") — fix HANDLE_MAP above`);
    continue;
  }
  // First image, sized down via Shopify CDN params for fast loads
  const src = product.images[0].src.replace(/(\.\w+)(\?.*)?$/, "_600x$1");
  const img = await fetch(src);
  if (!img.ok) {
    console.warn(`MISS: ${skuId} image fetch ${img.status}`);
    continue;
  }
  await writeFile(
    `public/products/${skuId}.jpg`,
    Buffer.from(await img.arrayBuffer())
  );
  console.log(`OK: ${skuId} <- ${handle}`);
  ok++;
}
console.log(`\nDone: ${ok}/${Object.keys(HANDLE_MAP).length} photos saved.`);
