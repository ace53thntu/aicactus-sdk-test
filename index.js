// require('core-js/stable');
// import 'regenerator-runtime/runtime';
import Analytics from './libs/analytics.js-core/build/analytics';
import SegmentIntegration from './libs/analytics.js-integration-segmentio/lib/index';

// instantiate the library
const analytics = new Analytics();

analytics.use(SegmentIntegration);

const {
  identify,
  initialize,
  callMethodsFromContainer,
  track,
  page,
  group,
  alias,
  trackClick,
  trackSubmit,
  getSearchData,
  getFeatureById,
  requestAds,
} = analytics;

export default {
  identify,
  initialize,
  callMethodsFromContainer,
  track,
  page,
  group,
  alias,
  trackClick,
  trackSubmit,
  getSearchData,
  getFeatureById,
  requestAds,
};
