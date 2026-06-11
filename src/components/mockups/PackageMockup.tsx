// src/components/mockups/PackageMockup.tsx
// Packaging comps for concept SKUs: dimensional SVG package + typeset label.
// Goal: a concept should read as a plausible sibling of the real product photos,
// not as an icon. Labels are HTML inside <foreignObject> so long names wrap
// and type is set in the brand faces.
//
// Brand tokens come from CSS vars defined in src/index.css @theme:
// --color-ink, --color-cream, --color-shell, --color-sand, --color-calendula

import React from "react";
import type { Sku } from "../../types";

const ink = "var(--color-ink)";
const cream = "var(--color-cream)";
const shell = "var(--color-shell)";
const sand = "var(--color-sand)";

/* ---------- typeset label (shared) ---------- */

// Scale name font size down until it fits in 2 lines within the label width.
function nameFontSize(name: string, labelW: number, compact: boolean): number {
  const availW = labelW - (compact ? 12 : 20);
  const sizes = compact ? [9, 7.5, 6.5, 5.5, 5] : [12, 10, 8.5, 7, 6];
  for (const sz of sizes) {
    const charsPerLine = Math.max(1, Math.floor(availW / (sz * 0.62)));
    if (Math.ceil(name.length / charsPerLine) <= 2) return sz;
  }
  return sizes[sizes.length - 1];
}

// Only show ingredient line when it fits on one line without clipping.
function ingredientFits(text: string, labelW: number, compact: boolean): boolean {
  const availW = labelW - (compact ? 12 : 20);
  return text.length * (compact ? 5 : 6.5) * 0.52 <= availW;
}

function Label({
  sku,
  w,
  h,
  x,
  y,
  dark = false,
  compact = false,
}: {
  sku: Sku;
  w: number;
  h: number;
  x: number;
  y: number;
  dark?: boolean;
  compact?: boolean;
}) {
  const fg = dark ? "var(--color-cream)" : "var(--color-ink)";
  const nSize = nameFontSize(sku.name, w, compact);
  const ingText = !compact && sku.heroIngredients?.length
    ? `with ${sku.heroIngredients.slice(0, 2).join(" & ")}`
    : null;
  const showIng = ingText !== null && ingredientFits(ingText, w, compact);

  return (
    <foreignObject x={x} y={y} width={w} height={h}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: fg,
          padding: compact ? "2px 6px" : "4px 10px",
          boxSizing: "border-box",
          lineHeight: 1.15,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans, Inter, sans-serif)",
            fontSize: compact ? 5 : 6.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.85,
            flexShrink: 0,
          }}
        >
          Dr.&nbsp;Max&rsquo;s
        </div>
        <div
          className="line-clamp-2"
          style={{
            fontFamily: "var(--font-display, Fraunces, serif)",
            fontSize: nSize,
            fontWeight: 600,
            letterSpacing: "0.02em",
            margin: compact ? "1px 0" : "3px 0",
            wordBreak: "break-word",
          }}
        >
          {sku.name}
        </div>
        {showIng && (
          <div
            style={{
              fontFamily: "var(--font-display, Fraunces, serif)",
              fontStyle: "italic",
              fontSize: 6.5,
              opacity: 0.8,
              whiteSpace: "nowrap",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {ingText}
          </div>
        )}
        {!compact && (
          <div
            style={{
              marginTop: 4,
              paddingTop: 3,
              borderTop: `0.5px solid ${dark ? "rgba(253,249,242,.4)" : "rgba(43,38,81,.3)"}`,
              fontFamily: "var(--font-sans, Inter, sans-serif)",
              fontSize: 4.6,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.65,
              flexShrink: 0,
            }}
          >
            Physician&nbsp;Formulated&nbsp;&middot;&nbsp;All&nbsp;Natural
          </div>
        )}
      </div>
    </foreignObject>
  );
}

