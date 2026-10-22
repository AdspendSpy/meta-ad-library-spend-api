/**
 * Print a competitor ad spend report for the last 30 days.
 *
 *   export ADSPENDSPY_API_KEY=asp_live_...
 *   npx tsx examples/typescript/spend-report.ts
 */

import { AdSpendSpy, AdSpendSpyError, type StatBucket } from '../../typescript/src/index.js';

function section(title: string, rows: StatBucket[], labelKey: string): void {
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log('  (no data)');
    return;
  }
  const values = rows.map((row) => Number(row.total_spend ?? 0));
  const top = Math.max(...values, 0);
  rows.forEach((row, index) => {
    const value = values[index] ?? 0;
    const label = String(row[labelKey] ?? '-').slice(0, 38).padEnd(38);
    const filled = top > 0 ? Math.round((value / top) * 24) : 0;
    const bar = '#'.repeat(filled) + '.'.repeat(24 - filled);
    console.log(`  ${label} ${bar} ${value.toLocaleString()}`);
  });
}

async function main(): Promise<void> {
  const spy = new AdSpendSpy();

  const [brands, stats] = await Promise.all([spy.brands(), spy.topAds({ timeframe: '30d' })]);

  console.log('='.repeat(78));
  console.log('COMPETITOR AD SPEND - LAST 30 DAYS');
  console.log('='.repeat(78));
  console.log(`Brands tracked : ${brands.length}`);
  console.log(`Ads analysed   : ${stats.adCount.toLocaleString()}`);
  console.log(`Estimated spend: ${stats.totalSpend.toLocaleString()}`);

  if (stats.totalSpend === 0 && stats.adCount > 0) {
    console.log(
      '\nNote: ads were found but no spend could be estimated. Meta only publishes reach\n' +
        'and impression ranges for EU/UK ads - outside those regions the spend is unknown,\n' +
        'not zero.',
    );
  }

  section('TOP CALL-TO-ACTIONS BY SPEND', stats.ctaStats, 'cta_type');
  section('TOP HOOKS BY SPEND', stats.hooksStats, 'hook');
  section('TOP HEADLINES BY SPEND', stats.headlineStats, 'headline');

  console.log('\nBRANDS BY AD COUNT');
  [...brands]
    .sort((a, b) => Number(b.ad_count) - Number(a.ad_count))
    .slice(0, 15)
    .forEach((brand) => {
      console.log(`  ${brand.brand_name.slice(0, 38).padEnd(38)} ${String(brand.ad_count).padStart(6)} ads`);
    });
}

main().catch((error: unknown) => {
  if (error instanceof AdSpendSpyError) {
    console.error(`AdSpendSpy error: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
