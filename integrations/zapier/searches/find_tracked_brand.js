'use strict';

const { baseUrl } = require('../lib/base-url');

const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${baseUrl()}/api/v1/brands/search-tracked.php`,
    method: 'GET',
    params: { q: bundle.inputData.q },
  });
  return response.data.results || [];
};

module.exports = {
  key: 'find_tracked_brand',
  noun: 'Brand',
  display: {
    label: 'Find Tracked Brand',
    description: 'Finds a brand you track in AdSpendSpy by name, Page ID or Facebook page URL.',
  },
  operation: {
    inputFields: [
      {
        key: 'q',
        label: 'Search',
        required: true,
        helpText: 'Brand name, Facebook Page ID or Facebook page URL.',
      },
    ],
    perform,
    sample: {
      id: 1,
      page_id: '116482854782233',
      brand_name: 'Alex Hormozi',
      brand_image: 'https://pub-example.r2.dev/brands/116482854782233.jpg',
      ad_count: 42,
      status: 'tracked',
      display_name: 'Alex Hormozi',
      display_image: 'https://pub-example.r2.dev/brands/116482854782233.jpg',
    },
    outputFields: [
      { key: 'id', label: 'Brand ID', type: 'integer' },
      { key: 'page_id', label: 'Page ID' },
      { key: 'display_name', label: 'Brand Name' },
      { key: 'display_image', label: 'Brand Image URL' },
      { key: 'ad_count', label: 'Ad Count', type: 'integer' },
      { key: 'status', label: 'Status' },
    ],
  },
};
