# Meta Ad Library Spend API — MCP server, Claude Code & Codex plugin, Python & TypeScript clients

**AdSpendSpy is a Meta Ad Library spend API: the ads from the Meta Ad Library, plus the estimated
spend behind each Facebook and Instagram ad.** It answers, programmatically, the question every
media buyer asks manually: *how much is this competitor spending on ads, on which creatives, with
which hooks?* This repository holds the official read-only clients (Python and TypeScript, zero
dependencies in both), the Claude Code & Codex plugin and the MCP server definition.

| | |
|---|---|
| **What it does** | Reads estimated ad spend, creatives, call-to-actions, hooks and headlines for the Meta advertisers you track |
| **Auth** | Personal API key (`X-API-Key`), created in your AdSpendSpy account settings |
| **Access** | Read-only, 1,000 requests per key per day |
| **Languages** | Python 3.9+ (`pip install adspendspy`), TypeScript/Node 18+ (`npm install adspendspy`) |
| **Dependencies** | None. Python uses `urllib`, TypeScript uses the global `fetch` |
| **License** | MIT |
| **Hosted app** | [adspendspy.com](https://www.adspendspy.com) |

---

## Quick start

```bash
pip install adspendspy
export ADSPENDSPY_API_KEY=asp_live_...
```

```python
from adspendspy import AdSpendSpy

spy = AdSpendSpy()                       # reads ADSPENDSPY_API_KEY

stats = spy.top_ads(timeframe="30d")
print(f"{stats['totalSpend']:,.0f} estimated spend across {stats['adCount']} ads")

for cta in stats["ctaStats"][:5]:
    print(cta["cta_type"], cta["total_spend"])
```

```bash
npm install adspendspy
```

```ts
import { AdSpendSpy } from 'adspendspy';

const spy = new AdSpendSpy();            // reads ADSPENDSPY_API_KEY

const stats = await spy.topAds({ timeframe: '30d' });
console.log(`${stats.totalSpend} estimated spend across ${stats.adCount} ads`);
```

---

## Claude Code & Codex plugin

The AdSpendSpy plugin connects Claude Code and Codex to the AdSpendSpy MCP server (tracked
advertisers, ads, estimated spend, top landing pages) and ships the `rebuild-landing-page` skill.
Details, Codex install and the API key setup: [`plugins/adspendspy/README.md`](plugins/adspendspy/README.md).

```text
/plugin marketplace add adspendspy/meta-ad-library-spend-api
/plugin install adspendspy@adspendspy
```

## MCP Registry

The remote MCP server is described for the MCP Registry in [`server.json`](server.json) as
`com.adspendspy/adspendspy` (`https://www.adspendspy.com/mcp`, header `X-API-Key`). The keyless
demo is [`registry/demo/server.json`](registry/demo/server.json) as `com.adspendspy/adspendspy-demo`
(`https://www.adspendspy.com/mcp-demo`).

Both entries are live in the [MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=com.adspendspy).

## Automations (Zapier, Make, n8n)

Send new ads and spend alerts of the brands you track to Slack, Google Sheets, a CRM or any other
tool. The [`integrations/`](integrations/README.md) folder holds the Zapier app, the Make custom app
and the n8n community node. All three build on the same polling and webhook endpoints of the
AdSpendSpy API ([`docs/ENDPOINTS.md`](docs/ENDPOINTS.md#automation-endpoints-paid-plans)).

They need a paid AdSpendSpy plan (or a running trial). Status: not yet published in the Zapier,
Make or n8n directories.

---

## How do I get competitor ad spend programmatically?

Meta's own Ad Library publishes reach and impression *ranges* for ads that run in the EU and UK.
AdSpendSpy turns those ranges into a spend estimate per ad, keeps a history per advertiser, and
exposes the aggregate through `top_ads()`:

```python
stats = spy.top_ads(timeframe="30d", media_type="video", active_only=True)

stats["totalSpend"]       # estimated spend across all matching ads
stats["adCount"]          # how many ads that number is based on
stats["mediaTypeStats"]   # spend split by image / video
stats["durationStats"]    # spend by how long an ad has been running
stats["ctaStats"]         # which call-to-actions carry the money
stats["hooksStats"]       # opening lines ranked by spend behind them
stats["headlineStats"]    # headlines ranked by spend behind them
```

`durationStats` is the one most people underuse: an ad that has been running for 90 days is an
ad that works. Sorting by spend *and* duration is a cheap proxy for "proven creative".

## Which competitors am I tracking, and how many ads do they have?

```python
for brand in spy.brands():
    print(brand["brand_name"], brand["ad_count"], brand["category"])

spy.brand_count()                 # account-wide total
spy.search_brands("skincare")     # search within brands you already track
```

Group brands into projects (one project per client, per market, per niche) and filter every
call by them:

```python
for project in spy.projects():
    stats = spy.top_ads(project=project["public_id"], timeframe="90d")
    print(project["name"], stats["totalSpend"])
```

## How do I export competitor ads to CSV?

```bash
python3 examples/python/export_brands_csv.py brands.csv
```

The full example is in [`examples/python/export_brands_csv.py`](examples/python/export_brands_csv.py).
A ready-made spend report — CTAs, hooks and headlines ranked by the money behind them — is in
[`examples/python/competitor_spend_report.py`](examples/python/competitor_spend_report.py) and
[`examples/typescript/spend-report.ts`](examples/typescript/spend-report.ts).

## How do I look up a single ad?

```python
ad = spy.ad(123456)

ad["headline"]
ad["estimated_spend"]
ad["demographics"]        # reach and impressions by country, age and gender
```

---

## API reference

Every method maps to one endpoint under `https://www.adspendspy.com/api/v1/`.

| Python | TypeScript | Endpoint | Returns |
|---|---|---|---|
| `brands(project="all")` | `brands(project)` | `brands/list.php` | Tracked brands with ad counts |
| `brand_count(project="all")` | `brandCount(project)` | `brands/list.php` | Account-wide brand total |
| `search_brands(query)` | `searchBrands(query)` | `brands/search-tracked.php` | Matching tracked brands |
| `tracked(page_ids)` | `tracked(pageIds)` | `brands/check-tracked.php` | `{page_id: bool}` |
| `ad(ad_id)` | `ad(adId)` | `ads/details.php` | One ad + demographics |
| `top_ads(...)` | `topAds({...})` | `stats/top-ads.php` | Aggregated spend statistics |
| `lists()` | `lists()` | `lists/get.php` | Saved ad lists (swipe files) |
| `list_ads(list_id)` | `listAds(listId)` | `lists/get.php` | One list including its ads |
| `projects()` | `projects()` | `projects/get.php` | Projects (brand groupings) |
| `alert_count()` | `alertCount()` | `alerts/count.php` | Pending alerts |

Full parameter and response documentation: [`docs/ENDPOINTS.md`](docs/ENDPOINTS.md).

### Authentication

Create a key under **Account Settings → API Keys** at
[adspendspy.com/settings.php](https://www.adspendspy.com/settings.php). The plaintext key is
shown exactly once — only its SHA-256 hash is stored. Send it as either header:

```http
X-API-Key: asp_live_xxxxxxxxxxxx
Authorization: Bearer asp_live_xxxxxxxxxxxx
```

The client reads `ADSPENDSPY_API_KEY` from the environment when you do not pass one.

### Errors

Each failure mode is its own exception, so you never have to parse a message string:

| HTTP | Python | TypeScript | Meaning |
|---|---|---|---|
| 401 | `AuthenticationError` | `AuthenticationError` | Key missing, unknown or revoked |
| 403 | `ForbiddenError` | `ForbiddenError` | Endpoint not reachable with a key |
| 404 | `NotFoundError` | `NotFoundError` | Ad, list or project does not exist |
| 429 | `RateLimitError` | `RateLimitError` | Daily quota exhausted |
| 5xx | `APIError` | `APIError` | Server or network error (retried twice) |

4xx responses are never retried — retrying cannot change the answer. 5xx and network errors are
retried twice with exponential backoff.

---

## Limits — read this before you build on it

Being straight about the edges is cheaper than a surprise in production:

- **Spend estimates only exist for EU and UK ads.** Meta publishes reach and impression ranges
  there and nowhere else. For US, India or Brazil ads you get the ad, the creative and the run
  duration — but `totalSpend` stays at `0`. That is a **missing measurement, not a measured
  zero**, and the examples print a note saying so rather than pretending the number is real.
- **Spend is an estimate, not billing data.** It is derived from published impression ranges.
  Use it to rank creatives against each other, not to quote a competitor's exact budget.
- **The API is read-only.** Tracking a new brand, discovering competitors and everything that
  costs an upstream call happens in the web app. A key that could spend money would be a key
  worth stealing.
- **Discovery of *new* brands is not in the API.** `search_brands()` searches the brands you
  already track. Adding a brand runs a paid lookup against the Meta Ad Library and stays behind
  the UI on purpose.
- **1,000 requests per key per day.** Past that the API answers `429` until the next day. Up to
  five active keys per account; revoke one to create another.
- **Data is scoped to your account.** You read the brands *you* track. There is no global
  advertiser database behind this API.

## Development

```bash
git clone https://github.com/adspendspy/meta-ad-library-spend-api.git
cd meta-ad-library-spend-api

# Python — no install needed, the examples add ./python to sys.path
export ADSPENDSPY_API_KEY=asp_live_...
python3 examples/python/competitor_spend_report.py

# TypeScript
cd typescript && npm install && npm run build
```

Point either client at a different host with `base_url` / `baseUrl` — useful for testing against
a local instance.

## FAQ

**Is there a free tier?** Yes — AdSpendSpy has a free plan, and API keys are available on every
plan. See [adspendspy.com](https://www.adspendspy.com) for what each tier tracks.

**How is this different from Meta's Ad Library API?** Meta's API gives you raw ad records with
impression ranges and no history. AdSpendSpy converts those into per-ad spend estimates, keeps a
time series per advertiser, and aggregates by creative attributes (media type, CTA, hook,
headline, run duration). The trade-off is scope: Meta covers every advertiser, AdSpendSpy covers
the ones you track.

**Can I use this without an AdSpendSpy account?** No. The API reads your tracked brands, so it
needs an account and a key.

**Which Python versions are supported?** 3.9 and newer. No dependencies, so it installs cleanly
into any environment.

**Does it work in the browser?** The TypeScript client uses `fetch` and will run in a browser,
but do not ship your API key to a browser — keep it server-side.

**Is the spend number in dollars or euros?** It follows the currency Meta reports for the ad's
region. For EU ads that is EUR.

---

## Related

- [AdSpendSpy](https://www.adspendspy.com) — the hosted app: brand tracking, spend alerts,
  landing page capture, swipe files
- [API documentation](https://www.adspendspy.com/api-docs) — endpoint reference on the web

MIT licensed. Issues and pull requests welcome.

*Last updated: 2026-08-20 · client version 0.1.0*
