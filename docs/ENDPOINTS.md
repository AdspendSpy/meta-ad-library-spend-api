# Endpoint reference

Base URL: `https://www.adspendspy.com/api/v1/`
Auth: `X-API-Key: asp_live_...` or `Authorization: Bearer asp_live_...`
Quota: 1,000 requests per key per day (`429` afterwards, resets at midnight server time).

Every response is JSON with a `success` boolean. On failure it carries a `message` string.

---

## `GET brands/list.php`

Brands you track, with the number of ads collected for each.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `project` | string | `all` | `all`, `unassigned`, or a project `public_id` |

```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "page_id": "1234567890",
      "brand_name": "Example Brand",
      "brand_image": "https://...",
      "category": "Skincare",
      "likes": 128000,
      "verification": "BLUE_VERIFIED",
      "ig_username": "examplebrand",
      "ig_followers": 94000,
      "created_at": "2026-03-11 08:24:11",
      "ad_count": 137
    }
  ],
  "count": 1,
  "total_count": 24
}
```

`count` is the number of rows after the project filter, `total_count` is account-wide.

---

## `GET brands/search-tracked.php`

Search within the brands you already track. Does **not** query the Meta Ad Library.

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Search term matched against the brand name |

---

## `POST brands/check-tracked.php`

Check which Facebook page ids you already track.

```json
{ "page_ids": ["1234567890", "9876543210"] }
```

Answers with a `tracked` collection of the ids that are tracked.

---

## `GET ads/details.php`

One ad plus its demographic breakdown.

| Parameter | Type | Description |
|---|---|---|
| `ad_id` | int | Ad id, required |

```json
{
  "success": true,
  "ad": { "id": 123456, "headline": "...", "estimated_spend": 4820, "...": "..." },
  "demographics": [
    { "country": "DE", "age_range": "25-34", "gender": "female", "reach": 18000, "impressions": 42000 }
  ]
}
```

Returns `404` when the ad id does not exist.

---

## `GET stats/top-ads.php`

Aggregated spend statistics across the ads of your tracked brands. This is the endpoint that
answers "how much are my competitors spending, and on what".

| Parameter | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Free-text filter over ad copy |
| `media_type` | string | `all` | `all`, `image`, `video` |
| `category` | string | — | Brand category filter |
| `timeframe` | string | `30d` | `7d`, `30d`, `90d`, `all` |
| `active_only` | `0`/`1` | `0` | Only ads that are still running |
| `project` | string | `all` | `all` or a project `public_id` |

```json
{
  "success": true,
  "data": {
    "totalSpend": 184320,
    "adCount": 912,
    "mediaTypeStats": [{ "media_type": "video", "count": 512, "total_spend": 141200 }],
    "durationStats": [{ "duration_bucket": "60+ days", "count": 88, "total_spend": 74100 }],
    "maxDurationSpend": 74100,
    "genderStats": [{ "gender": "female", "reach": 1840000 }],
    "ageStats": [{ "age_range": "25-34", "reach": 920000 }],
    "ctaStats": [{ "cta_type": "SHOP_NOW", "count": 410, "total_spend": 98400 }],
    "hooksStats": [{ "hook": "Tired of ...", "count": 22, "total_spend": 18200 }],
    "headlineStats": [{ "headline": "50% off today", "count": 14, "total_spend": 12900 }]
  }
}
```

**`totalSpend` of `0` with a non-zero `adCount` means the ads run outside the EU/UK**, where Meta
publishes no reach data. That is an unmeasurable value, not a measured zero — do not render it
as "spent nothing".

---

## `GET lists/get.php`

Saved ad lists (swipe files).

| Parameter | Type | Description |
|---|---|---|
| `list_id` | int | Optional. Without it: all lists. With it: that list including its ads |
| `ad_id` | int | Optional. Which lists contain this ad |

---

## `GET projects/get.php`

Projects — your groupings of tracked brands.

| Parameter | Type | Description |
|---|---|---|
| `public_id` | string | Optional. One project by its public id |
| `brand_id` | int | Optional. Projects a given brand belongs to |

---

## `GET alerts/count.php`

