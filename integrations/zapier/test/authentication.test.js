'use strict';

const nock = require('nock');
const { BASE, appTester, authData, App } = require('./helpers');

describe('authentication', () => {
  afterEach(() => nock.cleanAll());

  it('passes with a valid key and sends the bearer header', async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${authData.api_key}`, accept: 'application/json' } })
      .get('/api/v1/brands/list.php')
      .reply(200, { success: true, data: [], count: 0, total_count: 0 });
    const result = await appTester(App.authentication.test, { authData });
    expect(result.success).toBe(true);
  });

  it('reports an invalid key on 401', async () => {
    nock(BASE).get('/api/v1/brands/list.php').reply(401, { success: false, message: 'Authentication required' });
    await expect(appTester(App.authentication.test, { authData })).rejects.toThrow('Your AdSpendSpy API key is invalid or revoked.');
  });

  it('reports the paid plan requirement on 402', async () => {
    nock(BASE).get('/api/v1/brands/list.php').reply(402, { success: false, reason: 'membership_required' });
    await expect(appTester(App.authentication.test, { authData })).rejects.toThrow('AdSpendSpy automations need a paid plan.');
  });

  it('throttles on 429', async () => {
    nock(BASE).get('/api/v1/brands/list.php').reply(429, { success: false, code: 'rate_limited' });
    await expect(appTester(App.authentication.test, { authData })).rejects.toMatchObject({ name: 'ThrottledError' });
  });

  it('passes the API message through for other errors', async () => {
    nock(BASE).get('/api/v1/brands/list.php').reply(500, { success: false, message: 'Server error' });
    await expect(appTester(App.authentication.test, { authData })).rejects.toThrow('Server error');
  });

  it('builds the connection label from the first 15 characters', () => {
    expect(App.authentication.connectionLabel(null, { authData })).toBe('AdSpendSpy API key asp_live_testke…');
  });
});
