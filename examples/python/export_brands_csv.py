"""Export every tracked brand to CSV.

    export ADSPENDSPY_API_KEY=asp_live_...
    python3 examples/python/export_brands_csv.py brands.csv
"""

import csv
import sys

sys.path.insert(0, "python")  # run straight from a checkout, no install needed

from adspendspy import AdSpendSpy, AdSpendSpyError  # noqa: E402

COLUMNS = [
    "id",
    "page_id",
    "brand_name",
    "category",
    "ad_count",
    "likes",
    "ig_username",
    "ig_followers",
    "created_at",
]


def main() -> int:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "brands.csv"

    spy = AdSpendSpy()
    brands = spy.brands()

    with open(out_path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for brand in brands:
            writer.writerow(brand)

    print(f"Wrote {len(brands)} brands to {out_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AdSpendSpyError as exc:
        print(f"AdSpendSpy error: {exc}", file=sys.stderr)
        raise SystemExit(1)
