'use strict';

// Runs against the built file: npm run build && npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const {
	computeSignature,
	verifySignature,
} = require('../dist/nodes/AdSpendSpyTrigger/signature.js');

// Test vector from docs/AUTOMATIONS.md, section 7.
const SECRET = 'whsec_test';
const TIMESTAMP = '1700000000';
const BODY = '{"id":"ad.new:1"}';
const EXPECTED = 'v1=98ab6f15d65efe0ec4dbf9f25fdeeeef42a5651d8bd1bd10f3b3609b436a6474';

test('computes the contract test vector', () => {
	assert.equal(computeSignature(SECRET, TIMESTAMP, BODY), EXPECTED);
});

test('accepts a valid signature inside the time window', () => {
	const input = { secret: SECRET, timestamp: TIMESTAMP, signature: EXPECTED, rawBody: BODY };
	assert.equal(verifySignature({ ...input, nowSeconds: 1700000000 }), true);
	assert.equal(verifySignature({ ...input, nowSeconds: 1700000300 }), true);
	assert.equal(verifySignature({ ...input, nowSeconds: 1699999700 }), true);
});

test('rejects timestamps outside +-300 s', () => {
	const input = { secret: SECRET, timestamp: TIMESTAMP, signature: EXPECTED, rawBody: BODY };
	assert.equal(verifySignature({ ...input, nowSeconds: 1700000301 }), false);
	assert.equal(verifySignature({ ...input, nowSeconds: 1699999699 }), false);
});

test('rejects a changed body, wrong secret or malformed headers', () => {
	const base = { secret: SECRET, timestamp: TIMESTAMP, signature: EXPECTED, rawBody: BODY, nowSeconds: 1700000000 };
	assert.equal(verifySignature({ ...base, rawBody: '{"id":"ad.new:2"}' }), false);
	assert.equal(verifySignature({ ...base, secret: 'whsec_other' }), false);
	assert.equal(verifySignature({ ...base, signature: undefined }), false);
	assert.equal(verifySignature({ ...base, signature: 'v1=abc' }), false);
	assert.equal(verifySignature({ ...base, timestamp: 'abc' }), false);
	assert.equal(verifySignature({ ...base, secret: '' }), false);
});