/* ---------- shared defs: shading ---------- */

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={sand} />
        <stop offset="0.18" stopColor={cream} />
        <stop offset="0.55" stopColor={shell} />
        <stop offset="0.85" stopColor={sand} />
        <stop offset="1" stopColor="rgba(43,38,81,0.12)" />
      </linearGradient>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#B9B4C4" />
        <stop offset="0.25" stopColor="#EDEAF2" />
        <stop offset="0.6" stopColor="#CFCAD9" />
        <stop offset="1" stopColor="#9E98AE" />
      </linearGradient>
      <radialGradient id={`${id}-floor`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="rgba(43,38,81,0.18)" />
        <stop offset="1" stopColor="rgba(43,38,81,0)" />
      </radialGradient>
    </defs>
  );
}

const Shadow = ({ id, cx, cy, rx }: { id: string; cx: number; cy: number; rx: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.18} fill={`url(#${id}-floor)`} />
);

/* ---------- formats ---------- */

// Squat salve tin: wider than tall, brushed-metal lid, paper label band.
function Tin({ sku, id }: { sku: Sku; id: string }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label={`${sku.name} packaging concept`}>
      <Defs id={id} />
      <Shadow id={id} cx={100} cy={132} rx={72} />
      {/* body */}
      <path d="M30 62 L30 118 A70 14 0 0 0 170 118 L170 62 Z" fill={`url(#${id}-body)`} stroke={ink} strokeWidth="1.4" />
      <ellipse cx="100" cy="118" rx="70" ry="14" fill="none" stroke="rgba(43,38,81,0.25)" strokeWidth="1" />
      {/* lid: slightly wider, metal */}
      <path d="M26 50 L26 62 A74 15 0 0 0 174 62 L174 50 Z" fill={`url(#${id}-metal)`} stroke={ink} strokeWidth="1.4" />
      <ellipse cx="100" cy="50" rx="74" ry="15" fill={`url(#${id}-metal)`} stroke={ink} strokeWidth="1.4" />
      <ellipse cx="100" cy="50" rx="60" ry="11" fill="none" stroke="rgba(43,38,81,0.3)" strokeWidth="0.8" />
      {/* label band */}
      <path d="M34 68 L34 112 A66 12 0 0 0 166 112 L166 68 Z" fill={cream} stroke={ink} strokeWidth="0.8" opacity="0.97" />
      <Label sku={sku} x={42} y={66} w={116} h={50} />
    </svg>
  );
}

// Standing cream tube, cap down.
function Tube({ sku, id }: { sku: Sku; id: string }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label={`${sku.name} packaging concept`}>
      <Defs id={id} />
      <Shadow id={id} cx={100} cy={136} rx={34} />
      {/* cap */}
      <rect x="74" y="112" width="52" height="22" rx="5" fill={ink} stroke={ink} strokeWidth="1.2" />
      <rect x="78" y="114" width="8" height="18" rx="3" fill="rgba(253,249,242,0.25)" />
      {/* body: crimped top flaring to shoulders */}
      <path d="M68 26 L132 26 L126 108 A26 8 0 0 1 74 108 Z" fill={`url(#${id}-body)`} stroke={ink} strokeWidth="1.4" />
      <line x1="68" y1="30" x2="132" y2="30" stroke={ink} strokeWidth="2.4" />
      {/* label panel */}
      <rect x="78" y="42" width="44" height="58" rx="3" fill={cream} stroke={ink} strokeWidth="0.7" />
      <Label sku={sku} x={76} y={42} w={48} h={58} compact />
    </svg>
  );
}

