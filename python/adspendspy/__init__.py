"""AdSpendSpy - competitor ad spend API client for Python.

Query the Meta (Facebook/Instagram) ads of the brands you track: estimated spend, creatives,
call-to-actions, hooks and headlines.

    from adspendspy import AdSpendSpy

    spy = AdSpendSpy()                      # reads ADSPENDSPY_API_KEY
    stats = spy.top_ads(timeframe="30d")
    print(stats["totalSpend"], "EUR across", stats["adCount"], "ads")

Get a key at https://www.adspendspy.com/settings.php (Account Settings -> API Keys).
"""

from .client import AdSpendSpy
from .errors import (
    AdSpendSpyError,
    APIError,
    AuthenticationError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
)
from .webhooks import verify_webhook_signature

__version__ = "0.2.0"

__all__ = [
    "AdSpendSpy",
    "AdSpendSpyError",
    "APIError",
    "AuthenticationError",
    "ForbiddenError",
    "NotFoundError",
    "RateLimitError",
    "verify_webhook_signature",
    "__version__",
]
