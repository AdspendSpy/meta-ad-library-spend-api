/**
 * AdSpendSpy - competitor ad spend API client for TypeScript/Node.
 *
 * Query the Meta (Facebook/Instagram) ads of the brands you track: estimated spend,
 * creatives, call-to-actions, hooks and headlines.
 */

export { AdSpendSpy } from './client.js';
export type {
  AdSpendSpyOptions,
  Brand,
  IntegrationEvent,
  IntegrationItem,
  IntegrationPage,
  IntegrationQuery,
  StatBucket,
  SubscribeWebhookOptions,
  TopAdsQuery,
  TopAdsStats,
  Webhook,
  WebhookCreated,
  WebhookPlatform,
} from './client.js';
export { verifyWebhookSignature } from './webhooks.js';
export type { VerifyWebhookSignatureOptions } from './webhooks.js';
export {
  AdSpendSpyError,
  APIError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
} from './errors.js';
