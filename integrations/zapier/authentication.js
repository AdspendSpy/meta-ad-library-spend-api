'use strict';

const { baseUrl } = require('./lib/base-url');

const test = async (z) => {
  const response = await z.request({ url: `${baseUrl()}/api/v1/brands/list.php`, method: 'GET' });
  return response.data;
};

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      required: true,
      helpText: 'Create a key in AdSpendSpy under [Settings → API access](https://www.adspendspy.com/settings#api-access). It starts with `asp_live_`. Automations need a paid AdSpendSpy plan.',
    },
  ],
  test,
  connectionLabel: (z, bundle) => `AdSpendSpy API key ${String(bundle.authData.api_key || '').slice(0, 15)}…`,
};
