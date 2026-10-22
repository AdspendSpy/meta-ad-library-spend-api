# Originality rules

The rebuild models **how** a page persuades, never **what** it says or shows. Structure is free to learn from; expression, identity and proof belong to the advertiser.

## Allowed to take over

- Section order and the number of sections
- Layout grid, column splits, container widths, spacing rhythm, type scale
- Component types (hero with video slot, logo bar, comparison table, offer stack, FAQ accordion, sticky CTA)
- Interaction patterns (scroll reveals, tabs, carousels, sticky header behavior, pricing toggle)
- Persuasion structure (problem → mechanism → proof → offer → risk reversal → CTA), CTA rhythm, proof slot types and counts
- Generic UI conventions (a check icon in a list, a star row as a rating format) drawn freshly

## Forbidden

- Verbatim or near-verbatim text: headlines, body copy, CTA labels unique to the advertiser, FAQ answers, legal text. The overlap check enforces "no shared run of 8+ words"; passing it is the minimum, not permission to paraphrase line by line.
- Logos and wordmarks, brand and product names, trademarks, slogans
- Photos, videos, illustrations, icon sets drawn for the brand, screenshots of their product
- Testimonials, reviews, customer names, case-study numbers, ratings, counters, seals, certifications, press logos
- Tracking and analytics scripts, pixels, tag managers, chat widgets, A/B tools
- Form `action` URLs, checkout links, API endpoints, hidden fields
- Hotlinks to any advertiser asset (images, fonts, CSS, scripts); no `<img src>` or `url()` pointing at their host or CDN
- The advertiser's brand color combined with its wordmark, logo or distinctive trade dress
- Publishing or deploying anything from `design-references/`

## Proof

Proof comes **only from the user**: their testimonials, their numbers, their client logos, their guarantees. Never invent a testimonial, a customer count, a rating, a "featured in" logo or a guarantee, and never reuse the advertiser's. If the user has none yet, the slot stays a visible placeholder and the report lists it.

## Placeholder convention

Every missing item is a visible, searchable marker in the page:

```
[[PLACEHOLDER: <what is needed> — <format/length hint>]]
```

Examples:

- `[[PLACEHOLDER: hero headline — your main promise, max 10 words]]`
- `[[PLACEHOLDER: customer video testimonial 2 — name, result, 30–60 s, 9:16]]`
- `[[PLACEHOLDER: product photo — 4:5, on light background]]`
- `[[PLACEHOLDER: guarantee — your real refund terms]]`

Image placeholders are neutral blocks with the correct aspect ratio and the marker as visible label. Placeholders never contain the advertiser's text.

## Copy

Write copy from the user's offer brief, in the user's language, for the same persuasion job as the original section. Do not translate or reword the original sentence by sentence; start from the job ("make the reader feel the cost of the problem") and the user's facts.

## Checks before delivery

1. The advertiser's hostname and bare domain: 0 hits in `index.html`, `css/`, `js/`.
2. `node <skill-dir>/scripts/overlap-check.mjs research/original-text.txt index.html` exits 0.
3. No `<script>` other than the Tailwind CDN, the page's own `js/main.js` and libraries the user approved.
4. Every form posts to the user's CTA target or has no action plus a placeholder note.
5. All remaining `[[PLACEHOLDER: …]]` markers are listed in the report.