Number of pending alerts (spend spikes, new ads, landing page changes).

```json
{ "success": true, "count": 7 }
```

---

## Automation endpoints (paid plans)

The five endpoints below feed the Zapier, Make and n8n integrations ([`integrations/`](../integrations/README.md)).
They work with an API key (`X-API-Key` or `Authorization: Bearer asp_live_...`) and with OAuth access
tokens (`asp_oat_...`, scope `account.read`). They need a paid AdSpendSpy plan or a running trial:
free accounts get `402` with `reason: membership_required`. Every call consumes one request of the
daily quota; webhook deliveries consume nothing.

Two events exist:

| Event | Fires when | `id` | `occurred_at` |
|---|---|---|---|
| `ad.new` | A brand you actively track starts a new ad. Ads that started more than 7 days before we first saw them (back catalog of a freshly tracked brand) do not count. | `ad.new:<internal_ad_id>` | first seen |
| `ad.spend_alert` | A spend alert for one of your tracked brands' ads (the same alerts as in the app). Hidden alerts never fire. | `ad.spend_alert:<alert_id>` | alert created |

Both accept an optional filter: `page_id` (one tracked brand) **or** `project` (public id of one of
your projects). Sending both returns `400` (`filter_conflict`).

### Item shape

Identical in polling `items[]` and in webhook bodies:

```json
{
  "id": "ad.spend_alert:991",
  "event": "ad.spend_alert",
  "occurred_at": "2026-10-22T07:41:12+00:00",
  "currency": "EUR",
  "spend_is_estimate": true,
  "brand": {
    "page_id": "116482854782233",
    "name": "Alex Hormozi",
    "image_url": "https://pub-example.r2.dev/brands/116482854782233.jpg",
    "url": "https://www.adspendspy.com/brand/116482854782233?utm_source=adspendspy_api&utm_medium=integration"
  },
  "ad": {
    "internal_ad_id": 48211,
    "meta_ad_id": "1234567890123456",
    "ad_archive_id": "1234567890123456",
    "headline": "Free scaling workshop",
    "body_text": "…",
    "cta_text": "Learn more",
    "landing_url": "https://example.com/workshop",
    "media_type": "video",
    "thumbnail_url": "https://pub-example.r2.dev/ads/48211.jpg",
    "video_url": null,
    "platforms": ["facebook", "instagram"],
    "start_date": "2026-10-20",
    "is_active": true,
    "estimated_spend_eur": 1840.5,
    "spend_coverage": "eu_uk",
    "url": "https://www.adspendspy.com/ad/48211?utm_source=adspendspy_api&utm_medium=integration"
  },
  "alert": { "alert_id": 991, "threshold_eur": 500, "spend_at_alert_eur": 812.4 }
}
```

- `alert` is `null` for `ad.new`.
- Spend is the latest cumulative estimate in EUR. An estimate of `0` is reported as `null` (unknown).
- Image and video URLs are durable copies; a URL that would expire is returned as `null`.
- `body_text` is cut at 2,000 characters. Times are ISO 8601 with offset.
- `id` is stable: the same event always carries the same `id`. Deduplicate on it.

---

## `GET ads/new.php`

Polling for `ad.new` items, sorted by `internal_ad_id` descending.

| Parameter | Type | Description |
|---|---|---|
| `since_id` | int | Optional. Only items with an id greater than this (exclusive) |
| `cursor` | string | Optional. Opaque, from `pagination.next_cursor` |
| `limit` | int | Optional. 1–100, default 25 |
| `page_id` | string | Optional. One tracked brand |
| `project` | string | Optional. Public id of one of your projects |

Without `since_id` and `cursor` the last 30 days are returned.

```json
{
  "success": true,
  "items": [ { "id": "ad.new:48211", "event": "ad.new", "alert": null, "…": "…" } ],
  "pagination": { "next_cursor": "eyJ…", "has_more": true },
  "meta": { "currency": "EUR", "spend_basis": "latest_cumulative_estimate", "spend_is_estimate": true }
}
```

Errors: `400` invalid argument or `Use either page_id or project`, `402` `membership_required`,
`404` `Brand not tracked` / `Project not found`. Same operation as the MCP tool `list_new_ads`.

