/**
 * Error types raised by the AdSpendSpy client.
 *
 * Every failure mode has its own class, so calling code can tell "my key is wrong" from
 * "I hit the daily quota" without parsing message strings.
 */

export class AdSpendSpyError extends Error {
  readonly status?: number;
  readonly endpoint?: string;

  constructor(message: string, status?: number, endpoint?: string) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.endpoint = endpoint;
  }
}

/** The API key is missing, malformed, revoked or unknown (HTTP 401). */
export class AuthenticationError extends AdSpendSpyError {}

/** The endpoint is not reachable with an API key (HTTP 403). */
export class ForbiddenError extends AdSpendSpyError {}

/** The requested ad, list or project does not exist (HTTP 404). */
export class NotFoundError extends AdSpendSpyError {}

/** The key exhausted its daily request quota (HTTP 429). */
export class RateLimitError extends AdSpendSpyError {}

/** Any other non-success response, including HTTP 500 and malformed JSON. */
export class APIError extends AdSpendSpyError {}
