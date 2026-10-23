# AdSpendSpy plugin for Claude Code and Codex

Research Meta (Facebook and Instagram) ads and estimated ad spend from inside your coding agent,
and rebuild the landing pages that get the most ad spend for your own offer.

## What you get

| Part | What it does |
|---|---|
| **MCP server `adspendspy`** | Your account: `https://www.adspendspy.com/mcp`. Claude Code signs in with your AdSpendSpy login (OAuth); Codex uses your API key in the `X-API-Key` header |
| **MCP server `adspendspy-demo`** | Public demo without a key: `https://www.adspendspy.com/mcp-demo`, covers Alex Hormozi only (page_id `116482854782233`) |
| **MCP prompts** | `rebuild_landing_page` and `landing_page_teardown`. Fetching a prompt never consumes API quota |
| **Skill `rebuild-landing-page`** | Picks a top-spending landing page, maps its structure and layout, and rebuilds it for your own offer with original copy. Teardown-only mode analyses without building |

### MCP tools

| Tool | Purpose |
|---|---|
| `list_tracked_brands` | Your tracked advertisers with their `page_id` |
| `search_tracked_brands` | Search tracked advertisers by name, page ID or stored Facebook URL |
| `check_brands_tracked` | Check whether page IDs are tracked by your account |
| `track_brand` | Track a known advertiser (`page_id` + `brand_name`); uses one of your account's tracking slots |
| `list_brand_ads` | Creatives of one tracked advertiser, paginated |
| `get_ad_details` | One ad by its internal ID, including demographics |
| `get_top_ads_stats` | Estimated spend (EUR) by media type, run duration, CTA, hook and headline |
| `get_top_landingpages_stats` | Landing pages ranked by estimated spend, with screenshot URL when stored |
| `get_ad_lists` | Your saved lists (swipe files) |
| `get_projects` | Your projects (brand groupings) |
| `get_pending_alert_count` | Number of pending alerts |

The demo server exposes the read-only subset for Alex Hormozi; `track_brand` and account data need
the account server. Spend estimates exist only for EU and UK ads; a zero can mean "not measured".

## Install

See [INSTALL.md](INSTALL.md) for details and sources. Short version:

**Claude Code**

```text
/plugin marketplace add adspendspy/meta-ad-library-spend-api
/plugin install adspendspy@adspendspy
```

**Codex**

```bash
codex plugin marketplace add adspendspy/meta-ad-library-spend-api
codex plugin add adspendspy@adspendspy
```

**claude.ai** (skill only): upload `dist/rebuild-landing-page.zip` under Settings → Capabilities →
Skills. Build the ZIP with `node scripts/package-skill.mjs`.

## Sign in

**Claude Code:** after installing, run `/mcp`, choose `adspendspy` and select Authenticate. Your
browser opens AdSpendSpy; sign in and allow access. No API key is needed, and you can revoke
access any time under Settings → Connected apps.

**Codex:** create a key under **Account Settings → API Keys** at
[adspendspy.com/settings.php](https://www.adspendspy.com/settings.php) and export it before you
start Codex:

```bash
export ADSPENDSPY_API_KEY=asp_live_...
```

Codex sends it only as `X-API-Key`. Before you sign in (Claude Code) or without a key (Codex) only
`adspendspy-demo` works; the `adspendspy` server then asks for authentication or answers `401` —
that is expected, not a broken install.

## Example prompts

- "Rebuild the top landing page of Alex Hormozi for my coaching offer"
- "Which landing page of this advertiser gets the most ad spend?"
- "Tear down the best landing page of my competitor"
- "Which hooks and CTAs carry the most estimated spend across my tracked brands in the last 30 days?"

## Originality

The skill rebuilds structure and layout only: it never copies an advertiser's text, logos, images,
testimonials or tracking code, and all copy is written fresh for your offer.

## License

MIT
