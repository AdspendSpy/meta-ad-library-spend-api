# Extraction

How to read the original page so the rebuild has the same structure, rhythm and behavior. Condensed from a full website-cloning workflow, minus asset downloading: in a remix, original media is reference only.

## Browser reliability (applies to every browser tool)

- **Isolated session per agent.** Use a fresh, named session/profile/tab for extraction, another for QA of the rebuild, and one per builder sub-agent. Shared sessions steal the active tab and silently contaminate results.
- **Context check before every eval.** Every snippet in `scripts/` starts by comparing `location.hostname` with `TARGET_HOST` and returns an `ERROR` object otherwise. Never trust data that failed the check; reopen the target and run again.
- **Stability check.** Reload the target 2–3 times and compare `document.title`, the first `h1` and `document.documentElement.scrollHeight`. If they differ, the page is A/B testing or you were on the wrong tab; resolve that before speccing.
- **Read back `innerWidth`** (and `innerHeight`) after opening or resizing. Some tools ignore the requested viewport; every rect you measure is in the real width.
- **Full-page screenshots lie** about `position: fixed` / `sticky` elements and `vh`-based heights. Use them for overview only; check geometry with DOM rect probes at a real viewport and use viewport-sized screenshots for detail.
- **Lazy loading.** Media loads and unloads by viewport. Run `scripts/asset-inventory.js` at several scroll positions (top, every ~one viewport, bottom); it accumulates a union in `window.__rlpAssets`.
- **Snippet format.** Each snippet is one expression (an IIFE) that returns a JSON string. Paste it into the tool's evaluate call. If the tool expects a function instead of an expression, wrap it as `() => <snippet>`.
- **Without a JS-capable browser** (HTML fetch + `screenshot_full_url` fallback): derive topology from the HTML landmarks and headings and the screenshot, mark every style value in the specs as `approx.`, and note that behaviors are unverified.

## Phase 1: Reconnaissance

1. **Screenshots** of the original at 390, 1440 and 1920 px into `design-references/` (`full-1440.png`, `hero-390.png`, …). Local reference only, never published.
2. **Interaction model first. Scroll before you click.** Scroll top to bottom slowly and note what changes by itself: header shrink/background at a scroll threshold, reveal animations, sticky elements, scroll-driven tabs or progress, auto-advancing carousels, countdowns. Only then click and hover: tabs, accordions, modals, video play buttons, pricing toggles. Record per section: `static | scroll-driven | click-driven | hover | time-driven`, and the mechanism (IntersectionObserver, `position: sticky`, scroll listener, CSS `:hover`, timer).
3. **Global tokens** for structure, not identity: type scale (sizes, weights, line heights), spacing rhythm, container width, radii, shadow depth. Note the advertiser's colors and fonts only to describe contrast and hierarchy; the rebuild uses the user's brand.
4. **Inventory:** run `scripts/asset-inventory.js` at several scroll positions. It lists media slots (role, size, aspect ratio, position, layering), inline SVG count, fonts, forms (action, fields) and third-party script hosts. Forms and scripts are listed so you can document and **exclude** them.
5. **Visible text:** save the page text to `research/original-text.txt` with
   `(() => { const TARGET_HOST = 'example.com'; if (!location.hostname.endsWith(TARGET_HOST)) return JSON.stringify({ ERROR: 'wrong page', url: location.href }); return document.body.innerText; })()`
   (in the fallback, save the fetched HTML; the overlap check strips tags itself).

## Phase 2: Topology and width behavior

**Topology** → `research/PAGE_TOPOLOGY.md`: every section top to bottom with a working name (hero, logo-bar, problem, mechanism, offer-stack, testimonials, faq, final-cta, footer…), fixed/sticky overlays vs flow content, z-layers, and each section's interaction model.

**Width probe:** run `scripts/width-probe.js` at **390, 1440 and 1920** px width, and for the hero additionally at two window heights (for example 800 and 1100). Fit each block to one of these models:

