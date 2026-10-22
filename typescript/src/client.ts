/**
 * TypeScript client for the AdSpendSpy read-only API.
 *
 * Zero dependencies - uses the global `fetch` (Node 18+, Bun, Deno, browsers).
 */

import {
  APIError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
} from './errors.js';

const DEFAULT_BASE_URL = 'https://www.adspendspy.com';
const USER_AGENT =
  'adspendspy-js/0.2.0 (+https://github.com/adspendspy/meta-ad-library-spend-api)';

export interface AdSpendSpyOptions {
  /** Personal API key (`asp_live_...`). Falls back to `process.env.ADSPENDSPY_API_KEY`. */
  apiKey?: string;
  /** Override the host, e.g. when testing against a local instance. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Default 30000. */
  timeoutMs?: number;
  /** Retries for 5xx and network errors. Default 2. 4xx is never retried. */
  maxRetries?: number;
}

/** A brand you track, as returned by `brands()`. */
export interface Brand {
  id: number;
  page_id: string;
  brand_name: string;
  brand_image: string | null;
  category: string | null;
  likes: number | null;
  verification: string | null;
  ig_username: string | null;
  ig_followers: number | null;
  created_at: string;
  ad_count: number;
}

/** One bucket of an aggregation, e.g. a call-to-action or a hook. */
export interface StatBucket {
  [key: string]: string | number | null;
}

/** Aggregated spend statistics returned by `topAds()`. */
export interface TopAdsStats {
  totalSpend: number;
  adCount: number;
  mediaTypeStats: StatBucket[];
  durationStats: StatBucket[];
  maxDurationSpend: number;
  genderStats: StatBucket[];
  ageStats: StatBucket[];
  ctaStats: StatBucket[];
  hooksStats: StatBucket[];
  headlineStats: StatBucket[];
}

export interface TopAdsQuery {
  /** Free-text filter over ad copy. */
  query?: string;
  /** `'all'` | `'image'` | `'video'`. */
  mediaType?: string;
  /** Brand category filter. */
  category?: string;
  /** `'7d'` | `'30d'` | `'90d'` | `'all'`. Default `'30d'`. */
  timeframe?: string;
  /** Only count ads that are still running. */
  activeOnly?: boolean;
  /** `'all'` or a project `public_id`. */
  project?: string;
}

/** Automation event names. */
export type IntegrationEvent = 'ad.new' | 'ad.spend_alert';

/** Automation platform a webhook is registered for. */
export type WebhookPlatform = 'zapier' | 'make' | 'n8n' | 'custom';

/**
 * One automation event - identical in polling `items[]` and webhook bodies.
 *
 * Spend is the latest cumulative EUR estimate; `null` means unknown (never a measured zero).
 */
export interface IntegrationItem {
  /** Stable event id, e.g. `ad.new:48211` - deduplicate on it. */
  id: string;
  event: IntegrationEvent;
  /** ISO 8601 with offset. Deliveries are unordered: sort by this. */
  occurred_at: string;
  currency: 'EUR';
  spend_is_estimate: boolean;
  brand: {
    page_id: string;
    name: string;
    image_url: string | null;
    url: string;
  };
  ad: {
    internal_ad_id: number;
    meta_ad_id: string | null;
    ad_archive_id: string | null;
    headline: string | null;
    body_text: string | null;
    cta_text: string | null;
    landing_url: string | null;
    media_type: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    platforms: string[];
    start_date: string | null;
    is_active: boolean;
    estimated_spend_eur: number | null;
    spend_coverage: string | null;
    url: string;
  };
  /** `null` for `ad.new`. */
  alert: {
    alert_id: number;
    threshold_eur: number | null;
    spend_at_alert_eur: number | null;
  } | null;
}

/** Query for `newAds()` and `alerts()`. Use either `pageId` or `project`, not both. */
export interface IntegrationQuery {
  /** Exclusive lower bound (`internal_ad_id` resp. `alert_id`). */
  sinceId?: number;
  /** Opaque cursor from `pagination.next_cursor`. */
  cursor?: string;
  /** 1-100, default 25. */
  limit?: number;
  pageId?: string;
  project?: string;
}

/** One page of polled events. Without `sinceId`/`cursor` it covers the last 30 days. */
export interface IntegrationPage {
  items: IntegrationItem[];
  pagination: { next_cursor: string | null; has_more: boolean };
  meta: { currency: string; spend_basis: string; spend_is_estimate: boolean };
}

/** A registered webhook (the secret is never listed). */
export interface Webhook {
  id: string;
  event: IntegrationEvent;
  target_url: string;
  platform: WebhookPlatform;
  filters: { page_id: string | null; project: string | null };
  created_at: string;
  last_delivery_at?: string | null;
  last_success_at?: string | null;
  last_status?: 'sent' | 'retrying' | 'failed' | null;
}

/** Answer of `subscribeWebhook()`. The `secret` is shown only here - store it. */
export interface WebhookCreated {
  webhook: Webhook;
  secret: string;
}

