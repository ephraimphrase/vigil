# Vigil Design Brief

Source of truth: the marketing homepage. Everything below is extracted from it. The dashboard must read as the same instrument — mission-control / blueprint aesthetic, not generic SaaS dashboard.

---

## 1. Identity

**Concept:** surveillance instrument. Precision tooling on a dark blueprint. The page looks like a schematic being annotated — hairline grid lines, corner registration nodes, bracket-cornered measurement frames, monospace readouts. Warmth comes from the violet glow and the rounded display type; everything else is cold and exact.

**One-line test for any new UI:** would this look at home on a technical drawing? If it looks like a Dribbble card, it's wrong.

---

## 2. Color

| Token | Value | Use |
|---|---|---|
| `bg-base` | near-black purple, ~`#0D0714`–`#120A1A` | page background |
| `bg-panel` | `#1E1425` | raised panels / annotation boxes |
| `violet` | `#9259DA` | primary accent, glows, gradient stop |
| `violet-bright` | lighter lavender (existing token) | eyebrow text, stat numerals, gradient stop |
| `border-hairline` | `#CAC0D5` @ 20% | ALL borders and dividers |
| `node-dot` | `#9F95AB`, glow `0 0 3.76px #9259DA` | corner registration dots |
| `text-body` | near-white | headings |
| `text-muted` | existing token (grey-lavender) | body copy, stat labels |
| `fade-stop` | `#55416E` | bottom stop of text fade gradient |

**Status scale (score bands — reuse everywhere in the dashboard):**

| Band | Color | Meaning |
|---|---|---|
| 80–100 | green | Hold |
| 60–79 | lime/yellow-green | Reduce 25% |
| 40–59 | amber | Reduce 50% |
| <40 | red/pink | Full exit |

Status colors appear ONLY as mono range labels and small indicators — never as card fills or large surfaces. The palette stays violet-dominant; status color is a thin signal on top.

**Rules:**
- Backgrounds get atmosphere: radial violet glow + faint 1px blueprint grid lines (the `bg.svg` treatment). Never flat solid panels floating on flat solid backgrounds.
- No shadows for elevation. Hierarchy = hairline borders + panel tint. No glassmorphism, no blur, no white.

---

## 3. Typography

Three voices, strictly separated:

1. **Display** (`font-display`, rounded geometric bold) — headings only. Tight leading (`1.04`), tight tracking. Sentence case with a hard period: "Every signal, all the time." "Nothing slips past Vigil."
2. **Mono** — all data. Numbers, score ranges, stat numerals, eyebrow labels, timestamps. If it's a value, it's mono. Eyebrows: mono, uppercase, `tracking-wider`, `text-xs`, violet-bright, preceded by a 1.5px violet dot.
3. **Sans** — body copy and UI labels only.

**Gradient text treatments:**
- Accent word in headings: `bg-gradient-to-r from-violet-bright to-violet bg-clip-text`.
- Annotation/tooltip copy: vertical fade `from-white to-[#55416E] to-60%` — text literally fades into the dark, like ink running out.

---

## 4. Signature Motifs

These are the brand. Reuse them or the dashboard won't look like Vigil.

**a) Corner-node frame.** Rectangle with `border-hairline`, `rounded-none`, and four 12px (`h-3 w-3`) `node-dot` circles positioned `-1.5` outside each corner, each with the violet glow shadow. Used on: stat strips, annotation boxes, key dashboard panels. This is the hero motif.

**b) Bracket corners.** Cards whose border is only four L-shaped corner strokes (viewfinder / crop-mark style), body otherwise borderless on dark. Used on the decision-logic cards. Dashboard use: score cards, protocol cards.

**c) Blueprint rules.** Full-bleed 1px hairlines crossing the layout, plus a left vertical rule on callout/quote text (violet, 2–3px).

**d) Chips.** Pill outline, hairline border, sans text, transparent fill. Signal tags ("TVL trend", "GitHub commit velocity"). Grouped under mono uppercase section labels ("ONCHAIN" / "OFFCHAIN").

**e) Stat readout.** Mono bold numeral in violet-bright, small muted sans label underneath. Stats sit in a corner-node frame divided by hairlines (`divide-x`), not in separate cards.

---

## 5. Geometry & Layout

