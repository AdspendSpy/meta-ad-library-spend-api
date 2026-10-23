# AdSpendSpy app for Make

Custom Make app for the AdSpendSpy API. It routes new ads and spend alerts of the brands a user tracks to Slack, Google Sheets and other tools, and tracks new brands from a scenario.

Binding contract (events, item shape, endpoints, errors): `docs/AUTOMATIONS.md` in the AdSpendSpy website repo.

## Layout

The folder uses the local-development format of the Make Apps Editor (VS Code extension "Make Apps SDK"): a `makecomapp.json` manifest and one folder per component, each code file named `<component>.<code>.iml.json`.

| Path | Content |
|---|---|
| `makecomapp.json` | Manifest: app name `adspendspy`, label "AdSpendSpy", theme `#1877F2`, language English, all components and their code files. `origins` stays empty until upload. |
| `general/base.iml.json` | Base URL `https://www.adspendspy.com/api/v1`, `Authorization: Bearer {{connection.apiKey}}`, error message `{{body.message}}`, 402 message, log sanitizing of the Authorization header. |
| `general/groups.json`, `general/readme.md` | Module groups and the app description. |
| `assets/icon-512.png` | App icon, 512 × 512. |
| `connections/adspendspy/` | Connection "AdSpendSpy API key" (`apiKey`, password), verified with `GET /brands/list.php`. |
| `webhooks/newAd/`, `webhooks/newSpendAlert/` | Dedicated webhooks: attach `POST /webhooks/subscribe.php`, detach `POST /webhooks/unsubscribe.php`, filters `page_id` or `project`. |
| `modules/watchNewAdsInstant/`, `modules/watchSpendAlertsInstant/` | Instant triggers on the two webhooks. Output = the contract item. |
| `modules/watchNewAds/`, `modules/watchSpendAlerts/` | Polling triggers on `GET /ads/new.php` and `GET /alerts/list.php`: `limit` 100, cursor pagination while `has_more`, trigger type `id` descending, epoch "choose where to start". |
| `modules/trackBrand/` | Action `POST /brands/track.php` (`page_id`, `brand_name`). |
| `modules/searchTrackedBrands/` | Search `GET /brands/search-tracked.php?q=`. |
| `modules/makeApiCall/` | Universal module: any relative path under `/api/v1/`, method, headers, query, body. |
| `rpcs/listTrackedBrands/`, `rpcs/listProjects/` | Dropdowns for the brand and project filters. |
| `TEST_SCENARIOS.md` | The two test scenarios the Make app review asks for. |
| `scripts/check.mjs` | Offline check (Node built-ins only). |

## Check

```sh
node integrations/make/scripts/check.mjs
```

It parses every JSON file, checks that every component exists, that only the allowed API paths are used, that polling triggers paginate, that the universal module exists, and that no text uses forbidden wording.

## Upload (owner only)

Nothing in this folder has been uploaded to Make. Upload happens only after the owner's explicit yes, with the owner's own Make account and Make API token:

1. Open this folder in VS Code with the Make Apps SDK extension and add the owner's Make API token as environment.
2. Create a new app origin (or "Deploy to Make") so `makecomapp.json` gets its `origins` entry; the API key file lives in `.secrets/` and is never committed.
3. Deploy all components, then build the two scenarios from `TEST_SCENARIOS.md` with the reviewer account for directories (`review@adspendspy.com`; the password is never written into a file).
4. Request the Make app review.

Publishing a Make app is irreversible: a published app and its module names cannot be withdrawn, only deprecated. Rename nothing after publishing.