| Model | Signature in the numbers | Build as |
|---|---|---|
| Fluid with max-width cap | width grows with viewport until a cap, then margins grow | `max-w-[Npx] mx-auto` + side padding |
| Container = cap + gutter | content left = `(vw − maxW)/2 + pad` across widths | solve maxW and pad from two datapoints |
| Viewport-height hero | hero height changes with window **height**, not width | `min-h-[80vh]` (or the measured ratio) |
| Clamped size | grows with vw, then stops (e.g. 800@1440, 1000@1920, 1000@2560) | `min(55.5vw, 1000px)` / `clamp()` |
| Fixed image height | same height at every width, image crops sideways | fixed height + `object-cover`, not aspect-ratio |
| Truly fixed column | identical px width at every viewport | keep the fixed width |
| Percentage decoration | decoration `left` spreads as vw grows; `left/containerWidth` constant | `left: N%` |

Check: the predicted document height at each probed width should match the measured `docHeight` within a few percent.

## Phase 3: Section spec

For each section, top to bottom: **extract → write spec → (later) build.**

1. Viewport screenshot of the section into `design-references/<section>-1440.png` (and `-390`).
2. Run `scripts/extract-styles.js` with `SELECTOR` set to the section container (then to complex children). Never hand-measure.
3. **Every state:** for stateful elements, extract at state A, trigger (scroll past threshold, click tab, hover), extract again. The diff is the behavior spec. For tabs, record each tab's content type and count (not its text).
4. Media slots: role (product shot, founder photo, UGC video, chart, icon row), aspect ratio, layering (background + foreground + overlay = 3 slots).
5. Assess complexity: more than ~150 spec lines or 3+ distinct sub-components → split the section.

Spec template, `research/components/<section>.spec.md`:

```markdown
# <Section> spec

## Overview
- Target: section in index.html, id="<section-id>"
- Screenshot: design-references/<section>-1440.png
- Interaction model: <static | scroll-driven | click-driven | hover | time-driven> (<mechanism>)
- Persuasion job: <what this section must make the visitor believe or do>
- Evidence link: <hook/headline/CTA from EVIDENCE.json it continues, or "design judgment">

## Structure
<element hierarchy: what contains what, which Tailwind utilities per element>

## Computed styles (getComputedStyle)
### Container
- display / padding / max-width / gap / background … → Tailwind mapping
### <Child>
- font-size / line-height / weight / color role … → Tailwind mapping

## States & behaviors
### <Behavior>
- Trigger: <scroll 80px | IntersectionObserver threshold 0.35 | click .tab | hover>
- State A → State B: <property: before → after>
- Transition: <duration easing>
- Vanilla JS approach: <class toggle on scroll | IntersectionObserver | CSS :hover>

## Media slots (reference only, nothing downloaded)
- <slot>: <role>, <aspect ratio>, <position/layering> → user asset or [[PLACEHOLDER: …]]

## Content outline (not verbatim)
- Headline: <type, e.g. outcome promise + timeframe, ~8 words>
- Body: <type and length>
- CTA: <verb-first, ~3 words, links to CTA target>
- Proof: <type and count, e.g. 3 video testimonials>

## Responsive
- 1440: <layout> · 390: <changes>, breakpoint ~<N>px
```

Text is captured in the spec only as a **content outline** (type, length, role). The verbatim original lives in `research/original-text.txt` for the overlap check and nowhere else.

## Pre-build checklist (per section)

- [ ] Spec written, all headings filled ("N/A" only when truly nothing applies)
- [ ] Style values from `getComputedStyle()` (or marked `approx.` in the fallback)
- [ ] Interaction model and every state recorded, with trigger and transition
- [ ] Width model chosen from the probe
- [ ] Media slots mapped to user assets or placeholders
- [ ] Persuasion job and evidence link filled
