'use strict';

const { baseUrl } = require('../lib/base-url');

const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${baseUrl()}/api/v1/brands/track.php`,
    method: 'POST',
    body: {
      page_id: String(bundle.inputData.page_id).trim(),
      brand_name: String(bundle.inputData.brand_name).trim(),
    },
  });
  return response.data;
};

module.exports = {
  key: 'track_brand',
  noun: 'Brand',
  display: {
    label: 'Track Brand',
    description: 'Starts tracking an advertiser in AdSpendSpy so its Meta ads and estimated ad spend are collected.',
  },
  operation: {
    inputFields: [
      {
        key: 'page_id',
        label: 'Page ID',
        required: true,
        helpText: 'Facebook Page ID of the advertiser (digits only, e.g. `116482854782233`).',
      },
      {
        key: 'brand_name',
        label: 'Brand Name',
        required: true,
        helpText: 'Name shown for this brand in AdSpendSpy.',
      },
    ],
    perform,
    sample: {
      success: true,
      brand_id: 1,
      page_id: '116482854782233',
      message: 'Brand is now tracked.',
    },
    outputFields: [
      { key: 'success', label: 'Success', type: 'boolean' },
      { key: 'brand_id', label: 'Brand ID', type: 'integer' },
      { key: 'page_id', label: 'Page ID' },
      { key: 'already_tracked', label: 'Already Tracked', type: 'boolean' },
      { key: 'message', label: 'Message' },
    ],
  },
};
