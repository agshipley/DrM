// src/components/SkuVisual.tsx
// One rule for the whole app: real photo if we have one, packaging comp if not.
// Photos live at /products/{sku.id}.jpg (created by scripts/fetch-photos.mjs).

import { useState } from "react";
import type { Sku } from "../types";
import PackageMockup from "./mockups/PackageMockup";

export default function SkuVisual({ sku }: { sku: Sku }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const usePhoto = sku.status === "current" && !photoFailed;

  if (usePhoto) {
    return (
      <img
        src={`/products/${sku.id}.jpg`}
        alt={sku.name}
        loading="lazy"
        onError={() => setPhotoFailed(true)}
        className="w-full h-full object-contain mix-blend-multiply"
        /* mix-blend-multiply drops Shopify's white photo background onto our
           cream/sand card without any image editing */
      />
    );
  }
  return <PackageMockup sku={sku} />;
}

/* ============================================================
INTEGRATION (paste this comment block to Claude Code as the task)

1. Add the two files:
   - src/components/SkuVisual.tsx        (this file)
   - src/components/mockups/PackageMockup.tsx
   - scripts/fetch-photos.mjs            (repo root /scripts)

2. Run: node scripts/fetch-photos.mjs
   It downloads real photos for the 9 current SKUs to public/products/.
   If any handle MISSes, it prints the store's real handles — update
   HANDLE_MAP in the script and re-run.

3. In the SKU card component, replace the old silhouette render with:
     <SkuVisual sku={sku} />
   inside the same aspect-ratio container. Delete the old silhouette
   components and their imports.

4. Card surface note: photos blend via mix-blend-multiply, so keep card
   backgrounds in the cream/shell/sand family (no ink-dark cards behind
   visuals).

5. Visual QA loop (do this before reporting done): run dev server, take
   Playwright screenshots of (a) Current Line and (b) each scenario view,
   and verify: photos load for all 9 current SKUs; every concept renders
   as a labeled package comp with legible type at card size; nothing
   overflows. Fix and re-screenshot until clean, then deploy to Vercel.
============================================================ */
