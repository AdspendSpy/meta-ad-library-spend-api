# Data semantics

Read every AdSpendSpy number through these rules before you quote it.

## Core rules

- **Spend is a cumulative estimate in EUR.** It is the latest estimate of everything spent on the ads so far, not an invoice and not a period figure. Always label it "estimated spend".
- **`timeframe` only filters by last-seen date.** `timeframe: "90d"` means "ads seen in the last 90 days"; the spend shown is still their cumulative total. Never write "spent X in the last 90 days".
- **0 can mean "no estimate available".** Write "no estimate" rather than "no spend" when a value is 0.
- **Counts are within tracked data.** In account mode: only advertisers the user tracks. In demo mode: only the public example advertiser.
- Report line in every deliverable: `Data: AdSpendSpy — estimated spend, cumulative EUR estimate`.

## `get_top_landingpages_stats`

Ranks landing URLs of tracked advertisers by estimated spend. Parameters: `page_id` (exact advertiser filter), `q` (substring of the landing URL), `timeframe` (`all`, `7d`, `30d`, `90d`), `active_only`, `limit` (1–100).

| Field | Meaning |
|---|---|
| `landing_url` | The exact URL ads link to; ads are grouped by this string, so query-string variants can appear as separate rows |
| `total_spend` | Sum of the cumulative spend estimates of all ads pointing to this URL, EUR |
| `ads_count` | Number of ads (in the filter) pointing to this URL |
| `brands_count` | Number of distinct advertisers using this URL |
| `active_ads_count` | Ads still active at the last check |
| `max_days_running` | Longest run time of any of these ads, in days |
| `last_seen_at` | Most recent time any of these ads was seen |
| `brand.page_id`, `brand.brand_name` | The top-spending advertiser for this URL |
| `screenshot_url` | Stored screenshot as a site path (may be missing) |
| `screenshot_full_url` | Same screenshot as an absolute URL; use it as reference when no browser tool is available |

## `get_top_ads_stats`

Analyzes the estimated spend of the tracked advertisers' ads. Parameters include `page_id`, `q`, `media_type`, `timeframe`, `active_only`. Creative breakdowns sample the top 1,000 ads by spend; the response metadata states matched and sampled counts and the full-match aggregate spend.

Useful breakdowns for the teardown: hooks (hook text, type, ad count, spend), headlines, CTA texts, media types and video durations, each with summed estimated spend. Spend per breakdown row = sum of cumulative estimates of the ads in that row.

## `list_brand_ads`

Creative summaries for one tracked advertiser, newest first. Parameters: `page_id` (required), `limit` (1–100), `cursor` (`pagination.next_cursor`), `media_type`, `active_only`.

Key fields: `internal_ad_id` (pass to `get_ad_details`), `ad_id` / meta ad id (identifies the ad on Meta, never pass it to `get_ad_details`), `headline`, `body_text`, `media_type`, `landing_url`, `is_active`, `estimated_spend`, `first_seen_at`, `last_seen_at`. The response `summary.estimated_spend` sums the whole match.

To find the ads for one page, compare `landing_url` host + path with the chosen page and ignore query strings and tracking parameters.

## `get_ad_details`

One ad by `internal_ad_id`: full text, `cta_text`, `cta_type`, `start_date`, `days_running`, `is_active`, spend estimates (total, EU, US where available), reach where measured, media URLs and a `transcript` for videos when available. Media URLs are for analysis only; never embed them in the rebuild.

## `list_tracked_brands` / `search_tracked_brands`

Find advertisers the account already tracks and their string `page_id`. `search_tracked_brands` takes `q` (name, page id or stored Facebook URL) and searches local data only.

## `track_brand` (account mode only)

Adds an advertiser by `page_id` and `brand_name`. It **consumes one of the user's tracking slots**, ads import in the background (may not be ready immediately), and there is no removal tool in MCP. Call it **only after the user explicitly confirms**, after telling them about the slot.

## Demo mode

Tool descriptions begin with `Public demo:`. Only Alex Hormozi, `page_id` `116482854782233`, is available; ad listings and details expose only approved public creatives; statistics describe this advertiser only; `track_brand` and account-only tools are absent. Run the full workflow on that advertiser and mention that an account unlocks the user's own tracked advertisers.
