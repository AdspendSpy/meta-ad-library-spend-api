/**
 * Verify AdSpendSpy webhook deliveries (Node only - uses `node:crypto`).
 *
 * Each delivery carries `X-AdSpendSpy-Timestamp` (unix seconds) and
 * `X-AdSpendSpy-Signature: v1=<hex>`, where `hex = HMAC-SHA256(secret, "<timestamp>.<raw body>")`.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifyWebhookSignatureOptions {
  /** The `whsec_...` secret returned once by `subscribeWebhook()`. */
  secret: string;
  /** Value of the `X-AdSpendSpy-Timestamp` header. */
  timestamp: string | number;
  /** Value of the `X-AdSpendSpy-Signature` header (`v1=<hex>`). */
  signature: string;
  /** The request body exactly as received - not re-serialized JSON. */
  rawBody: string | Uint8Array;
  /** Reject deliveries older (or further in the future) than this. Default 300. */
  toleranceSeconds?: number;
  /** Current unix time in seconds; for tests. Default `Date.now() / 1000`. */
  now?: number;
}

/** `true` only when the signature matches and the timestamp is within the tolerance. */
export function verifyWebhookSignature(options: VerifyWebhookSignatureOptions): boolean {
  const { secret, signature, rawBody } = options;
  const tolerance = options.toleranceSeconds ?? 300;
  const timestampText = String(options.timestamp).trim();

  if (!secret || !signature || !/^\d+$/.test(timestampText)) return false;

  const timestamp = Number(timestampText);
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) return false;

  const match = /^v1=([0-9a-f]+)$/i.exec(signature.trim());
  if (!match || !match[1]) return false;

  const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : Buffer.from(rawBody);
  const expected = createHmac('sha256', secret)
    .update(`${timestampText}.`, 'utf8')
    .update(body)
    .digest();
  const received = Buffer.from(match[1].toLowerCase(), 'hex');

  // timingSafeEqual throws on unequal lengths - check first.
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}