export interface SubscribeWebhookOptions {
  event: IntegrationEvent;
  /** `https`, port 443 or 8443, public IP, no credentials in the URL. */
  targetUrl: string;
  platform?: WebhookPlatform;
  pageId?: string | null;
  project?: string | null;
}

/**
 * Read competitor ad data from AdSpendSpy.
 *
 * ```ts
 * const spy = new AdSpendSpy();            // reads ADSPENDSPY_API_KEY
 * const stats = await spy.topAds({ timeframe: '30d' });
 * console.log(stats.totalSpend, 'EUR across', stats.adCount, 'ads');
 * ```
 *
 * Get a key at https://www.adspendspy.com/settings.php (Account Settings -> API Keys).
 */
export class AdSpendSpy {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  /** Remaining daily quota reported by the last response, or `null` if unknown. */
  requestsRemaining: number | null = null;

  constructor(options: AdSpendSpyOptions = {}) {
    const key =
      options.apiKey ??
      (typeof process !== 'undefined' ? process.env?.ADSPENDSPY_API_KEY : undefined);

    if (!key) {
      throw new AuthenticationError(
        'No API key. Pass { apiKey } or set ADSPENDSPY_API_KEY. ' +
          'Create a key at https://www.adspendspy.com/settings.php',
      );
    }

    this.apiKey = key;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 2;
  }

  // ---------------------------------------------------------------- endpoints

  /** Every brand you track, with its ad count. */
  async brands(project = 'all'): Promise<Brand[]> {
    const payload = await this.get('brands/list.php', { project });
    return (payload.data ?? []) as Brand[];
  }

  /** Number of tracked brands, account-wide, regardless of the project filter. */
  async brandCount(project = 'all'): Promise<number> {
    const payload = await this.get('brands/list.php', { project });
    return Number(payload.total_count ?? 0);
  }

  /**
   * Search *within the brands you already track*.
   *
   * This does not hit the Meta Ad Library - discovering new brands runs through a paid
   * upstream call and stays in the web app on purpose.
   */
  async searchBrands(query: string): Promise<Brand[]> {
    const payload = await this.get('brands/search-tracked.php', { q: query });
    return (payload.data ?? payload.brands ?? []) as Brand[];
  }

