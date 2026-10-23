'use strict';

const zapier = require('zapier-platform-core');
const App = require('../index');

const BASE = 'https://www.adspendspy.com';
const appTester = zapier.createAppTester(App);
const authData = { api_key: 'asp_live_testkey1234567890' };

module.exports = { BASE, appTester, authData, App };
