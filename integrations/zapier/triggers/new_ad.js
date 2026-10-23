'use strict';

const { hookOperation } = require('../lib/hook-trigger');
const { newAdSample, itemOutputFields } = require('../lib/samples');

module.exports = {
  key: 'new_ad',
  noun: 'Ad',
  display: {
    label: 'New Ad From Tracked Brand',
    description: 'Triggers when a brand you track in AdSpendSpy starts a new ad.',
  },
  operation: hookOperation({
    event: 'ad.new',
    listPath: '/api/v1/ads/new.php',
    sample: newAdSample,
    outputFields: itemOutputFields,
  }),
};
