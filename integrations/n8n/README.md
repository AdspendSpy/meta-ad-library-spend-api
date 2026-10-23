# n8n-nodes-adspendspy

n8n community nodes for the AdSpendSpy API. Start workflows when a brand you track launches a new ad or when one of its ads passes your spend alert threshold, and track or search brands from any workflow.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n documentation. In n8n: **Settings → Community Nodes → Install**, package name `n8n-nodes-adspendspy`.

## Operations

**AdSpendSpy Trigger** (webhook trigger)

| Event | Fires when |
|---|---|
| New Ad From Tracked Brand (`ad.new`) | a brand you track starts a new ad |
| New Spend Alert (`ad.spend_alert`) | an ad of a brand you track passes your spend alert threshold |

Optional filter: all tracked brands, one brand, or one project. Activating the workflow subscribes a webhook in your AdSpendSpy account; deactivating it removes the webhook.

**AdSpendSpy** (action node, usable as an AI agent tool)

| Resource | Operation | Endpoint |
|---|---|---|
| Brand | Track | `POST /api/v1/brands/track.php` |
| Brand | Search | `GET /api/v1/brands/search-tracked.php` |
| Brand | Get Many | `GET /api/v1/brands/list.php` |
| Ad | Get Many New | `GET /api/v1/ads/new.php` (`since_id`, brand or project filter, Return All follows `next_cursor`) |
| Alert | Get Many | `GET /api/v1/alerts/list.php` (same options) |

Every event and every polled item has the same JSON shape: `id`, `event`, `occurred_at`, `currency`, `spend_is_estimate`, `brand`, `ad` and `alert` (`null` for new ads). Spend values are AdSpendSpy estimates in EUR; `null` means no estimate yet.

## Credentials

1. Sign in to AdSpendSpy on a paid plan or a running trial.
2. Create a personal API key under **Account Settings → API Keys**.
3. In n8n, create an **AdSpendSpy API** credential and paste the key. Leave **Base URL** at `https://www.adspendspy.com` unless you test against a local server.

n8n sends the key as `Authorization: Bearer <key>`. The credential test calls `GET /api/v1/brands/list.php`.

Each API key has a daily quota of 1,000 requests. Webhook deliveries do not count against it; subscribing, listing and polling do.

## Compatibility

- n8n 1.x with community nodes enabled (`n8nNodesApiVersion` 1).
- Node.js 22 for building.
- No runtime dependencies. The webhook signature check uses Node's built-in `crypto`.

## Usage

**Webhook signature.** Each delivery carries `X-AdSpendSpy-Timestamp` and `X-AdSpendSpy-Signature: v1=<hex>`, where `hex = HMAC-SHA256(secret, "<timestamp>.<raw body>")`. The trigger stores the secret it receives when it subscribes, compares in constant time, and accepts timestamps within ±300 seconds. An invalid request gets `401` and starts no execution.

**Duplicates and order.** Each event has a stable `id`; deliveries can arrive more than once and in any order, so deduplicate on `id` and sort on `occurred_at`.

**Templates.** Import a ready workflow from [`templates/`](templates/):

- `new-ad-to-slack.json`: posts each new ad of a tracked brand to a Slack channel.
- `spend-alert-to-google-sheets.json`: appends each spend alert as a row in Google Sheets.

Select your own credentials after import; the templates contain no keys.

**Development.**

```bash
npm install
npm run lint
npm run build
npm test    # signature test vector, runs against dist/
```

## Resources

- [AdSpendSpy API documentation](https://www.adspendspy.com/api-docs#automations)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