- **Sharp rectangles everywhere** (`rounded-none`) — frames, cards, panels. Pill radius ONLY on buttons and chips. Nothing in between; no `rounded-lg` middle ground.
- Marketing pages: container `max-w-[1180px]`, `px-5 sm:px-8`, generous section gaps (`mt-24`). **Do not copy this spacing into the dashboard** — see §7a. The invariant is the principle: density inside frames, air between them. How much air is context-dependent.
- Asymmetry allowed on marketing surfaces (overlapping annotation boxes). Dashboard layouts stay on-grid.

---

## 6. Components

**Primary button:** full pill, light lavender gradient fill, dark text, trailing arrow (↗) in a circle.
**Ghost button:** full pill, dark fill, hairline border, white text.
**Annotation box:** corner-node frame + `bg-panel` + fading gradient text. This becomes the dashboard tooltip/insight pattern.

---

## 7. Dashboard Translation

### 7a. The dashboard is NOT the homepage

The homepage persuades; the dashboard operates. Carry over the *language* (§2–§4), not the *composition*. Concretely:

- **Density.** Homepage spacing is theatrical. Dashboard runs ~2× denser: tighter padding inside panels (`px-4 py-3` territory), `text-sm` as the working size, compact gaps between panels. It should feel like a terminal, not a brochure.
- **Display font is rationed.** One display-font heading per view, maximum (page title or hero metric). Everything else is sans labels and mono data. No marketing-headline copywriting ("Every signal, all the time.") inside the app — labels are utilitarian: "Protocols", "Health score", "Recent actions".
- **Motif budget.** Corner-node frames: 1–2 per view, on the primary panel(s) only. Bracket corners: repeating cards (protocol list, score cards). Everything else: plain hairline border or a bare divider. If every container has decoration, none of it reads as signal.
- **App shell.** The homepage has no nav — invent the shell from the same language: dark sidebar or topbar on `bg-base`, hairline-separated, wordmark in display font, nav items in sans with the active item marked by a violet left rule (2px) — NOT a filled/rounded highlight pill. Eyebrow-style mono uppercase for nav section labels.
- **Interaction states.** Hover: border brightens (`#CAC0D5/20` → `/40`) or panel tint lifts one step — no scale transforms, no glow-on-everything. Focus: 1px violet outline. Selected: violet left rule + slight panel tint. Motion is minimal and functional; the pulsing violet dot is the only ambient animation.
- **Loading/empty states.** Skeletons are hairline-bordered rectangles with a faint violet shimmer, mono "—" placeholders for values. Empty states: mono uppercase label + one muted sans line. No illustrations, no sad-face icons.

### 7b. Component mapping

- Health scores: mono numerals, band color as a thin indicator (dot/left rule/range label), card itself stays dark violet.
- Charts (recharts): hairline `#CAC0D5/20` grid, violet series, status colors only for band thresholds. No filled gradients under lines unless violet @ low opacity. Mono tick labels.
- Tables: hairline row dividers, no zebra striping, mono for every numeric column.
- Panels: corner-node frames for primary panels, bracket corners for repeating cards, plain hairline for tertiary.
- Live/streaming data: mono, small, with the pulsing violet dot from the eyebrow pattern.
- Decision events ("Reduced 25%"): reuse the decision-card language — mono range, display-font action, muted sans description.

---

## 8. Don'ts

- No rounded cards, no drop shadows, no glassmorphism/backdrop-blur.
- No status colors as fills or backgrounds.
- No proportional-font numbers. Ever.
- No white or light surfaces.
- No emoji, no icon soup — the design carries meaning through type + hairlines.
- No generic component-library defaults (shadcn look). Every container should be one of the motifs in §4.

---

## 9. Debt to fix before dashboard work

*(Only relevant if building in the existing homepage repo. Skip if greenfield — but still define the tokens in item 1 and build the components in item 2 first.)*

1. `#9259DA`, `#1E1425`, `#CAC0D5`, `#9F95AB`, `#55416E` are hardcoded inline. Promote to theme tokens now — the dashboard will multiply every hardcoded hex.
2. The four corner-dot `<span>`s are copy-pasted per frame. Extract `<CornerFrame>` (and `<BracketCard>`) components before building anything else.
3. The hero annotation box is absolutely positioned with `top-[24rem] right-[1rem] z-[99999]` — magic numbers, unresponsive, and a z-index of 99999 is a confession. Anchor it to the robot container instead.