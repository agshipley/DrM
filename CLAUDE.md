# CLAUDE.md — Dr. Max's SKU Roadmap Visualizer

## What this is
Internal decision tool for Dr. Max's (drmaxs.com), a physician-formulated natural
skincare brand. The CEO is deciding between two roadmap strategies; this tool
visualizes both. Full requirements in `SPEC.md`. Design tokens in `BRAND_SYSTEM.md`.
Data in `src/data/sku_seed_data.json` — treat its schema as the contract.

## Working rules
- Follow SPEC.md build phases in order; stop at each checkpoint for human review
- Never invent brand colors/fonts — everything derives from BRAND_SYSTEM.md;
  if a token is missing, ask, don't improvise
- Packaging silhouettes are SVG components, one per format, in `src/components/silhouettes/`
- No backend, no auth, no router needed in v1; localStorage only
- Mobile-first: CEO reviews on a phone
- Concept SKU copy must follow brand voice rules (no cure claims, name the botanical)

## Commands
- `npm run dev` / `npm run build` / `npm run lint`

## Out of scope (v1)
AI generation, exports, image-gen, retailer-facing polish. See SPEC.md §6.
