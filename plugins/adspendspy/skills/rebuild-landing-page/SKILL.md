---
name: rebuild-landing-page
description: "Rebuild a landing page that carries real estimated Meta ad spend for your own offer, using AdSpendSpy MCP data. Picks a top-spending landing page (or takes a URL), explains why it converts from ad hooks, spend and run time, then rebuilds its section structure and layout as plain HTML + Tailwind with the user's own copy, brand and images. Use when the user wants to rebuild, remix, model or ‘copy’ a competitor's landing page, build a landing page like one that works, or asks which landing page of an advertiser performs best. Also does teardown-only analysis. Requires the AdSpendSpy MCP server (account or public demo)."
---

# Rebuild Landing Page

Turn a landing page that an advertiser keeps paying Meta traffic into a **remix for the user's own offer**. You keep what makes it work (section order, layout rhythm, component types, interaction patterns, persuasion structure) and replace everything that belongs to the advertiser (copy, logos, photos, testimonials, trademarks, tracking, form endpoints) with the user's material or marked placeholders.

What makes this different from a website clone is the **data**: AdSpendSpy tells you how much estimated spend points at the page, how many ads are still active, how long they have run, and which hooks, headlines and CTAs feed it. Use that evidence to explain *why* each section exists, and keep that persuasion job in the rebuild.

This is a remix, never a pixel clone. Read `references/originality-rules.md` before building anything.

## Modes

- **Rebuild (default):** steps 1–10.
- **Teardown only:** the user wants the analysis, not a page ("why does this page work", "which landing page performs best"). Run steps 2–6, deliver `research/TEARDOWN.md` plus the report table, then stop.

## 1. Output structure

Everything lands in one folder per page, inside the user's working directory:

```
landing-rebuild/<slug>/
  index.html                      # the rebuilt page (Tailwind CDN + inline config)
  css/styles.css                  # what utilities cannot express (keyframes, one-off values)
  js/main.js                      # vanilla behaviors (tabs, accordions, sticky CTA, reveals)
  assets/                         # ONLY user-owned files or neutral placeholders
  research/
    EVIDENCE.json                 # every AdSpendSpy tool result used, verbatim
    TEARDOWN.md                   # why the page works (references/teardown-template.md)
    PAGE_TOPOLOGY.md              # sections top to bottom, interaction model per section
    components/<section>.spec.md  # one spec per section, the build contract
    original-text.txt             # visible text of the original, for the overlap check
  design-references/              # screenshots of the original: local reference only, never publish
```

`<slug>` = advertiser hostname plus path, lowercased, non-alphanumerics replaced by `-` (for example `example-com-offer`).

## 2. Preflight

