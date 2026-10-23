'use strict';

const nock = require('nock');
const { BASE, appTester, authData, App } = require('./helpers');

const webhook = {
  id: 'whk_3f9a1c2d',
  event: 'ad.new',
  target_url: 'https://hooks.zapier.com/hooks/standard/123/abc',
  platform: 'zapier',
  filters: { page_id: null, project: null },
  created_at: '2026-10-22T07:41:12+00:00',
};

const cases = [
  { key: 'new_ad', event: 'ad.new', listPath: '/api/v1/ads/new.php' },
  { key: 'new_spend_alert', event: 'ad.spend_alert', listPath: '/api/v1/alerts/list.php' },
];

describe.each(cases)('$key', ({ key, event, listPath }) => {
  const operation = App.triggers[key].operation;
  afterEach(() => nock.cleanAll());

  it('subscribes with the contract body and returns the webhook', async () => {
    let body;
    nock(BASE).post('/api/v1/webhooks/subscribe.php', (b) => { body = b; return true; })
      .reply(201, { success: true, webhook: { ...webhook, event }, secret: 'whsec_5b1e9f0a' });
    const result = await appTester(operation.performSubscribe, { authData, targetUrl: webhook.target_url, inputData: {} });
    expect(body).toEqual({ event, target_url: webhook.target_url, platform: 'zapier' });
    expect(result.id).toBe('whk_3f9a1c2d');
    expect(result.secret).toBeUndefined();
  });

  it('puts the page_id filter into the subscribe body', async () => {
    let body;
    nock(BASE).post('/api/v1/webhooks/subscribe.php', (b) => { body = b; return true; })
      .reply(201, { success: true, webhook });
    await appTester(operation.performSubscribe, { authData, targetUrl: webhook.target_url, inputData: { page_id: '116482854782233' } });
    expect(body.page_id).toBe('116482854782233');
    expect(body.project).toBeUndefined();
  });

  it('puts the project filter into the subscribe body', async () => {
    let body;
    nock(BASE).post('/api/v1/webhooks/subscribe.php', (b) => { body = b; return true; })
      .reply(201, { success: true, webhook });
    await appTester(operation.performSubscribe, { authData, targetUrl: webhook.target_url, inputData: { project: 'prj_abc' } });
    expect(body.project).toBe('prj_abc');
    expect(body.page_id).toBeUndefined();
  });

  it('unsubscribes with the webhook id', async () => {
    let body;
    nock(BASE).post('/api/v1/webhooks/unsubscribe.php', (b) => { body = b; return true; })
      .reply(200, { success: true, webhook: { id: 'whk_3f9a1c2d', disabled_at: '2026-10-22T08:00:00+00:00' } });
    await appTester(operation.performUnsubscribe, { authData, subscribeData: { id: 'whk_3f9a1c2d' } });
    expect(body).toEqual({ id: 'whk_3f9a1c2d' });
  });

  it('passes the delivered item through unchanged', async () => {
    const item = { ...operation.sample };
    const result = await appTester(operation.perform, { authData, cleanedRequest: item });
    expect(result).toEqual([item]);
  });

  it('reads items from the polling endpoint with limit and filter', async () => {
    nock(BASE).get(listPath).query({ limit: '3', page_id: '116482854782233' })
      .reply(200, { success: true, items: [operation.sample], pagination: { next_cursor: null, has_more: false } });
    const result = await appTester(operation.performList, { authData, inputData: { page_id: '116482854782233' } });
    expect(result).toEqual([operation.sample]);
  });

  it('sends the project filter as query on performList', async () => {
    nock(BASE).get(listPath).query({ limit: '3', project: 'prj_abc' })
      .reply(200, { success: true, items: [] });
    const result = await appTester(operation.performList, { authData, inputData: { project: 'prj_abc' } });
    expect(result).toEqual([]);
  });

  it('has a sample matching the contract event', () => {
    expect(operation.sample.event).toBe(event);
    expect(operation.sample.id.startsWith(`${event}:`)).toBe(true);
    expect(operation.sample.currency).toBe('EUR');
    if (event === 'ad.new') expect(operation.sample.alert).toBeNull();
    else expect(operation.sample.alert.alert_id).toBe(991);
  });
});

describe('dropdown triggers', () => {
  afterEach(() => nock.cleanAll());

  it('lists tracked brands as id/page_id/name', async () => {
    nock(BASE).get('/api/v1/brands/list.php')
      .reply(200, { success: true, data: [{ id: 7, page_id: '116482854782233', brand_name: 'Alex Hormozi' }] });
    const result = await appTester(App.triggers.tracked_brands.operation.perform, { authData });
    expect(result).toEqual([{ id: 7, page_id: '116482854782233', name: 'Alex Hormozi' }]);
  });

  it('lists projects as public_id/project_name', async () => {
    nock(BASE).get('/api/v1/projects/get.php')
      .reply(200, { success: true, projects: [{ public_id: 'prj_abc', project_name: 'Competitors', brand_count: 3 }] });
    const result = await appTester(App.triggers.projects.operation.perform, { authData });
    expect(result).toEqual([{ id: 'prj_abc', public_id: 'prj_abc', project_name: 'Competitors' }]);
  });
});
