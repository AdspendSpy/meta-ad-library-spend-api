---
name: meta-ad-library-skill
description: "Meta Ad Library skill for AI agents: look up any advertiser's Facebook and Instagram ads with estimated ad spend through AdSpendSpy (MCP server or REST API). Use when the user asks what a brand or competitor runs on Meta, how much it spends on Facebook or Instagram ads, which creatives, hooks, headlines or landing pages get the most spend, or wants to compare advertisers. Spend is an AdSpendSpy estimate, never a figure reported by Meta."
metadata:
  last-updated: "2026-11-07"
---

# Meta Ad Library Skill by AdSpendSpy

This Meta Ad Library skill lets your agent answer the questions a media buyer asks in the Meta Ad Library, plus the one the Ad Library cannot answer: **how much estimated spend sits behind each Facebook and Instagram ad.** The data comes from [AdSpendSpy](https://www.adspendspy.com), over its MCP server or its read-only REST API.

> **Freshness check:** If more than 90 days have passed since the `last-updated` date in the frontmatter, tell the user this skill may be outdated and point them to the source below.

Source: [github.com/adspendspy/meta-ad-library-spend-api](https://github.com/adspendspy/meta-ad-library-spend-api)

## Install the Meta Ad Library skill

```bash
npx skills add adspendspy/meta-ad-library-spend-api --skill meta-ad-library-skill
```

The skill describes the tools; the data comes from the AdSpendSpy MCP server. Connect it once:

| Agent | Command |
|---|---|
| Claude Code | `claude mcp add --transport http adspendspy https://www.adspendspy.com/mcp`, then `/mcp` → `adspendspy` → Authenticate |
| Claude Code plugin | `/plugin marketplace add adspendspy/meta-ad-library-spend-api` and `/plugin install adspendspy@adspendspy` |
| Codex, Cursor, other MCP clients | Streamable HTTP server `https://www.adspendspy.com/mcp` with header `X-API-Key: <key>` |
| Try without an account | `https://www.adspendspy.com/mcp-demo` (read-only, Alex Hormozi only) |

Create an API key at [adspendspy.com/settings.php](https://www.adspendspy.com/settings.php) (Account Settings → API Keys). Never print, log or commit the key; read it from `ADSPENDSPY_API_KEY`.

## What the Meta Ad Library skill returns

### Without signing in (one call per day)

| Tool | Answers |
|---|---|
| `search_advertisers` | Is this brand in AdSpendSpy? Returns `page_id`, category, logo |
| `get_advertiser_ads` | A tracked brand's active ads, up to 6 top ads and an estimated 30-day spend range |
| `find_similar_advertisers` | Tracked brands in the same category or niche |
| `compare_advertisers` | 2–6 tracked brands side by side |

After one call the server answers `401` with a sign-up link. Tell the user to sign up at [adspendspy.com](https://www.adspendspy.com/signup?utm_source=skill&utm_medium=skills_sh) and connect the account; do not retry, do not open new sessions to get more calls.

### With an AdSpendSpy account

| Tool | Answers |
|---|---|
| `list_tracked_brands`, `search_tracked_brands`, `check_brands_tracked` | Which advertisers the account tracks, with their string `page_id` |
| `list_brand_ads` | One advertiser's ads, newest first, with `estimated_spend` and `landing_url` |
| `get_ad_details` | One ad by `internal_ad_id`: full text, CTA, run time, EU/US spend estimates, reach, video transcript |
| `get_top_ads_stats` | Spend by hook, headline, CTA, media type and video length |
| `get_top_landingpages_stats` | Landing pages ranked by the estimated spend pointing at them |
| `list_new_ads`, `list_alerts`, `get_pending_alert_count` | New ads and spend alerts of tracked advertisers |
| `get_ad_lists`, `get_projects` | Saved swipe files and project groupings |
| `track_brand` | Starts tracking an advertiser (see Rules) |

## Workflow

1. Find the advertiser: `search_tracked_brands` (account) or `search_advertisers` (no sign-in). Use the exact brand name the user wrote; if only similar names come back, ask which one is meant. Never present one brand's ads as another's.
2. Pass the string `page_id` to `list_brand_ads` or `get_advertiser_ads`.
3. For one ad, pass `internal_ad_id` (not the Meta ad id) to `get_ad_details`.
4. For patterns across many ads, use `get_top_ads_stats` or `get_top_landingpages_stats` with `page_id` and `timeframe`.
5. Answer with the numbers, their meaning (below) and the line `Data: AdSpendSpy — estimated spend, cumulative EUR`.

## Meta ad spend estimates: read them right

- **Spend is a cumulative estimate in EUR**, derived from the reach Meta publishes for EU and UK ads. Write "estimated spend", never "spent" or "budget".
- **`timeframe` filters by last-seen date only.** `30d` means "ads seen in the last 30 days"; the spend is still their cumulative total.
- **0 or `null` means no estimate**, not zero spend. US-only ads often have no estimate.
- **Counts cover tracked data.** An account reads the advertisers it tracks; there is no hidden global total.

## Rules

- `track_brand` uses one of the user's tracking slots and imports ads in the background. Call it only after the user confirms, and say ads may take a moment to appear. There is no untrack tool in MCP.
- Every account tool call uses one API request (1,000 per key per day). Do not loop over all ads when a stats tool answers the question.
- Never invent advertisers, competitors, spend or ad text. If a brand is not tracked, say so.
- Media URLs are for analysis. Do not republish advertisers' creatives as the user's own.

## Related

- `rebuild-landing-page` skill in the same repository: turns a top-spending landing page into a page for the user's own offer.
- REST API, Python and TypeScript clients: [README](https://github.com/adspendspy/meta-ad-library-spend-api#readme), endpoint reference in `docs/ENDPOINTS.md`.
