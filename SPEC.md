# SPEC — Dr. Max's SKU Roadmap Visualizer

**Purpose:** An internal decision tool for the CEO (Erin) to visually compare two
product-roadmap strategies — "Year One Deep" vs "Toddler Expansion" — by composing
mock shelves of current + concept SKUs and seeing portfolio-level stats per scenario.

**Audience:** Internal (CEO + agency). Not retailer-facing in v1. Stylized
packaging silhouettes are sufficient; photorealistic renders are explicitly v2.

---

## 1. Stack
- Vite + React + TypeScript, single-page app
- Tailwind with custom tokens from `BRAND_SYSTEM.md` (no default palette)
- Zustand (or useReducer) for state; localStorage persistence for saved scenarios
- No backend in v1. Optional v2: Anthropic API for AI concept generation
- Seed data: import `sku_seed_data.json`

## 2. Core views

### A. Shelf View (default)
- SKUs rendered as **packaging silhouettes** — this is the signature element.
  Each format (tin / soap-bar / bottle / tube / cotton / paper / gift-box) is an
  SVG component with the product name set in the display serif, hero botanical
  as a small line illustration, price tag, and age-band color chip.
- Filter chips: age band (0–12m / 1–3y / adult / family), status (current / concept),
  scenario.
- Scenario toggle (the key interaction): [ Current Line | Phase 1 (All-Branch) |
  Velocity | Duration | Compare ]. "Compare" shows the branch shelves side-by-side
  (stacked on mobile). Phase 1 SKUs appear in every future-state view.
- Preservative gate: SKUs with `waterBased: true` render with a lock badge and
  reduced opacity until a global "Preservative promise" toggle (Anhydrous-only /
  Refined promise) is flipped — making the Memo §3 constraint physically visible
  in the tool. This toggle is the first control in the header.

### B. SKU Builder
- Drawer/modal form: name, format (drives silhouette), age band, price, hero
  ingredients (multi-select from brand botanicals), uses, scenario assignment,
  rationale, regulatory note.
- Live preview of the silhouette as fields change.
- Concept SKUs get a `--calendula` "CONCEPT" badge.

### C. Portfolio Stats panel (per scenario)
- SKU count by age band (coverage bar)
- Price ladder: min / median / max, gaps >$8 flagged
- **Replenishment velocity mix**: share of SKUs tagged high/medium replenishment —
  the velocity-vs-duration tradeoff from the memo, made visual
- Customer-lifecycle coverage strip: pregnancy → 0–12m → 1–3y → family,
  shaded by how many SKUs serve each stage — this visual IS the strategic
  argument, make it prominent
- Bundle potential: which concepts slot into existing bundles
- Decision-inputs card: render the three N1/N2/N3 questions from
  `decisionInputs` with empty value fields Erin can fill in during the session

## 3. Data model
Use the schema in `sku_seed_data.json` verbatim. Key types:
`Sku { id, name, status: 'current'|'concept', scenario?, format, ageBand, price,
heroIngredients[], uses[], rationale?, regulatory? }`

## 4. Design requirements
- Apply `BRAND_SYSTEM.md` tokens exactly; verify hex values against the live site first
- Mobile-responsive (CEO will review on phone), keyboard focus visible,
  prefers-reduced-motion respected
- One restrained motion moment: shelf cross-fade on scenario toggle. Nothing else animates
- Copy in interface follows brand voice rules (BRAND_SYSTEM.md §Voice)

## 5. Build phases (Claude Code session plan)
1. **Scaffold + tokens** — Vite/TS/Tailwind config with brand tokens; render seed
   data as plain list. Checkpoint: tokens match site.
2. **Silhouette components** — the 7 packaging SVGs + SKU card. Checkpoint: shelf
   of current 9 SKUs looks unmistakably Dr. Max's.
3. **Scenario engine** — toggle, filters, compare mode.
4. **SKU Builder** — form + live preview + localStorage persistence.
5. **Stats panel** — lifecycle coverage strip, price ladder, age-band coverage.
6. **Polish pass** — responsive QA on mobile, motion, empty states
   ("No concepts in this scenario yet — add one" with action).

## 6. v2 backlog (do not build yet)
- Anthropic API "generate concept" button (brand-voice SKU ideation)
- Export: one-page PDF spec per concept SKU (feeds Figma/Canva mockup templates)
- Photorealistic render integration (image-gen connector)
- Pre-load scenarios from the market-analysis deliverable

## 7. Acceptance criteria
- Erin can open Compare mode on her phone and articulate the tradeoff between the
  two scenarios in under 60 seconds without anyone explaining the UI
- Adding a concept SKU takes < 30 seconds
- Saved scenarios survive refresh