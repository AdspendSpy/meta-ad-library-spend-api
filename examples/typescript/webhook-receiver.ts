/**
 * Minimal receiver for AdSpendSpy webhooks (ad.new, ad.spend_alert).
 *
 *   export ADSPENDSPY_WEBHOOK_SECRET=whsec_...   # shown once by subscribeWebhook()
 *   npx tsx examples/typescript/webhook-receiver.ts
 *
 * Expose it over https (port 443 or 8443) and register the public URL with
 * `spy.subscribeWebhook({ event: 'ad.new', targetUrl })`.
 */

import { createServer } from 'node:http';
import { verifyWebhookSignature, type IntegrationItem } from '../../typescript/src/index.js';

const secret = process.env.ADSPENDSPY_WEBHOOK_SECRET ?? '';
const port = Number(process.env.PORT ?? 8443);

if (!secret) {
  console.error('Set ADSPENDSPY_WEBHOOK_SECRET.');
  process.exit(1);
}

const server = createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end();
    return;
  }

  // Read the raw body: the signature covers the exact bytes, not re-serialized JSON.
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const rawBody = Buffer.concat(chunks);
    const valid = verifyWebhookSignature({
      secret,
      timestamp: String(req.headers['x-adspendspy-timestamp'] ?? ''),
      signature: String(req.headers['x-adspendspy-signature'] ?? ''),
      rawBody,
    });

    if (!valid) {
      res.writeHead(401).end('invalid signature');
      return;
    }

    // Answer fast (5 s limit); deduplicate on item.id, order by occurred_at.
    const item = JSON.parse(rawBody.toString('utf8')) as IntegrationItem;
    const spend = item.ad.estimated_spend_eur;
    console.log(
      `${item.event} ${item.id} ${item.brand.name}: ${item.ad.headline ?? '(no headline)'}` +
        (spend === null ? ' (spend unknown)' : ` ~${spend} EUR est.`),
    );
    res.writeHead(200).end('ok');
  });
});

server.listen(port, () => console.log(`Listening on :${port}`));
