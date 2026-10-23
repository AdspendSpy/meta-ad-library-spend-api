'use strict';

const addAuthHeaders = (request, z, bundle) => {
  request.headers = request.headers || {};
  if (bundle.authData && bundle.authData.api_key) {
    request.headers.Authorization = `Bearer ${bundle.authData.api_key}`;
  }
  request.headers.Accept = 'application/json';
  return request;
};

const readMessage = (response) => {
  try {
    const json = response.data !== undefined ? response.data : JSON.parse(response.content);
    if (json && typeof json.message === 'string' && json.message.trim() !== '') {
      return json.message;
    }
  } catch (error) {
    // Body was not JSON; fall through to the generic message.
  }
  return `AdSpendSpy answered with status ${response.status}.`;
};

const handleErrors = (response, z) => {
  if (response.status === 401) {
    throw new z.errors.Error('Your AdSpendSpy API key is invalid or revoked.', 'AuthenticationError', 401);
  }
  if (response.status === 402) {
    throw new z.errors.Error('AdSpendSpy automations need a paid plan.', 'PaymentRequired', 402);
  }
  if (response.status === 429) {
    const retryAfter = parseInt(response.getHeader('retry-after') || '60', 10);
    throw new z.errors.ThrottledError('AdSpendSpy rate limit reached. Please try again later.', Number.isFinite(retryAfter) ? retryAfter : 60);
  }
  if (response.status >= 400) {
    throw new z.errors.Error(readMessage(response), 'ApiError', response.status);
  }
  return response;
};

module.exports = {
  befores: [addAuthHeaders],
  afters: [handleErrors],
};
