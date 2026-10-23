'use strict';

const { baseUrl } = require('./base-url');

const FILTER_HELP = 'Optional. Use either a brand or a project, not both.';

const filterFields = [
  {
    key: 'page_id',
    label: 'Tracked Brand',
    dynamic: 'tracked_brands.page_id.name',
    required: false,
    helpText: `Only events of this tracked brand. ${FILTER_HELP}`,
  },
  {
    key: 'project',
    label: 'Project',
    dynamic: 'projects.public_id.project_name',
    required: false,
    helpText: `Only events of brands in this project. ${FILTER_HELP}`,
  },
];

const filtersFrom = (bundle) => {
  const filters = {};
  const input = bundle.inputData || {};
  if (input.page_id) filters.page_id = String(input.page_id);
  if (input.project) filters.project = String(input.project);
  return filters;
};

// Builds a REST-hook trigger; contract: docs/AUTOMATIONS.md sections 4–6.
const hookOperation = ({ event, listPath, sample, outputFields }) => ({
  type: 'hook',
  inputFields: filterFields,

  performSubscribe: async (z, bundle) => {
    const response = await z.request({
      url: `${baseUrl()}/api/v1/webhooks/subscribe.php`,
      method: 'POST',
      body: { event, target_url: bundle.targetUrl, platform: 'zapier', ...filtersFrom(bundle) },
    });
    return response.data.webhook;
  },

  performUnsubscribe: async (z, bundle) => {
    const response = await z.request({
      url: `${baseUrl()}/api/v1/webhooks/unsubscribe.php`,
      method: 'POST',
      body: { id: bundle.subscribeData.id },
    });
    return response.data;
  },

  perform: async (z, bundle) => [bundle.cleanedRequest],

  performList: async (z, bundle) => {
    const response = await z.request({
      url: `${baseUrl()}${listPath}`,
      method: 'GET',
      params: { limit: 3, ...filtersFrom(bundle) },
    });
    return response.data.items || [];
  },

  sample,
  outputFields,
});

module.exports = { hookOperation, filtersFrom };
