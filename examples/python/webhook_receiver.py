"""Minimal AdSpendSpy webhook receiver (standard library only).

    pip install adspendspy
    export ADSPENDSPY_WEBHOOK_SECRET=whsec_...   # shown once by subscribe_webhook()
    python webhook_receiver.py                    # listens on :8080

Expose it over HTTPS (port 443 or 8443) and subscribe it, e.g.:

    from adspendspy import AdSpendSpy
    hook = AdSpendSpy().subscribe_webhook("ad.new", "https://hooks.example.com/adspendspy")
    print(hook["secret"])

Every delivery is one item (event ``ad.new`` or ``ad.spend_alert``). Deliveries can repeat
and arrive out of order: deduplicate on ``id`` and sort by ``occurred_at``.
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

from adspendspy import verify_webhook_signature

SECRET = os.environ.get("ADSPENDSPY_WEBHOOK_SECRET", "")
PORT = int(os.environ.get("PORT", "8080"))
seen_ids = set()


class Handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802 - http.server API
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length)  # verify the raw bytes, never re-serialized JSON

        if not verify_webhook_signature(
            SECRET,
            self.headers.get("X-AdSpendSpy-Timestamp", ""),
            self.headers.get("X-AdSpendSpy-Signature", ""),
            raw,
        ):
            self._reply(401, "invalid signature")
            return

        item = json.loads(raw)
        if item["id"] in seen_ids:
            self._reply(200, "duplicate")
            return
        seen_ids.add(item["id"])

        brand = (item.get("brand") or {}).get("name")
        ad = item.get("ad") or {}
        spend = ad.get("estimated_spend_eur")
        spend_text = f"~{spend:,.0f} EUR (estimate)" if spend is not None else "spend unknown"
        print(f"[{item['event']}] {brand}: {ad.get('headline') or '(no headline)'} - {spend_text}")
        print(f"    {ad.get('url')}")

        # Answer fast (within 5 s); do slow work in a queue.
        self._reply(200, "ok")

    def _reply(self, status: int, text: str) -> None:
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    if not SECRET:
        raise SystemExit("Set ADSPENDSPY_WEBHOOK_SECRET to the secret from subscribe_webhook().")
    print(f"Listening on http://0.0.0.0:{PORT}")
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
