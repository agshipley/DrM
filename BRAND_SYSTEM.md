# Dr. Max's — Brand System for SKU Visualizer

Verified from drmaxs.com live site — June 2026. All hex values confirmed via devtools
(71-element cream sweep + spot-checks across sections).

## Brand character
Modern apothecary. Physician-formulated, farm-grown, multi-use. Voice: calm, credible, warm —
a doctor who is also a farmer. Visuals lean on botanical photography, metal tins and amber/cream
packaging, lowercase nav, uppercase display headlines.

**Core insight:** warmth comes from photography, not UI color. The digital palette is
cream + deep indigo — clean and apothecary. Resist adding earth tones to the UI; let the
product photos do that work.

## Color tokens — VERIFIED

| Token | Value | Use |
|---|---|---|
| `--cream` | #FDF9F2 | Page background (71 elements, dominant) |
| `--ink` | #2B2651 | Primary text, buttons, borders — deep indigo |
| `--shell` | #FDF3E6 | Warm section background tint |
| `--sand` | #F9EBD6 | Deeper warm tint — cards, inset panels |

Discarded: #146FF8 (single element, third-party chat widget), utility white/grey.
The repeated `rgba(43,38,81,*)` values across the site all flatten to the same #2B2651 hex
at varying opacities — modeled in code as `text-ink/50`, `bg-ink/10`, etc.

## Functional UI accents — tool-only, not site colors

These serve semantic roles the site doesn't need (age-band coding, concept badges,
preservative gate). Honest about being non-brand.

| Token | Value | Role |
|---|---|---|
| `--calendula` | #D99A2B | Concept badges, highlights — warm amber |
| `--sage` | #7A8B6F | Baby / 0–12m age band |
| `--clay` | #B5654A | Adult age band |

## Typography

- **Display:** Fraunces (stand-in for their custom apothecary serif). Uppercase, generous tracking,
  used sparingly for product names and main headlines.
- **Body/UI:** Inter (stand-in for their humanist sans). Sentence case.
- Note for v2: match their actual custom faces ("DrMax" display / "Zelda" body) if
  this tool goes in front of Erin's board.

## Layout language

- Generous whitespace, thin hairline dividers (`ink/15`)
- Product imagery on cream, never on white cards with drop shadows
- Packaging formats in line today: **metal tin**, **soap bar**, **cotton goods**
  (washcloths, zipper bags), **paper goods** (book, seed packet)

## Design implication for silhouettes (Phase 2)

**Ink-on-cream is the brand voice.** Silhouettes must be ink (#2B2651) line-work on
cream/shell surfaces. Calendula is used sparingly — concept badges only, not as an
illustration accent. No earth-tone fills; no terracotta or brown illustration.
Depth comes from shell vs cream surface contrast, not from color.

## Voice rules for generated SKU copy

- Plain, clinical-warm: "soothes," "protects," "calms" — never "miracle," "magic"
  (except established tagline "magically multi-use"), no medical cure claims
- Always name the hero botanical (calendula, chamomile, yarrow, arnica, sea buckthorn)
- Free-from list is fixed brand language: parabens, sulfates, phthalates, petrolatums,
  plastics, preservatives, synthetic fragrances and dyes
