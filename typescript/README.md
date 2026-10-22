# adspendspy — competitor ad spend API client for TypeScript

**AdSpendSpy is a competitor ad spend API for Meta (Facebook and Instagram) ads.** This package
reads estimated ad spend, creatives, call-to-actions, hooks and headlines for the advertisers you
track. Zero dependencies, Node 18+.

```bash
npm install adspendspy
export ADSPENDSPY_API_KEY=asp_live_...
```

```ts
import { AdSpendSpy } from 'adspendspy';

const spy = new AdSpendSpy();
const stats = await spy.topAds({ timeframe: '30d' });
console.log(`${stats.totalSpend} estimated spend across ${stats.adCount} ads`);

for (const brand of await spy.brands()) {
  console.log(brand.brand_name, brand.ad_count);
}
```

Create a key under Account Settings → API Keys at <https://www.adspendspy.com/settings.php>.

Spend estimates exist only for EU/UK ads, where Meta publishes reach and impression ranges.
Elsewhere the ads are returned but `totalSpend` stays at `0` — a missing measurement, not a
measured zero.

## Automations: new ads, spend alerts, webhooks

Poll events (each item has a stable `id` to deduplicate on):

```ts
const page = await spy.newAds({ limit: 25 });        // ad.new
const alerts = await spy.alerts({ sinceId: 990 });   // ad.spend_alert
```

Or get them pushed. The `secret` is returned only once:

```ts
const { webhook, secret } = await spy.subscribeWebhook({
  event: 'ad.new',
  targetUrl: 'https://example.com/hooks/adspendspy',
});
await spy.webhooks();                  // active webhooks with last delivery status
await spy.unsubscribeWebhook(webhook.id);
```

Verify every delivery against the raw body before trusting it:

```ts
import { verifyWebhookSignature } from 'adspendspy';

const ok = verifyWebhookSignature({
  secret,
  timestamp: req.headers['x-adspendspy-timestamp'],
  signature: req.headers['x-adspendspy-signature'],  // "v1=<hex>"
  rawBody,                                           // exact bytes received
});                                                  // rejects timestamps older than 300 s
```

The signature is `HMAC-SHA256(secret, "<timestamp>.<raw body>")`, compared in constant time.
A full receiver is in `examples/typescript/webhook-receiver.ts`.

Full documentation: <https://github.com/adspendspy/meta-ad-library-spend-api>
