'use strict';

const baseUrl = () => (process.env.ADSPENDSPY_BASE_URL || 'https://www.adspendspy.com').replace(/\/+$/, '');

module.exports = { baseUrl };
