"""Exception types raised by the AdSpendSpy client.

Every failure mode the API can produce has its own class, so calling code can react to
"my key is wrong" differently from "I hit the daily quota" without parsing message strings.
"""

from __future__ import annotations

from typing import Optional


class AdSpendSpyError(Exception):
    """Base class for every error raised by this client."""

    def __init__(self, message: str, status: Optional[int] = None, endpoint: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.endpoint = endpoint

    def __str__(self) -> str:
        parts = [self.message]
        if self.status is not None:
            parts.append(f"(HTTP {self.status})")
        if self.endpoint:
            parts.append(f"at {self.endpoint}")
        return " ".join(parts)


class AuthenticationError(AdSpendSpyError):
    """The API key is missing, malformed, revoked or unknown (HTTP 401)."""


class PermissionError_(AdSpendSpyError):
    """The endpoint is not reachable with an API key (HTTP 403).

    Named with a trailing underscore so it does not shadow the builtin ``PermissionError``.
    Exported as ``ForbiddenError``.
    """


ForbiddenError = PermissionError_


class RateLimitError(AdSpendSpyError):
    """The key exhausted its daily request quota (HTTP 429)."""


class NotFoundError(AdSpendSpyError):
    """The requested ad, list or project does not exist (HTTP 404)."""


class APIError(AdSpendSpyError):
    """Any other non-success response, including HTTP 500 and malformed JSON."""
