'use strict';

const nock = require('nock');
const { BASE, appTester, authData, App } = require('./helpers');

describe('track_brand', () => {
  afterEach(() => nock.cleanAll());

  it('posts page_id and brand_name', async () => {
    let body;
    nock(BASE).post('/api/v1/brands/track.php', (b) => { body = b; return true; })
      .reply(201, { success: true, brand_id: 9, page_id: '116482854782233', message: 'Brand is now tracked.' });
    const result = await appTester(App.creates.track_brand.operation.perform, {
      authData,
      inputData: { page_id: ' 116482854782233 ', brand_name: 'Alex Hormozi' },
    });
    expect(body).toEqual({ page_id: '116482854782233', brand_name: 'Alex Hormozi' });
    expect(result.brand_id).toBe(9);
  });

  it('surfaces the API message on errors', async () => {
    nock(BASE).post('/api/v1/brands/track.php').reply(400, { success: false, message: 'Invalid page ID' });
    await expect(appTester(App.creates.track_brand.operation.perform, {
      authData,
      inputData: { page_id: 'x', brand_name: 'y' },
    })).rejects.toThrow('Invalid page ID');
  });
});

describe('find_tracked_brand', () => {
  afterEach(() => nock.cleanAll());

  it('searches with q and returns results', async () => {
    nock(BASE).get('/api/v1/brands/search-tracked.php').query({ q: 'hormozi' })
      .reply(200, { success: true, results: [{ id: 9, page_id: '116482854782233', display_name: 'Alex Hormozi', status: 'tracked' }], count: 1 });
    const result = await appTester(App.searches.find_tracked_brand.operation.perform, { authData, inputData: { q: 'hormozi' } });
    expect(result).toHaveLength(1);
    expect(result[0].page_id).toBe('116482854782233');
  });

  it('returns an empty list when nothing matches', async () => {
    nock(BASE).get('/api/v1/brands/search-tracked.php').query({ q: 'none' })
      .reply(200, { success: true, results: [], count: 0 });
    const result = await appTester(App.searches.find_tracked_brand.operation.perform, { authData, inputData: { q: 'none' } });
    expect(result).toEqual([]);
  });
});
