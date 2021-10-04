const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

export const SOURCES = ['web', 'smarttv'];

export const SDK_TYPES = ['dmp', 'reco', 'adnetwork'];

export const OWNER_PREFIX = 'aicactus';

const PREFIX = {
  development: 'http://localhost:3004',
  staging: 'https://staging-tag-cdn.aicactus.io',
  // production: 'https://tag-cdn.aicactus.io',
  production: 'https://tag-cdn.aicactus.io',
};

export const API_URL = {
  development: {
    tagsPages: `${PREFIX.development}/tags-pages`,
  },
  staging: {
    tagsPages: `${PREFIX.staging}/containers/tags-pages/v1`,
  },
  production: {
    tagsPages: `${PREFIX.production}/containers/tags-pages/v1`,
  },
};

export const TAG_URL = isDev
  ? 'staging-tags.aicactus.io/v1'
  : isProd
  ? 'tags.aicactus.io/v1'
  : 'staging-tags.aicactus.io/v1';

/**
 * Get API endpoint of container pages
 * @param containerId - container ID
 */
export const getTagsPagesURL = (containerId) => {
  return isDev
    ? `${API_URL.staging.tagsPages}/${containerId}`
    : `${API_URL[process.env.NODE_ENV].tagsPages}/${containerId}`;
};

export const getViettelEndpoint = (containerId) =>
  `https://vt2-tags.aicactus.io/v1`;

export const EVENT_TYPES_VALUE = {
  alias: 'alias',
  group: 'group',
  identify: 'identify',
  page: 'page',
  track: 'track',
  trackLink: 'trackLink',
  trackForm: 'trackForm',
  trackClick: 'trackClick',
  trackSubmit: 'trackSubmit',
};

export const TYPES_VAL = {
  javascript: 'javascript',
  element: 'element',
  xpath: 'xpath',
};

export const getApiEndpointForRecoSDKConfig = (containerId) => {
  // return `https://${
  //   isDev ? 'staging-' : ''
  // }reco.aicactus.io/v1/container/${containerId}/features`;
  return `https://staging-reco.aicactus.io/v1/container/${containerId}/features`;
};

export const getApiEndpointForInitAdNetwork = (containerId) => {
  return `https://staging-adnetwork-core.aicactus.io/container/${containerId}`;
};

export const FEATURE_TYPES = {
  next: 'next',
  canvas: 'canvas',
  top: 'top',
  search: 'keywords',
  extension: 'extension',
};
