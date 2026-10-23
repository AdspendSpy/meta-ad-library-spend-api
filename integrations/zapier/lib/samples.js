'use strict';

// Item shape from docs/AUTOMATIONS.md (section 4) in the adspendspy.com repo.
const brand = {
  page_id: '116482854782233',
  name: 'Alex Hormozi',
  image_url: 'https://pub-example.r2.dev/brands/116482854782233.jpg',
  url: 'https://www.adspendspy.com/brand/116482854782233?utm_source=adspendspy_api&utm_medium=integration',
};

const ad = {
  internal_ad_id: 48211,
  meta_ad_id: '1234567890123456',
  ad_archive_id: '1234567890123456',
  headline: 'Free scaling workshop',
  body_text: 'Join the free workshop and learn how we scale offers.',
  cta_text: 'Learn more',
  landing_url: 'https://example.com/workshop',
  media_type: 'video',
  thumbnail_url: 'https://pub-example.r2.dev/ads/48211.jpg',
  video_url: null,
  platforms: ['facebook', 'instagram'],
  start_date: '2026-10-20',
  is_active: true,
  estimated_spend_eur: 1840.5,
  spend_coverage: 'eu_uk',
  url: 'https://www.adspendspy.com/ad/48211?utm_source=adspendspy_api&utm_medium=integration',
};

const newAdSample = {
  id: 'ad.new:48211',
  event: 'ad.new',
  occurred_at: '2026-10-22T07:41:12+00:00',
  currency: 'EUR',
  spend_is_estimate: true,
  brand,
  ad,
  alert: null,
};

const spendAlertSample = {
  id: 'ad.spend_alert:991',
  event: 'ad.spend_alert',
  occurred_at: '2026-10-22T07:41:12+00:00',
  currency: 'EUR',
  spend_is_estimate: true,
  brand,
  ad,
  alert: { alert_id: 991, threshold_eur: 500, spend_at_alert_eur: 812.4 },
};

const itemOutputFields = [
  { key: 'id', label: 'Event ID' },
  { key: 'event', label: 'Event' },
  { key: 'occurred_at', label: 'Occurred At', type: 'datetime' },
  { key: 'currency', label: 'Currency' },
  { key: 'spend_is_estimate', label: 'Spend Is Estimate', type: 'boolean' },
  { key: 'brand__page_id', label: 'Brand Page ID' },
  { key: 'brand__name', label: 'Brand Name' },
  { key: 'brand__image_url', label: 'Brand Image URL' },
  { key: 'brand__url', label: 'Brand Report URL' },
  { key: 'ad__internal_ad_id', label: 'Ad ID (AdSpendSpy)', type: 'integer' },
  { key: 'ad__meta_ad_id', label: 'Ad Library ID' },
  { key: 'ad__ad_archive_id', label: 'Ad Archive ID' },
  { key: 'ad__headline', label: 'Ad Headline' },
  { key: 'ad__body_text', label: 'Ad Text' },
  { key: 'ad__cta_text', label: 'Ad Call to Action' },
  { key: 'ad__landing_url', label: 'Landing Page URL' },
  { key: 'ad__media_type', label: 'Media Type' },
  { key: 'ad__thumbnail_url', label: 'Thumbnail URL' },
  { key: 'ad__video_url', label: 'Video URL' },
  { key: 'ad__platforms', label: 'Platforms', list: true },
  { key: 'ad__start_date', label: 'Ad Start Date' },
  { key: 'ad__is_active', label: 'Ad Is Active', type: 'boolean' },
  { key: 'ad__estimated_spend_eur', label: 'Estimated Spend (EUR)', type: 'number' },
  { key: 'ad__spend_coverage', label: 'Spend Coverage' },
  { key: 'ad__url', label: 'Ad Report URL' },
];

const alertOutputFields = [
  { key: 'alert__alert_id', label: 'Alert ID', type: 'integer' },
  { key: 'alert__threshold_eur', label: 'Alert Threshold (EUR)', type: 'number' },
  { key: 'alert__spend_at_alert_eur', label: 'Estimated Spend at Alert (EUR)', type: 'number' },
];

module.exports = { newAdSample, spendAlertSample, itemOutputFields, alertOutputFields };