  /** Check which of the given Facebook page ids you already track. */
  async tracked(pageIds: string[]): Promise<Record<string, boolean>> {
    const payload = await this.post('brands/check-tracked.php', { page_ids: pageIds });
    const raw = payload.tracked;

    if (raw && !Array.isArray(raw) && typeof raw === 'object') {
      return Object.fromEntries(
        Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, Boolean(v)]),
      );
    }

    const trackedSet = new Set((Array.isArray(raw) ? raw : []).map(String));
    return Object.fromEntries(pageIds.map((id) => [id, trackedSet.has(String(id))]));
  }

  /** One ad with its creative fields and per-country demographics. */
  async ad(adId: number): Promise<Record<string, unknown>> {
    const payload = await this.get('ads/details.php', { ad_id: adId });
    return { ...(payload.ad as object), demographics: payload.demographics ?? [] };
  }

  /**
   * Aggregated spend statistics across the ads of your tracked brands.
   *
   * Spend is only estimated for EU/UK ads, where Meta publishes reach and impression ranges.
   * For other regions the ads are listed but `totalSpend` stays at 0 - that is a missing
   * measurement, not a measured zero.
   */
  async topAds(query: TopAdsQuery = {}): Promise<TopAdsStats> {
    const payload = await this.get('stats/top-ads.php', {
      q: query.query ?? '',
      media_type: query.mediaType ?? 'all',
      category: query.category ?? '',
      timeframe: query.timeframe ?? '30d',
      active_only: query.activeOnly ? '1' : '0',
      project: query.project ?? 'all',
    });
    return payload.data as TopAdsStats;
  }

  /** Your saved ad lists (swipe files). */
  async lists(): Promise<Record<string, unknown>[]> {
    const payload = await this.get('lists/get.php', {});
    return (payload.lists ?? []) as Record<string, unknown>[];
  }

  /** One saved list including its ads. */
  async listAds(listId: number): Promise<Record<string, unknown>> {
    const payload = await this.get('lists/get.php', { list_id: listId });
    return (payload.list ?? {}) as Record<string, unknown>;
  }

  /** Your projects (groupings of tracked brands). */
  async projects(): Promise<Record<string, unknown>[]> {
    const payload = await this.get('projects/get.php', {});
    return (payload.projects ?? []) as Record<string, unknown>[];
  }

  /** Number of pending alerts (spend spikes, new ads, landing page changes). */
  async alertCount(): Promise<number> {
    const payload = await this.get('alerts/count.php', {});
    return Number(payload.count ?? 0);
  }

  // ------------------------------------------------------------- automations

  /** New ads of your tracked brands (`ad.new` events), newest first. */
  async newAds(params: IntegrationQuery = {}): Promise<IntegrationPage> {
    return this.integrationPage(await this.get('ads/new.php', this.integrationParams(params)));
  }

  /** Spend alerts (`ad.spend_alert` events), newest first. Reading never marks them sent. */
  async alerts(params: IntegrationQuery = {}): Promise<IntegrationPage> {
    return this.integrationPage(
      await this.get('alerts/list.php', this.integrationParams(params)),
    );
  }

  /**
   * Register a webhook. Deliveries start now (no backlog) and are signed with the returned
   * `secret` - verify them with `verifyWebhookSignature()`.
   */
  async subscribeWebhook(options: SubscribeWebhookOptions): Promise<WebhookCreated> {
    const payload = await this.post('webhooks/subscribe.php', {
      event: options.event,
      target_url: options.targetUrl,
      platform: options.platform ?? 'custom',
      page_id: options.pageId ?? null,
      project: options.project ?? null,
    });
    return { webhook: payload.webhook as Webhook, secret: String(payload.secret ?? '') };
  }

  /** Disable a webhook. Idempotent for your own webhooks. Returns `disabled_at`. */
  async unsubscribeWebhook(id: string): Promise<{ id: string; disabled_at: string }> {
    const payload = await this.post('webhooks/unsubscribe.php', { id });
    return payload.webhook as { id: string; disabled_at: string };
  }

  /** Your active webhooks with their last delivery status. */
  async webhooks(): Promise<Webhook[]> {
    const payload = await this.get('webhooks/list.php', {});
    return (payload.webhooks ?? []) as Webhook[];
  }

  // ---------------------------------------------------------------- internals

  private integrationParams(params: IntegrationQuery): Record<string, string | number> {
    const out: Record<string, string | number> = {};
    if (params.sinceId !== undefined) out.since_id = params.sinceId;
    if (params.cursor) out.cursor = params.cursor;
    if (params.limit !== undefined) out.limit = params.limit;
    if (params.pageId) out.page_id = params.pageId;
    if (params.project) out.project = params.project;
    return out;
  }

  private integrationPage(payload: Record<string, any>): IntegrationPage {
    return {
      items: (payload.items ?? []) as IntegrationItem[],
      pagination: {
        next_cursor: payload.pagination?.next_cursor ?? null,
        has_more: Boolean(payload.pagination?.has_more),
      },
      meta: payload.meta ?? {
        currency: 'EUR',
        spend_basis: 'latest_cumulative_estimate',
        spend_is_estimate: true,
      },
    };
  }

  private async get(
    endpoint: string,
    params: Record<string, string | number>,
  ): Promise<Record<string, any>> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== undefined && value !== null) {
        search.set(key, String(value));
      }
    }
    const qs = search.toString();
    const url = `${this.baseUrl}/api/v1/${endpoint}${qs ? `?${qs}` : ''}`;
    return this.request(url, endpoint, 'GET');
  }

  private async post(endpoint: string, body: unknown): Promise<Record<string, any>> {
    return this.request(`${this.baseUrl}/api/v1/${endpoint}`, endpoint, 'POST', body);
  }

  private async request(
    url: string,
    endpoint: string,
    method: 'GET' | 'POST',
    body?: unknown,
  ): Promise<Record<string, any>> {
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });

        const text = await response.text();

        if (!response.ok) {
          // 4xx is a verdict, not a hiccup: retrying cannot change the answer.
          if (response.status < 500) {
            throw this.toError(text, response.status, endpoint);
          }
          lastError = new APIError(
            this.messageOf(text, 'Server error'),
            response.status,
            endpoint,
          );
        } else {
          return this.parse(text, response.status, endpoint);
        }
      } catch (error) {
        if (
          error instanceof AuthenticationError ||
          error instanceof ForbiddenError ||
          error instanceof NotFoundError ||
          error instanceof RateLimitError
        ) {
          throw error;
        }
        lastError =
          error instanceof Error
            ? new APIError(`Network error: ${error.message}`, undefined, endpoint)
            : new APIError('Request failed', undefined, endpoint);
      } finally {
        clearTimeout(timer);
      }

      if (attempt < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }

    throw lastError ?? new APIError('Request failed', undefined, endpoint);
  }

  private parse(text: string, status: number, endpoint: string): Record<string, any> {
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new APIError('Response was not valid JSON', status, endpoint);
    }

    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new APIError('Response was not a JSON object', status, endpoint);
    }

    const record = payload as Record<string, any>;
    // The API answers 200 with success=false in a few places - treat that as an error too.
    if (record.success === false) {
      throw new APIError(String(record.message ?? 'Request failed'), status, endpoint);
    }

    return record;
  }

  private toError(text: string, status: number, endpoint: string): Error {
    const message = this.messageOf(text, 'Request failed');
    if (status === 401) return new AuthenticationError(message, status, endpoint);
    if (status === 403) return new ForbiddenError(message, status, endpoint);
    if (status === 404) return new NotFoundError(message, status, endpoint);
    if (status === 429) return new RateLimitError(message, status, endpoint);
    return new APIError(message, status, endpoint);
  }

  private messageOf(text: string, fallback: string): string {
    try {
      const payload = JSON.parse(text);
      if (payload && typeof payload === 'object' && payload.message) {
        return String(payload.message);
      }
    } catch {
      /* fall through */
    }
    return fallback;
  }
}