---

## `GET alerts/list.php`

Polling for `ad.spend_alert` items, sorted by `alert_id` descending. Parameters, pagination and
errors as `ads/new.php` (`since_id` refers to the `alert_id`). Reading alerts never marks them as
sent. Same operation as the MCP tool `list_alerts`.

```json
{
  "success": true,
  "items": [ { "id": "ad.spend_alert:991", "event": "ad.spend_alert", "alert": { "alert_id": 991, "threshold_eur": 500, "spend_at_alert_eur": 812.4 }, "…": "…" } ],
  "pagination": { "next_cursor": null, "has_more": false },
  "meta": { "currency": "EUR", "spend_basis": "latest_cumulative_estimate", "spend_is_estimate": true }
}
```

---

## `POST webhooks/subscribe.php`

Subscribes a URL to one event (REST hook). JSON body:

| Field | Type | Description |
|---|---|---|
| `event` | string | Required. `ad.new` or `ad.spend_alert` |
| `target_url` | string | Required. `https`, port 443 or 8443, no user/password, public IPs only |
| `platform` | string | Optional. `zapier`, `make`, `n8n` or `custom` (default `custom`) |
| `page_id` | string\|null | Optional filter: one tracked brand |
| `project` | string\|null | Optional filter: public id of one of your projects |

```json
{ "event": "ad.new", "target_url": "https://hooks.zapier.com/…", "platform": "zapier", "page_id": null, "project": null }
```

Answer `201`:

```json
{
  "success": true,
  "webhook": {
    "id": "whk_3f9a…",
    "event": "ad.new",
    "target_url": "https://hooks.zapier.com/…",
    "platform": "zapier",
    "filters": { "page_id": null, "project": null },
    "created_at": "2026-10-22T07:41:12+00:00"
  },
  "secret": "whsec_…"
}
```

The `secret` is shown only in this answer; store it to verify signatures. A new subscription starts
now: no backlog is sent. An older active subscription with the same event, `target_url` and filters
is disabled (reason `replaced`). At most 25 active webhooks per account.

---

## `POST webhooks/unsubscribe.php`

JSON body `{"id": "whk_…"}`. Answer `200`:

```json
{ "success": true, "webhook": { "id": "whk_3f9a…", "disabled_at": "2026-10-22T08:00:00+00:00" } }
```

Idempotent: an already disabled webhook of your account also returns `200`. An unknown id or one of
another account returns `404` (`webhook_not_found`).

---

## `GET webhooks/list.php`

Your active webhooks. The secret is never returned.

```json
{
  "success": true,
  "webhooks": [
    {
      "id": "whk_3f9a…",
      "event": "ad.new",
      "target_url": "https://hooks.zapier.com/…",
      "platform": "zapier",
      "filters": { "page_id": null, "project": null },
      "created_at": "2026-10-22T07:41:12+00:00",
      "last_delivery_at": "2026-10-22T09:05:02+00:00",
      "last_success_at": "2026-10-22T09:05:02+00:00",
      "last_status": "sent"
    }
  ]
}
```

`last_status` is `sent`, `retrying`, `failed` or `null` (nothing delivered yet).

### Webhook endpoint errors

Webhook endpoints answer `{"success": false, "code": "…", "message": "…"}`.
Webhook-management calls are limited to 120 per account and hour.

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `invalid_json` | Body is not valid JSON |
| 400 | `invalid_event` | Event is not `ad.new` or `ad.spend_alert` |
| 400 | `invalid_target_url` | Not an `https` URL on port 443/8443, or contains credentials |
| 400 | `target_not_allowed` | Host resolves to a non-public IP (or does not resolve) |
| 400 | `invalid_platform` | Not `zapier`, `make`, `n8n` or `custom` |
| 400 | `filter_conflict` | Both `page_id` and `project` sent |
| 400 | `invalid_page_id` | Malformed `page_id` |
| 401 | — | Key or token missing, unknown or revoked |
| 402 | `membership_required` | Free account; a paid plan or trial is required |
| 403 | — | Endpoint not allowed for this credential (app tokens are refused) |
| 404 | `webhook_not_found` | Unknown webhook id, or one of another account |
| 404 | `brand_not_tracked` | `page_id` is not a brand you actively track |
| 404 | `project_not_found` | `project` is not one of your projects |
| 405 | — | Wrong HTTP method |
| 409 | `webhook_limit_reached` | 25 active webhooks already |
| 413 | — | Body larger than 8 KB |
| 429 | `rate_limited` | Hourly management limit or daily quota reached |
| 503 | `integrations_paused` | Webhooks are temporarily paused |
| 503 | `unavailable` | Temporary server problem |

