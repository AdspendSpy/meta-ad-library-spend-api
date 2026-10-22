# Teardown template

`research/TEARDOWN.md` explains why the page converts well enough that the advertiser keeps paying for traffic to it. Every number comes from `research/EVIDENCE.json` and is read through `data-semantics.md`. Anything without data behind it is labelled **design judgment**.

Use the user's language for the prose. Quote ad hooks and headlines from the evidence only as short analysis citations inside this research file; they never enter the rebuilt page.

```markdown
# Teardown: <landing URL>

Advertiser: <brand_name> (page_id <page_id>) · Mode: <account | public demo> · Fetched: <date>

## Why the spend holds
| Signal | Value | Reading |
|---|---|---|
| Estimated spend (cumulative, EUR) | <total_spend> | Latest cumulative estimate across all ads pointing here; not spend per period. 0 = possibly no estimate. |
| Ads pointing here | <ads_count> | How many creatives the advertiser routes to this page |
| Active ads | <active_ads_count> | Still being paid for at last check |
| Longest run (days) | <max_days_running> | Long-running ads usually survive because they stay profitable |
| Last seen | <last_seen_at> | Freshness of the data |
| Advertisers | <brands_count> | >1 means several advertisers share this URL (affiliate/marketplace) |

One-paragraph verdict: what these signals together say about the page (scale, durability, freshness), with the estimate caveat.

## Hook → headline match
| Top ad hook / headline (evidence) | Ad spend share | Page element that continues it | Match |
|---|---|---|---|
| <hook_text from hooksStats or ad details> | <total_spend of that hook> | <hero headline / subhead / first section> | strong / partial / none |

Explain the message continuity: does the first screen repeat the promise, the audience or the mechanism the ads sell? Mismatches are worth noting too.

## Above the fold (390 and 1440)
- Headline type: <outcome promise | problem callout | curiosity | social proof>
- Subhead job:
- Primary CTA: <label type, position, contrast, repeated?>
- Proof visible without scrolling: <rating, logo bar, counter, testimonial, none>
- Visual: <product shot, founder, UGC video, demo, illustration>
- What a visitor knows after 5 seconds:

## Section table
| # | Section | Job (what it must make the visitor believe/do) | Key element | Evidence | Reusable pattern |
|---|---|---|---|---|---|
| 1 | hero | promise + first CTA | <element> | hook "<…>" carries <spend> | outcome headline + single CTA + proof strip |
| 2 | … | | | | |

"Evidence" is a value from EVIDENCE.json or "design judgment". "Reusable pattern" describes the structure the rebuild keeps, never the original text.

## Offer mechanics
- Offer type: <free trial, discount, bundle, lead magnet, call booking, direct purchase>
- Price presentation: <anchoring, per-day framing, tiers, hidden until checkout>
- Risk reversal: <guarantee type and placement>
- Urgency/scarcity: <countdown, limited spots, none> and whether it is real or decorative
- Stack/bonuses: <count and order>

## Proof types
| Proof type | Count | Placement | Format |
|---|---|---|---|
| Testimonials | | | text / photo / video |
| Numbers (customers, ratings) | | | |
| Logos / press | | | |
| Seals / certifications | | | |
| Founder / authority | | | |

For the rebuild, each row becomes a slot the user fills with **their own** proof or a placeholder.

## CTA chain
| Position | CTA label type | Destination | Matches ad CTA (`cta_text` evidence)? |
|---|---|---|---|
| hero | | | |
| mid-page | | | |
| sticky / final | | | |

Count CTAs, note repetition rhythm (every N sections), and whether the ad CTA (e.g. "Learn more" vs "Shop now") sets the same expectation as the page.

## Interaction patterns worth keeping
- <sticky CTA after hero, tabbed comparison, FAQ accordion, autoplay testimonial carousel, …> with interaction model

## What the rebuild keeps / changes
- Keeps: section order, layout rhythm, component types, CTA rhythm, proof slot types
- Changes: all copy (user's offer), brand, imagery, proof (user's only), tracking, form endpoints
```
