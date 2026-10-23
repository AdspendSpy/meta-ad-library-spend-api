# AdSpendSpy automations: Zapier, Make, n8n

These integrations route new Meta ads and spend alerts of the brands you track in AdSpendSpy to
Slack, Google Sheets and other tools. All three use the AdSpendSpy API; none of them needs extra
infrastructure on your side.

## Overview

| Integration | Folder | Triggers | Actions / searches | Status |
|---|---|---|---|---|
| Zapier | [`zapier/`](zapier/) | `new_ad` "New Ad From Tracked Brand" (REST hook), `new_spend_alert` "New Spend Alert" (REST hook) | `track_brand` "Track Brand", `find_tracked_brand` "Find Tracked Brand" | not yet published |
| Make | [`make/`](make/) | `watchNewAdsInstant`, `watchSpendAlertsInstant` (instant webhooks); `watchNewAds`, `watchSpendAlerts` (polling) | `trackBrand`, `searchTrackedBrands`, `makeApiCall` | not yet published |
| n8n | [`n8n/`](n8n/) (npm `n8n-nodes-adspendspy`) | `AdSpendSpy Trigger` with events `ad.new`, `ad.spend_alert` | `AdSpendSpy` node: Brand → Track, Brand → Search, Ad → Get Many New, Alert → Get Many | not yet published |

Events:

- `ad.new`: a brand you track starts a new ad. Back-catalog ads of a freshly tracked brand do not count.
- `ad.spend_alert`: a spend alert for an ad of a brand you track (the same alerts as in the app).

Both accept an optional filter on one tracked brand (`page_id`) or one project (`project`).
Every item carries a stable `id`; spend is an estimate in EUR.

## Authentication

One model for all three integrations:

- An AdSpendSpy API key (`asp_live_…`), created under **Account Settings → API Keys** on
  [adspendspy.com/settings.php](https://www.adspendspy.com/settings.php). It is sent as
  `X-API-Key` or `Authorization: Bearer asp_live_…`.
  - Zapier: custom auth, field `api_key`.
  - Make: connection `adspendspy`.
  - n8n: credentials `adSpendSpyApi`.
- OAuth access tokens (`asp_oat_…`, scope `account.read`) work on the same endpoints.
- A paid AdSpendSpy plan or a running trial is required. Free accounts get `402`
  (`membership_required`).
- Every polling or webhook-management call consumes one request of the daily API quota
  (1,000 per day). Webhook deliveries consume nothing.

## Security

- Webhook target URLs must use `https` on port 443 or 8443 and resolve to public IPs only.
- Each subscription gets its own secret (`whsec_…`), shown once on subscribe.
- Every delivery is signed: `X-AdSpendSpy-Signature: v1=<hex>`, where
  `hex = HMAC-SHA256(secret, "<timestamp>.<raw body>")` and the timestamp is
  `X-AdSpendSpy-Timestamp`. Reject timestamps older than 5 minutes and compare in constant time.
- Test vector: secret `whsec_test`, timestamp `1700000000`, body `{"id":"ad.new:1"}` →
  `v1=98ab6f15d65efe0ec4dbf9f25fdeeeef42a5651d8bd1bd10f3b3609b436a6474`.
- A receiver that answers `410 Gone` disables its webhook at once.

Verification code in Node.js and Python, retry rules and the full error table:
[`docs/ENDPOINTS.md`](../docs/ENDPOINTS.md#webhooks).

## Local development (developers only)

Point an integration at a local AdSpendSpy instance instead of production by setting its base URL to
`http://localhost:8002` (API under `http://localhost:8002/api/v1/`). This is only for developers
working on AdSpendSpy itself; published integrations always use `https://www.adspendspy.com`.
Webhook targets must be public `https` URLs, so instant triggers cannot be delivered to a
local receiver; use the polling triggers locally. See each folder's own README for build and test
commands.

## Reference

- Endpoints, item shape, webhook headers and errors: [`docs/ENDPOINTS.md`](../docs/ENDPOINTS.md)
- Python and TypeScript clients: [`../README.md`](../README.md)
