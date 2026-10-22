"""Verify AdSpendSpy webhook deliveries.

Every delivery carries ``X-AdSpendSpy-Timestamp`` (unix seconds) and
``X-AdSpendSpy-Signature: v1=<hex>``, where ``hex = HMAC-SHA256(secret, "<timestamp>.<raw body>")``.
"""

from __future__ import annotations

import hashlib
import hmac
import time
from typing import Optional, Union

__all__ = ["verify_webhook_signature"]


def verify_webhook_signature(
    secret: str,
    timestamp: Union[str, int],
    signature: str,
    raw_body: Union[bytes, str],
    tolerance_seconds: int = 300,
    now: Optional[float] = None,
) -> bool:
    """Return True when a delivery is authentic and fresh.

    Args:
        secret: The ``whsec_...`` secret returned once by ``subscribe_webhook``.
        timestamp: Value of the ``X-AdSpendSpy-Timestamp`` header.
        signature: Value of the ``X-AdSpendSpy-Signature`` header (``v1=<hex>``).
        raw_body: The request body exactly as received - never re-serialized JSON.
        tolerance_seconds: Reject deliveries older (or further in the future) than this.
        now: Current unix time; defaults to ``time.time()``.
    """
    if not secret or not signature or timestamp is None:
        return False
    try:
        ts = int(str(timestamp).strip())
    except ValueError:
        return False

    current = time.time() if now is None else now
    if abs(current - ts) > tolerance_seconds:
        return False

    body = raw_body.encode("utf-8") if isinstance(raw_body, str) else raw_body
    expected = hmac.new(
        secret.encode("utf-8"), str(ts).encode("ascii") + b"." + body, hashlib.sha256
    ).hexdigest()

    # Accept a header that lists several comma-separated signatures (key rotation).
    for part in signature.split(","):
        part = part.strip()
        if part.startswith("v1=") and hmac.compare_digest(part[3:], expected):
            return True
    return False