// Apothecary bottle with pump-free cap (oil bottle).
function Bottle({ sku, id }: { sku: Sku; id: string }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label={`${sku.name} packaging concept`}>
      <Defs id={id} />
      <Shadow id={id} cx={100} cy={138} rx={36} />
      {/* cap */}
      <rect x="88" y="18" width="24" height="16" rx="3" fill={ink} />
      {/* neck + shoulders + body */}
      <path d="M90 34 L90 44 C72 50 70 58 70 70 L70 126 A30 8 0 0 0 130 126 L130 70 C130 58 128 50 110 44 L110 34 Z"
        fill={`url(#${id}-body)`} stroke={ink} strokeWidth="1.4" />
      {/* label */}
      <rect x="76" y="72" width="48" height="50" rx="3" fill={cream} stroke={ink} strokeWidth="0.7" />
      <Label sku={sku} x={74} y={72} w={52} h={50} compact />
    </svg>
  );
}

// Wide jar (bath soak): glass-ish body, ink lid, generous label.
function Jar({ sku, id }: { sku: Sku; id: string }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label={`${sku.name} packaging concept`}>
      <Defs id={id} />
      <Shadow id={id} cx={100} cy={134} rx={56} />
      {/* lid */}
      <path d="M46 38 L46 52 A54 11 0 0 0 154 52 L154 38 Z" fill={ink} stroke={ink} strokeWidth="1.2" />
      <ellipse cx="100" cy="38" rx="54" ry="11" fill={ink} />
      <ellipse cx="100" cy="38" rx="54" ry="11" fill="rgba(253,249,242,0.12)" />
      {/* body */}
      <path d="M50 54 L50 120 A50 11 0 0 0 150 120 L150 54 Z" fill={`url(#${id}-body)`} stroke={ink} strokeWidth="1.4" />
      {/* label */}
      <path d="M56 62 L56 112 A44 9 0 0 0 144 112 L144 62 Z" fill={cream} stroke={ink} strokeWidth="0.8" />
      <Label sku={sku} x={60} y={62} w={80} h={48} />
    </svg>
  );
}

// Bar soap: stamped block.
function SoapBar({ sku, id }: { sku: Sku; id: string }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label={`${sku.name} packaging concept`}>
      <Defs id={id} />
      <Shadow id={id} cx={100} cy={122} rx={58} />
      <path d="M44 64 L156 64 Q164 64 164 72 L164 108 Q164 116 156 116 L44 116 Q36 116 36 108 L36 72 Q36 64 44 64 Z"
        fill={`url(#${id}-body)`} stroke={ink} strokeWidth="1.4" />
      <path d="M44 64 L60 48 L172 48 Q180 48 180 56 L164 72" fill={shell} stroke={ink} strokeWidth="1.2" opacity="0.9" />
      <Label sku={sku} x={48} y={66} w={104} h={46} compact />
    </svg>
  );
}

// Fallback for cotton / paper / gift-box and anything new: kraft carton.
function Carton({ sku, id }: { sku: Sku; id: string }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label={`${sku.name} packaging concept`}>
      <Defs id={id} />
      <Shadow id={id} cx={100} cy={130} rx={52} />
      <rect x="48" y="40" width="104" height="84" rx="4" fill={`url(#${id}-body)`} stroke={ink} strokeWidth="1.4" />
      <rect x="48" y="40" width="104" height="14" rx="4" fill={ink} />
      <rect x="58" y="62" width="84" height="52" rx="3" fill={cream} stroke={ink} strokeWidth="0.7" />
      <Label sku={sku} x={58} y={62} w={84} h={52} compact />
    </svg>
  );
}

const FORMAT_COMPONENTS: Record<string, (p: { sku: Sku; id: string }) => React.ReactElement> = {
  tin: Tin,
  tube: Tube,
  bottle: Bottle,
  jar: Jar,
  "soap-bar": SoapBar,
  cotton: Carton,
  paper: Carton,
  "gift-box": Carton,
  stick: Tube,
  carton: Carton,
};

export default function PackageMockup({ sku }: { sku: Sku }) {
  const Component = FORMAT_COMPONENTS[sku.format] ?? Carton;
  // gradient ids must be unique per instance
  const id = `pm-${sku.id}`;
  return <Component sku={sku} id={id} />;
}
