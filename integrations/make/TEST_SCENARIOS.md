# Test scenarios for the Make app review

Both scenarios use the AdSpendSpy reviewer account for directories (`review@adspendspy.com`, permanent Professional with demo brands; the password is shared with the reviewer separately and never written into a file). Contract: `docs/AUTOMATIONS.md` in the AdSpendSpy website repo.

## Preparation

1. Log in to AdSpendSpy with the reviewer account and open Account → API.
2. Create an API key (starts with `asp_live_`).
3. In Make, add a connection "AdSpendSpy API key" and paste the key. Make verifies it with `GET /api/v1/brands/list.php`.

## Scenario 1: Watch New Ads (instant) → Slack "Create a Message"

1. Create a new scenario.
2. Add **AdSpendSpy → Watch New Ads (instant)**.
3. Click **Add** next to the webhook, name it "New ads", choose the connection.
4. Optional: pick one **Tracked brand** (dropdown from `listTrackedBrands`) or one **Project** (dropdown from `listProjects`). Leave both empty for all tracked brands. Do not set both.
5. Save. Make calls `POST /api/v1/webhooks/subscribe.php` with `event: ad.new`, `platform: make` and the Make webhook URL. The answer's `webhook.id` is stored for detach.
6. Add **Slack → Create a Message**. Channel: a test channel. Text:
   `New ad from {{1.brand.name}}: {{1.ad.headline}} — {{1.ad.url}}`
7. Turn the scenario on. Wait for the next new ad of a tracked brand (deliveries run every 5 minutes), or use **Run once** with the sample data.

Expected bundle fields of module 1:

| Field | Example |
|---|---|
| `id` | `ad.new:48211` |
| `event` | `ad.new` |
| `occurred_at` | `2026-10-22T07:41:12+00:00` |
| `currency` | `EUR` |
| `spend_is_estimate` | `true` |
| `brand.page_id`, `brand.name`, `brand.image_url`, `brand.url` | page ID, brand name, R2 image or empty, AdSpendSpy brand link |
| `ad.internal_ad_id`, `ad.meta_ad_id`, `ad.ad_archive_id` | `48211`, `1234567890123456`, `1234567890123456` |
| `ad.headline`, `ad.body_text`, `ad.cta_text`, `ad.landing_url` | ad copy and landing page |
| `ad.media_type`, `ad.thumbnail_url`, `ad.video_url` | `video`, R2 URL or empty |
| `ad.platforms`, `ad.start_date`, `ad.is_active` | `[facebook, instagram]`, `2026-10-20`, `true` |
| `ad.estimated_spend_eur`, `ad.spend_coverage`, `ad.url` | `1840.5` or empty, `eu_uk`, AdSpendSpy ad link |
| `alert` | empty |

Expected Slack message: one message per new ad with brand name, headline and the AdSpendSpy ad link.

Turning the scenario off and deleting the webhook calls `POST /api/v1/webhooks/unsubscribe.php` with the stored id.

## Scenario 2: Watch Spend Alerts (instant) → Google Sheets "Add a Row"

1. Prepare a Google Sheet with the header row: `Event ID | Brand | Headline | Spend (EUR) | Threshold (EUR) | Spend at alert (EUR) | Ad link | Occurred at`.
2. Create a new scenario and add **AdSpendSpy → Watch Spend Alerts (instant)**.
3. Click **Add** next to the webhook, name it "Spend alerts", choose the connection, optionally a brand or a project. Save (subscribes with `event: ad.spend_alert`).
4. Add **Google Sheets → Add a Row**, choose the sheet, header row 1, and map:
   - Event ID → `{{1.id}}`
   - Brand → `{{1.brand.name}}`
   - Headline → `{{1.ad.headline}}`
   - Spend (EUR) → `{{1.ad.estimated_spend_eur}}`
   - Threshold (EUR) → `{{1.alert.threshold_eur}}`
   - Spend at alert (EUR) → `{{1.alert.spend_at_alert_eur}}`
   - Ad link → `{{1.ad.url}}`
   - Occurred at → `{{1.occurred_at}}`
5. Turn the scenario on.

Expected bundle fields of module 1: the same as scenario 1, plus:

| Field | Example |
|---|---|
| `id` | `ad.spend_alert:991` |
| `event` | `ad.spend_alert` |
| `alert.alert_id` | `991` |
| `alert.threshold_eur` | `500` |
| `alert.spend_at_alert_eur` | `812.4` |

Expected sheet result: one row per alert. Spend values are estimates in EUR; an unknown spend is empty, never `0`.

## Polling variants

**Watch New Ads** and **Watch Spend Alerts** do the same by schedule. On first start choose where to start (from now on, or from a listed ad or alert). Each run reads up to "Maximum number of results" items, 100 per page, following `pagination.next_cursor` while `has_more` is true.
