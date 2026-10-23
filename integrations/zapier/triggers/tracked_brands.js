'use strict';

const { baseUrl } = require('../lib/base-url');

const perform = async (z) => {
  const response = await z.request({ url: `${baseUrl()}/api/v1/brands/list.php`, method: 'GET' });
  return (response.data.data || []).map((brand) => ({
    id: brand.id,
    page_id: brand.page_id,
    name: brand.brand_name || brand.page_id,
  }));
};

module.exports = {
  key: 'tracked_brands',
  noun: 'Tracked Brand',
  display: {
    label: 'List Tracked Brands',
    description: 'Lists the brands you track in AdSpendSpy (used for dropdowns).',
    hidden: true,
  },
  operation: {
    perform,
    sample: { id: 1, page_id: '116482854782233', name: 'Alex Hormozi' },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'page_id', label: 'Page ID' },
      { key: 'name', label: 'Brand Name' },
    ],
  },
};