---

## Webhooks

Deliveries run every 5 minutes. Each event is one `POST` whose JSON body is one item (see
[Item shape](#item-shape)). Latency is the delivery interval plus how often the brand is refreshed.
There is no ordering guarantee; sort by `occurred_at`.

### Headers

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `User-Agent` | `AdSpendSpy-Webhooks/1.0` |
| `X-AdSpendSpy-Event` | `ad.new` or `ad.spend_alert` |
| `X-AdSpendSpy-Webhook` | Webhook id (`whk_…`) |
| `X-AdSpendSpy-Delivery` | Delivery id |
| `X-AdSpendSpy-Timestamp` | Unix seconds |
| `X-AdSpendSpy-Signature` | `v1=<hex>` |

### Verify the signature

`hex = HMAC-SHA256(secret, "<timestamp>.<raw body>")`. Use the raw request body exactly as
received, before any JSON parsing. Reject timestamps older than 5 minutes and compare in constant
time.

Node.js:

```js
const crypto = require('crypto');

function verify(secret, timestamp, rawBody, signatureHeader) {
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = 'v1=' + crypto.createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

Python:

```python
import hashlib, hmac, time

def verify(secret: str, timestamp: str, raw_body: bytes, signature_header: str) -> bool:
    if abs(time.time() - int(timestamp)) > 300:
        return False
    message = timestamp.encode() + b"." + raw_body
    expected = "v1=" + hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header or "")
```

### Test vector

| Input | Value |
|---|---|
| secret | `whsec_test` |
| timestamp | `1700000000` |
| raw body | `{"id":"ad.new:1"}` |
| signed string | `1700000000.{"id":"ad.new:1"}` |
| `X-AdSpendSpy-Signature` | `v1=98ab6f15d65efe0ec4dbf9f25fdeeeef42a5651d8bd1bd10f3b3609b436a6474` |

### Retries and disabling

- Success is any `2xx` answer within 5 seconds. Redirects are not followed.
- `410 Gone` disables the webhook at once (reason `gone`). Use it to unsubscribe from the receiver side.
- Any other answer is retried after 1, 5, 30, 120 and 720 minutes (first attempt + 5 retries). After the 6th failed attempt the delivery is `failed`.
- `X-AdSpendSpy-Delivery` is the numeric delivery id; a retry keeps the same id.
- After 20 consecutive failures and 72 hours without a success the webhook is disabled (reason `failures`).
- At most 200 new events per webhook per delivery run; the rest follow in the next run.
- Revoking the API key or the OAuth app stops its webhooks.

---

## Endpoints that are *not* reachable with an API key

These answer `403` when called with a key and stay in the web app on purpose:

| Endpoint | Why |
|---|---|
| `brands/search.php` | Triggers a paid Meta Ad Library lookup per request |
| `brands/untrack.php` | Removes a brand from your account; removals stay in the web app |
| `brands/similar.php`, `brands/recommendations.php` | Paid AI-backed discovery |
| `auth/*`, `billing/*`, `affiliate/*` | Account, payment and payout surface |
| `lists/create.php`, `lists/update.php`, `lists/add-ads.php`, … | Write operations |
| `ads/copy-ad.php` | Consumes your monthly AI copy quota |

`brands/track.php` is reachable with a key on purpose: it only adds a brand, within your plan's brand
limit (same 402/429 answers as in the web app), and never removes or changes anything. Apart from that,
a key cannot spend money and cannot change your account. That is deliberate: it makes a leaked key an
annoyance instead of an incident.
