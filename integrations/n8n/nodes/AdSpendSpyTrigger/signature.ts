import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Webhook signature of the AdSpendSpy API (contract: docs/AUTOMATIONS.md, section 7).
 * hex = HMAC-SHA256(secret, "<timestamp>.<raw body>"), header value "v1=<hex>".
 */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export function computeSignature(secret: string, timestamp: string, rawBody: string): string {
	return 'v1=' + createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export interface VerifySignatureInput {
	secret: string;
	timestamp: string | undefined;
	signature: string | undefined;
	rawBody: string;
	nowSeconds?: number;
	toleranceSeconds?: number;
}

export function verifySignature(input: VerifySignatureInput): boolean {
	const { secret, timestamp, signature, rawBody } = input;
	if (!secret || !timestamp || !signature || !/^\d{1,12}$/.test(timestamp)) {
		return false;
	}
	const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
	const tolerance = input.toleranceSeconds ?? SIGNATURE_TOLERANCE_SECONDS;
	if (Math.abs(now - Number(timestamp)) > tolerance) {
		return false;
	}
	const expected = Buffer.from(computeSignature(secret, timestamp, rawBody), 'utf8');
	const received = Buffer.from(signature.trim(), 'utf8');
	if (expected.length !== received.length) {
		return false;
	}
	return timingSafeEqual(expected, received);
}
