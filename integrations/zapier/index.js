'use strict';

const { version } = require('./package.json');
const { version: platformVersion } = require('zapier-platform-core');

const authentication = require('./authentication');
const middleware = require('./middleware');
const newAd = require('./triggers/new_ad');
const newSpendAlert = require('./triggers/new_spend_alert');
const trackedBrands = require('./triggers/tracked_brands');
const projects = require('./triggers/projects');
const trackBrand = require('./creates/track_brand');
const findTrackedBrand = require('./searches/find_tracked_brand');

module.exports = {
  version,
  platformVersion,
  authentication,
  beforeRequest: middleware.befores,
  afterResponse: middleware.afters,
  flags: { cleanInputData: false },
  triggers: {
    [newAd.key]: newAd,
    [newSpendAlert.key]: newSpendAlert,
    [trackedBrands.key]: trackedBrands,
    [projects.key]: projects,
  },
  creates: {
    [trackBrand.key]: trackBrand,
  },
  searches: {
    [findTrackedBrand.key]: findTrackedBrand,
  },
};
