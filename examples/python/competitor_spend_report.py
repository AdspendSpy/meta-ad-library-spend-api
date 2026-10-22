"""Print a competitor ad spend report for the last 30 days.

    export ADSPENDSPY_API_KEY=asp_live_...
    python3 examples/python/competitor_spend_report.py

Shows total estimated spend, the ad count behind it, and the call-to-actions and hooks that
carry the most spend - i.e. what your competitors are actually putting money behind.
"""

import sys

sys.path.insert(0, "python")  # run straight from a checkout, no install needed

from adspendspy import AdSpendSpy, AdSpendSpyError  # noqa: E402


def bar(value: float, maximum: float, width: int = 24) -> str:
    if maximum <= 0:
        return " " * width
    filled = int(round((value / maximum) * width))
    return "#" * filled + "." * (width - filled)


def section(title: str, rows, label_key: str, value_key: str = "total_spend") -> None:
    print(f"\n{title}")
    if not rows:
        print("  (no data)")
        return
    values = [float(r.get(value_key) or 0) for r in rows]
    top = max(values) if values else 0
    for row, value in zip(rows, values):
        label = str(row.get(label_key) or "-")[:38]
        print(f"  {label:<38} {bar(value, top)} {value:>12,.0f}")


def main() -> int:
    spy = AdSpendSpy()

    brands = spy.brands()
    stats = spy.top_ads(timeframe="30d")

    total = float(stats.get("totalSpend") or 0)
    ad_count = int(stats.get("adCount") or 0)

    print("=" * 78)
    print("COMPETITOR AD SPEND - LAST 30 DAYS")
    print("=" * 78)
    print(f"Brands tracked : {len(brands)}")
    print(f"Ads analysed   : {ad_count:,}")
    print(f"Estimated spend: {total:,.0f}")

    if total == 0 and ad_count > 0:
        print(
            "\nNote: ads were found but no spend could be estimated. Meta only publishes\n"
            "reach and impression ranges for EU/UK ads - outside those regions the spend is\n"
            "unknown, not zero."
        )

    section("TOP CALL-TO-ACTIONS BY SPEND", stats.get("ctaStats", []), "cta_type")
    section("TOP HOOKS BY SPEND", stats.get("hooksStats", []), "hook")
    section("TOP HEADLINES BY SPEND", stats.get("headlineStats", []), "headline")
    section("SPEND BY MEDIA TYPE", stats.get("mediaTypeStats", []), "media_type")

    print("\nBRANDS BY AD COUNT")
    for brand in sorted(brands, key=lambda b: int(b.get("ad_count") or 0), reverse=True)[:15]:
        print(f"  {str(brand.get('brand_name'))[:38]:<38} {int(brand.get('ad_count') or 0):>6} ads")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AdSpendSpyError as exc:
        print(f"AdSpendSpy error: {exc}", file=sys.stderr)
        raise SystemExit(1)