1. **AdSpendSpy tools.** Find the tools whose names end in `get_top_landingpages_stats`, `get_top_ads_stats`, `list_brand_ads`, `get_ad_details`, `list_tracked_brands`, `search_tracked_brands` and `track_brand`. Clients add a server prefix (for example `mcp__adspendspy__…` or `adspendspy.…`); match on the suffix. If none exist, tell the user the AdSpendSpy MCP server must be connected and stop.
2. **Demo or account mode.** If the tool descriptions start with `Public demo:`, you are in demo mode: only Alex Hormozi, `page_id` `116482854782233`, is available and `track_brand` does not exist. Say so once, then run the whole workflow on that advertiser. Otherwise you are in account mode.
3. **MCP prompts.** The server also offers the prompts `rebuild_landing_page` and `landing_page_teardown`. If the client exposes them and the user started from one, follow its arguments; this skill stays the procedure.
4. **Browser tool.** Use the first available, in this order: a browser MCP that can evaluate JavaScript (Claude in Chrome, Playwright MCP, Chrome DevTools MCP, the Codex browser, or a comparable CLI such as `agent-browser`). Without one, fall back to fetching the HTML plus the stored `screenshot_full_url`; say that computed styles and behaviors are then approximations, and mark them as such in every spec.
5. **Offer brief.** The rebuild needs: brand name, product, audience, main promise, price/offer, the user's own proof (testimonials, numbers, logos, guarantees they really have), CTA target URL, language. If anything is missing, ask **once**, in one bundled question. Missing items become placeholders; never invent them.
6. **Stack.** Default: vanilla HTML + Tailwind CDN + vanilla JS, no build step. If the working directory has a `package.json` that depends on `next`, `astro`, `vite`, `react` or `svelte`, ask once whether to build inside that stack instead (components plus the project's styling setup). The research files stay identical either way.

## 3. Choose the page

If the user gave a URL, call `get_top_landingpages_stats` with `q` = a distinctive part of that URL to fetch its numbers, then continue at step 4.

Otherwise call `get_top_landingpages_stats` with `timeframe: "90d"`, `active_only: true`, `limit: 10`, plus `page_id` when an advertiser is known. Show the shortlist as a table:

| # | Landing URL | Advertiser | Est. spend (EUR) | Ads | Active ads | Longest run (days) |
|---|---|---|---|---|---|---|

Pick the highest-spend row that has `active_ads_count > 0` unless the user chooses another. Label spend as an estimate (see `references/data-semantics.md`).

**Account mode, advertiser by name:** look it up with `search_tracked_brands` (or `list_tracked_brands`). If it is not tracked, explain that `track_brand` consumes one tracking slot and that ads import in the background, and call it **only after the user explicitly confirms**. Never call it on your own initiative.

## 4. Evidence

Collect the data that explains the page, and save every raw result into `research/EVIDENCE.json` (keys: `landing_page`, `top_ads_stats`, `ads_for_page`, `ad_details`, `fetched_at`, `mode`).

1. `get_top_ads_stats` with the advertiser's `page_id`, `timeframe: "90d"`, `active_only: true` → hooks, headlines, CTAs and media types that carry the most spend.
2. `list_brand_ads` with `page_id`, `active_only: true`, `limit: 50` (follow `pagination.next_cursor` while useful). Keep the ads whose `landing_url` points to the chosen page (compare host and path, ignore query strings and tracking parameters).
3. `get_ad_details` with the `internal_ad_id` of the top 3 of those ads by `estimated_spend` → full text, CTA, run time, transcript.

If no ads match the page, say so in the teardown and rely on the advertiser-level stats.

## 5. Extraction

Follow `references/extraction.md`, using the snippets in `scripts/` (`asset-inventory.js`, `extract-styles.js`, `width-probe.js`; set `TARGET_HOST` first). Order matters:

1. Reconnaissance screenshots into `design-references/` (390, 1440, 1920).
2. **Interaction model first:** scroll the whole page before clicking anything.
3. Topology into `research/PAGE_TOPOLOGY.md`.
4. Width probe at 390 / 1440 / 1920 and fit each block to a width model.
5. Per section: computed styles, states, media slots → `research/components/<section>.spec.md`.
6. Save the visible page text to `research/original-text.txt`.

Original images, videos and logos are **reference only**: record their role, size and position in the spec; never download them into `assets/` and never hotlink them.

## 6. Teardown

Write `research/TEARDOWN.md` with `references/teardown-template.md`, reading every number through `references/data-semantics.md`. Every claim about why a section works cites a value from `EVIDENCE.json` or says plainly that it is a design judgment.

In teardown-only mode, stop here and report (step 10, without the build lines).

## 7. Build

**Foundation first, sequentially:**

- `index.html` head: Tailwind CDN `<script>`, inline `tailwind.config` with the **user's** colors and fonts, `css/styles.css`, `<script src="js/main.js" defer>` before `</body>`.
- Colors and fonts come from the user's brand. Without a brand, propose a palette and font pairing and let the user confirm. Never take the advertiser's brand color together with its wordmark or logo.
- No analytics, pixels, chat widgets or third-party scripts of the advertiser. No form `action` pointing anywhere but the user's CTA target or a placeholder.

**Then section by section, top to bottom:** read the spec → build the section with Tailwind utilities (arbitrary values for exact numbers from the spec) → add its behavior to `js/main.js` → check it renders.

Each section does **the same persuasion job with the user's own material**:

- Original headline promise → the user's main promise, written fresh, in the user's language.
- "3 video testimonials" → 3 testimonial slots in the same layout, each `[[PLACEHOLDER: video testimonial 1 — customer name, result, 30–60 s]]` unless the user supplied real ones.
- Logo bar → a logo bar for the user's real clients/press, or a placeholder strip.
- Guarantee badge, counter, rating → only with the user's real values, otherwise a placeholder.

Images: user-owned files go into `assets/`; otherwise use neutral placeholder blocks with the right aspect ratio and a `[[PLACEHOLDER: …]]` label describing the needed image.

Complex sections (3+ sub-components or a spec over ~150 lines) may go to builder sub-agents if the client supports them: pass the full spec inline, the screenshot path, the user's copy for that section and the originality rules; each writes a fragment to `research/components/<section>.html` and you assemble in topology order.

## 8. QA

You verify; the user approves a finished page.

1. Render `index.html` in the browser tool at **390 px and 1440 px**. Read `innerWidth` back to confirm the width took effect. Compare layout rhythm and section order against `design-references/` (structure must match; copy, imagery and brand must not).
2. **No console errors.**
3. **Drive every interaction live:** tabs switch, accordions open, carousels scroll (read `scrollLeft` back), sticky CTA appears at its trigger, reveal animations fire. "The spec says so" is not proof.
4. **Hostname check:** search `index.html`, `css/` and `js/` for the advertiser's hostname (and its bare domain). Must be **0 hits**.
5. **Overlap check:** `node scripts/overlap-check.mjs research/original-text.txt index.html`. The script path `scripts/overlap-check.mjs` is relative to **this skill's folder**; the two file arguments are relative to the page folder. So from inside `landing-rebuild/<slug>/` run
   `node <skill-dir>/scripts/overlap-check.mjs research/original-text.txt index.html`
   where `<skill-dir>` is the folder containing this `SKILL.md`. It must report **no shared run of 8 or more words** (exit code 0). On exit 1, rewrite the listed passages and run it again.
6. Fix every failure and repeat until all checks pass.

## 9. Originality rules (short)

Details and edge cases: `references/originality-rules.md`.

- **Allowed:** section order, layout grid, component types, interaction patterns, persuasion structure, spacing and type scale.
- **Forbidden:** verbatim or near-verbatim text, logos and wordmarks, photos/videos/illustrations, testimonials, numbers and seals, brand and product names, tracking and analytics scripts, form actions, hotlinks to the advertiser's assets.
- **Proof comes only from the user.** Never invent testimonials, customer counts, ratings, press logos or guarantees.
- Everything missing is a visible `[[PLACEHOLDER: …]]`.
- `design-references/` screenshots stay local and are never published or deployed.

## 10. Report

Keep it short:

1. Path to `index.html` (relative to the working directory). To show it, open the file in the browser tool or give the user the path.
2. Teardown table: one row per section with job, pattern kept, and evidence.
3. Open placeholders: every `[[PLACEHOLDER: …]]` still in the page, as a list the user can fill.
4. QA results: widths checked, console clean, interactions driven, hostname hits 0, overlap check passed.
5. The data line: `Data: AdSpendSpy — estimated spend, cumulative EUR estimate`.

## What not to do

- Don't build before the spec and the teardown exist.
- Don't build click tabs when the original is scroll-driven (or vice versa). Scroll first, click second.
- Don't present `timeframe` results as "spend in the last 90 days"; spend is cumulative.
- Don't read a spend of 0 as "no spend"; it can mean no estimate is available.
- Don't call `track_brand` without the user's explicit yes.
- Don't paraphrase the original line by line; write from the user's offer, keeping only the job of each section.
