'use strict';

const { hookOperation } = require('../lib/hook-trigger');
const { spendAlertSample, itemOutputFields, alertOutputFields } = require('../lib/samples');

module.exports = {
  key: 'new_spend_alert',
  noun: 'Spend Alert',
  display: {
    label: 'New Spend Alert',
    description: 'Triggers when an ad of a brand you track crosses your AdSpendSpy spend alert threshold.',
  },
  operation: hookOperation({
    event: 'ad.spend_alert',
    listPath: '/api/v1/alerts/list.php',
    sample: spendAlertSample,
    outputFields: [...itemOutputFields, ...alertOutputFields],
  }),
};
