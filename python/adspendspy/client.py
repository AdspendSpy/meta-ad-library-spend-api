"""Python client for the AdSpendSpy read-only API.

Zero dependencies - standard library only, so the examples in this repository run on a
clean Python 3.9+ install without a virtualenv.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Iterable, List, Optional

from .errors import (
    APIError,
    AuthenticationError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
)

__all__ = ["AdSpendSpy"]

DEFAULT_BASE_URL = "https://www.adspendspy.com"
USER_AGENT = "adspendspy-python/0.2.0 (+https://github.com/adspendspy/meta-ad-library-spend-api)"


class AdSpendSpy:
    """Read competitor ad data from AdSpendSpy.

    Args:
        api_key: Personal API key (``asp_live_...``). Falls back to the ``ADSPENDSPY_API_KEY``
            environment variable. Create one under Account Settings -> API Keys.
        base_url: Override the host, e.g. when testing against a local instance.
        timeout: Per-request timeout in seconds.
        max_retries: How often to retry a request that failed with a 5xx or a network error.
            Rate-limit and authentication failures are never retried - retrying them cannot help.

    Example:
        >>> spy = AdSpendSpy()                      # reads ADSPENDSPY_API_KEY
        >>> for brand in spy.brands():
        ...     print(brand["brand_name"], brand["ad_count"])
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 30.0,
        max_retries: int = 2,
    ) -> None:
        key = api_key or os.environ.get("ADSPENDSPY_API_KEY")
        if not key:
            raise AuthenticationError(
                "No API key. Pass api_key=... or set ADSPENDSPY_API_KEY. "
                "Create a key at https://www.adspendspy.com/settings.php"
            )
        self.api_key = key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        # Populated from the last response, so callers can watch their remaining quota.
        self.requests_remaining: Optional[int] = None

    # ------------------------------------------------------------------ endpoints

    def brands(self, project: str = "all") -> List[Dict[str, Any]]:
        """Every brand you track, with its ad count.

        Args:
            project: ``"all"``, ``"unassigned"``, or a project ``public_id``.
        """
        payload = self._get("brands/list.php", {"project": project})
        return payload.get("data", [])

    def brand_count(self, project: str = "all") -> int:
        """Number of tracked brands, account-wide, regardless of the project filter."""
        payload = self._get("brands/list.php", {"project": project})
        return int(payload.get("total_count", 0))

    def search_brands(self, query: str) -> List[Dict[str, Any]]:
        """Search *within the brands you already track*.

        This does not hit the Meta Ad Library - discovering new brands runs through a paid
        upstream call and stays in the web app on purpose.
        """
        payload = self._get("brands/search-tracked.php", {"q": query})
        return payload.get("data", payload.get("brands", []))

    def tracked(self, page_ids: Iterable[str]) -> Dict[str, bool]:
        """Check which of the given Facebook page ids you already track."""
        payload = self._post("brands/check-tracked.php", {"page_ids": list(page_ids)})
        raw = payload.get("tracked", [])
        if isinstance(raw, dict):
            return {str(k): bool(v) for k, v in raw.items()}
        tracked_set = {str(x) for x in raw}
        return {str(pid): str(pid) in tracked_set for pid in page_ids}

    def ad(self, ad_id: int) -> Dict[str, Any]:
        """One ad with its creative fields and per-country demographics."""
        payload = self._get("ads/details.php", {"ad_id": int(ad_id)})
        ad = payload.get("ad", {})
        ad["demographics"] = payload.get("demographics", [])
        return ad

    def top_ads(
        self,
        query: str = "",
        media_type: str = "all",
        category: str = "",
        timeframe: str = "30d",
        active_only: bool = False,
        project: str = "all",
    ) -> Dict[str, Any]:
        """Aggregated spend statistics across the ads of your tracked brands.

        Returns estimated total spend, ad count, and breakdowns by media type, run duration,
        gender, age, call-to-action, hook and headline.

        Args:
            query: Free-text filter over ad copy.
            media_type: ``"all"``, ``"image"``, ``"video"``.
            category: Brand category filter.
            timeframe: ``"7d"``, ``"30d"``, ``"90d"``, ``"all"``.
            active_only: Only count ads that are still running.
            project: ``"all"`` or a project ``public_id``.

        Note:
            Spend is only estimated for EU/UK ads, where Meta publishes reach and impression
            ranges. For other regions the ads are listed but ``totalSpend`` stays at 0 - that
            is a missing measurement, not a measured zero.
        """
        payload = self._get(
            "stats/top-ads.php",
            {
                "q": query,
                "media_type": media_type,
                "category": category,
                "timeframe": timeframe,
                "active_only": "1" if active_only else "0",
                "project": project,
            },
        )
        return payload.get("data", {})

    def lists(self) -> List[Dict[str, Any]]:
        """Your saved ad lists (swipe files)."""
        payload = self._get("lists/get.php", {})
        return payload.get("lists", [])

    def list_ads(self, list_id: int) -> Dict[str, Any]:
        """One saved list including its ads."""
        payload = self._get("lists/get.php", {"list_id": int(list_id)})
        return payload.get("list", {})

    def projects(self) -> List[Dict[str, Any]]:
        """Your projects (groupings of tracked brands)."""
        payload = self._get("projects/get.php", {})
        return payload.get("projects", [])

    def alert_count(self) -> int:
        """Number of pending alerts (competitor spend spikes, new ads, landing page changes)."""
        payload = self._get("alerts/count.php", {})
        return int(payload.get("count", 0))

    # ------------------------------------------------------------ automations

    def new_ads(self, **params: Any) -> Dict[str, Any]:
        """Poll ``ad.new`` items, newest first.

        Keyword args (all optional): ``since_id`` (exclusive ``internal_ad_id``), ``cursor``
        (from ``pagination.next_cursor``), ``limit`` (1-100, default 25), ``page_id`` or
        ``project``. Without ``since_id`` and ``cursor`` the last 30 days are returned.

        Returns the full response: ``items``, ``pagination`` and ``meta``. Spend is an
        estimate in EUR; ``None`` means unknown, not zero.
        """
        return self._get("ads/new.php", params)

    def alerts(self, **params: Any) -> Dict[str, Any]:
        """Poll ``ad.spend_alert`` items, newest first. Reading never marks an alert as sent.

        Takes the same keyword args as :meth:`new_ads`; ``since_id`` refers to ``alert_id``.
        """
        return self._get("alerts/list.php", params)

    def subscribe_webhook(
        self,
        event: str,
        target_url: str,
        platform: str = "custom",
        page_id: Optional[str] = None,
        project: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Register a webhook for ``ad.new`` or ``ad.spend_alert``.

        Returns ``{"webhook": {...}, "secret": "whsec_..."}``. The secret is shown only
        once - store it and check every delivery with
        :func:`adspendspy.verify_webhook_signature`. No backlog is sent.

        Args:
            event: ``"ad.new"`` or ``"ad.spend_alert"``.
            target_url: Public ``https`` URL (port 443 or 8443).
            platform: ``"zapier"``, ``"make"``, ``"n8n"`` or ``"custom"``.
            page_id: Only events of this tracked brand.
            project: Only events of this project ``public_id``.
        """
        payload = self._post(
            "webhooks/subscribe.php",
            {
                "event": event,
                "target_url": target_url,
                "platform": platform,
                "page_id": page_id,
                "project": project,
            },
        )
        return {"webhook": payload.get("webhook", {}), "secret": payload.get("secret")}

    def unsubscribe_webhook(self, id: str) -> Dict[str, Any]:  # noqa: A002 - mirrors the API field
        """Disable a webhook by its ``whk_...`` id. Idempotent for your own webhooks."""
        payload = self._post("webhooks/unsubscribe.php", {"id": id})
        return payload.get("webhook", {})

    def webhooks(self) -> List[Dict[str, Any]]:
        """Your active webhooks (never includes the secret)."""
        payload = self._get("webhooks/list.php", {})
        return payload.get("webhooks", [])

    # ------------------------------------------------------------------- internals

    def _get(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        clean = {k: v for k, v in params.items() if v not in ("", None)}
        url = f"{self.base_url}/api/v1/{endpoint}"
        if clean:
            url = f"{url}?{urllib.parse.urlencode(clean)}"
        return self._request(url, endpoint, method="GET")

    def _post(self, endpoint: str, body: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/api/v1/{endpoint}"
        return self._request(url, endpoint, method="POST", body=body)

    def _request(
        self,
        url: str,
        endpoint: str,
        method: str = "GET",
        body: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        data = json.dumps(body).encode("utf-8") if body is not None else None
        headers = {
            "X-API-Key": self.api_key,
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        }
        if data is not None:
            headers["Content-Type"] = "application/json"

        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            request = urllib.request.Request(url, data=data, headers=headers, method=method)
            try:
                with urllib.request.urlopen(request, timeout=self.timeout) as response:
                    return self._parse(response.read(), response.status, endpoint)
            except urllib.error.HTTPError as exc:
                payload = exc.read()
                # 4xx is a verdict, not a hiccup: retrying cannot change the answer.
                if exc.code < 500:
                    self._raise_for_status(payload, exc.code, endpoint)
                last_error = APIError(self._message(payload, "Server error"), exc.code, endpoint)
            except urllib.error.URLError as exc:
                last_error = APIError(f"Network error: {exc.reason}", None, endpoint)

            if attempt < self.max_retries:
                time.sleep(0.5 * (2 ** attempt))

        raise last_error if last_error else APIError("Request failed", None, endpoint)

    def _parse(self, raw: bytes, status: int, endpoint: str) -> Dict[str, Any]:
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError) as exc:
            raise APIError(f"Response was not valid JSON: {exc}", status, endpoint) from exc

        if not isinstance(payload, dict):
            raise APIError("Response was not a JSON object", status, endpoint)

        # The API answers 200 with success=false in a few places - treat that as an error too.
        if payload.get("success") is False:
            raise APIError(payload.get("message", "Request failed"), status, endpoint)

        return payload

    def _raise_for_status(self, raw: bytes, status: int, endpoint: str) -> None:
        message = self._message(raw, "Request failed")
        if status == 401:
            raise AuthenticationError(message, status, endpoint)
        if status == 403:
            raise ForbiddenError(message, status, endpoint)
        if status == 404:
            raise NotFoundError(message, status, endpoint)
        if status == 429:
            raise RateLimitError(message, status, endpoint)
        raise APIError(message, status, endpoint)

    @staticmethod
    def _message(raw: bytes, fallback: str) -> str:
        try:
            payload = json.loads(raw.decode("utf-8"))
            if isinstance(payload, dict) and payload.get("message"):
                return str(payload["message"])
        except (ValueError, UnicodeDecodeError):
            pass
        return fallback
