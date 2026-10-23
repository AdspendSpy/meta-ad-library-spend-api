# AdSpendSpy for Zapier

Zapier integration of the AdSpendSpy API. It sends new Meta ads and spend alerts of the brands you track in AdSpendSpy to Slack, Google Sheets and any other Zapier app. Spend values are AdSpendSpy estimates in EUR.

Contract (events, item shape, endpoints, errors): `docs/AUTOMATIONS.md` in the AdSpendSpy web repo.

## What it does

| Type | Key | Label | Endpoint |
|---|---|---|---|
| Trigger (REST hook) | `new_ad` | New Ad From Tracked Brand | subscribe `POST /api/v1/webhooks/subscribe.php` (`ad.new`), sample `GET /api/v1/ads/new.php` |
| Trigger (REST hook) | `new_spend_alert` | New Spend Alert | subscribe `POST /api/v1/webhooks/subscribe.php` (`ad.spend_alert`), sample `GET /api/v1/alerts/list.php` |
| Action | `track_brand` | Track Brand | `POST /api/v1/brands/track.php` |
| Search | `find_tracked_brand` | Find Tracked Brand | `GET /api/v1/brands/search-tracked.php?q=` |
| Hidden trigger | `tracked_brands` | dropdown of tracked brands | `GET /api/v1/brands/list.php` |
| Hidden trigger | `projects` | dropdown of projects | `GET /api/v1/projects/get.php` |

Both triggers accept an optional filter: one tracked brand (`page_id`) **or** one project (`project`), never both.

Authentication: custom, one field `api_key`. Create the key in AdSpendSpy under Settings → API access (starts with `asp_live_`). Automations need a paid AdSpendSpy plan; free accounts get "AdSpendSpy automations need a paid plan."

## Local development

```bash
npm install
npm test          # jest + nock, no network
npm run validate  # zapier-platform validate (schema + integration checks, no login needed)
```

The API host defaults to `https://www.adspendspy.com`. Override it with `ADSPENDSPY_BASE_URL` (for example a tunnel to the local dev server).

## Private test with a Zapier account

Only after the owner's go-ahead and only with the owner's own Zapier account:

```bash
npx zapier-platform login                         # the owner logs in personally
npx zapier-platform register "AdSpendSpy"         # once, creates the private integration
npx zapier-platform push
cloudflared tunnel --url http://localhost:8002    # local AdSpendSpy dev server
npx zapier-platform env:set 1.0.0 ADSPENDSPY_BASE_URL=<tunnel-url>
```

The webhook kill switch on the server (`config/integration-webhooks.php`) must be `test` or `active` for subscriptions to work.

## Example Zaps

- **New Ad From Tracked Brand → Slack:** post brand name, ad headline, ad text, estimated spend (EUR) and the ad report link to a channel.
- **New Spend Alert → Google Sheets:** add one row per alert with brand, ad link, alert threshold, estimated spend at alert and `occurred_at`.

## Files

`index.js` (app definition), `authentication.js`, `middleware.js` (bearer header, error mapping), `lib/` (base URL, hook factory, samples), `triggers/`, `creates/`, `searches/`, `test/`, `assets/icon-256.png`.
