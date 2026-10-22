# adspendspy — Meta Ad Library spend API client for Python

**AdSpendSpy is a Meta Ad Library spend API: the ads from the Meta Ad Library, plus the estimated spend behind each Facebook and Instagram ad.** This package
reads estimated ad spend, creatives, call-to-actions, hooks and headlines for the advertisers you
track. Zero dependencies, Python 3.9+.

```bash
pip install adspendspy
export ADSPENDSPY_API_KEY=asp_live_...
```

```python
from adspendspy import AdSpendSpy

spy = AdSpendSpy()
stats = spy.top_ads(timeframe="30d")
print(f"{stats['totalSpend']:,.0f} estimated spend across {stats['adCount']} ads")

for brand in spy.brands():
    print(brand["brand_name"], brand["ad_count"])
```

Create a key under Account Settings → API Keys at <https://www.adspendspy.com/settings.php>.

Spend estimates exist only for EU/UK ads, where Meta publishes reach and impression ranges.
Elsewhere the ads are returned but `totalSpend` stays at `0` — a missing measurement, not a
measured zero.

Full documentation: <https://github.com/adspendspy/meta-ad-library-spend-api>
