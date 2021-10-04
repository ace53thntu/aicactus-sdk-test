'use strict';

import { bidToCore } from './adnetwork/core';
import { addDomEventHandlers } from './autotrack';
import {
  EVENT_TYPES_VALUE,
  FEATURE_TYPES,
  SDK_TYPES,
  SOURCES,
  TYPES_VAL,
  getApiEndpointForInitAdNetwork,
  getApiEndpointForRecoSDKConfig,
  getTagsPagesURL,
} from './constants';
import {
  InitOptions,
  IntegrationsSettings,
  SegmentAnalytics,
  SegmentIntegration,
  SegmentOpts,
} from './types';
import { delay } from './utils/delay';
import { isJsonString } from './utils/misc';
import { tryNTimes } from './utils/retry';
import { getTimezone } from './utils/timezone';
import * as urlUtils from './utils/url';

var __get = require('lodash.get');

var _analytics = global.analytics;

/*
 * Module dependencies.
 */

var Alias = require('segmentio-facade').Alias;
var Emitter = require('component-emitter');
var Facade = require('segmentio-facade');
var Group = require('segmentio-facade').Group;
var Identify = require('segmentio-facade').Identify;
var SourceMiddlewareChain = require('./middleware').SourceMiddlewareChain;
var IntegrationMiddlewareChain = require('./middleware')
  .IntegrationMiddlewareChain;
var DestinationMiddlewareChain = require('./middleware')
  .DestinationMiddlewareChain;
var Page = require('segmentio-facade').Page;
var Track = require('segmentio-facade').Track;
var bindAll = require('bind-all');
var clone = require('./utils/clone');
var extend = require('extend');
var cookie = require('./cookie');
var metrics = require('./metrics');
var debug = require('debug');
var defaults = require('@ndhoule/defaults');
var each = require('./utils/each');
var group = require('./group');
var is = require('is');
var isMeta = require('@segment/is-meta');
var keys = require('@ndhoule/keys');
var memory = require('./memory');
var nextTick = require('next-tick');
var normalize = require('./normalize');
var on = require('component-event').bind;
var pageDefaults = require('./pageDefaults');
var pick = require('@ndhoule/pick');
var prevent = require('@segment/prevent-default');
var url = require('component-url');
var store = require('./store');
var user = require('./user');
var type = require('component-type');

/**
 * Initialize a new `Analytics` instance.
 */

function Analytics() {
  this._options({});
  this.Integrations = {};
  this._sourceMiddlewares = new SourceMiddlewareChain();
  this._integrationMiddlewares = new IntegrationMiddlewareChain();
  this._destinationMiddlewares = {};
  this._integrations = {};
  this._readied = false;
  this._timeout = 300;
  // XXX: BACKWARDS COMPATIBILITY
  this._user = user;
  this.log = debug('analytics.js');
  bindAll(this);

  var self = this;
  this.on('initialize', function (settings, options) {
    if (options.initialPageview) self.page();
    self._parseQuery(window.location.search);
  });
}

/**
 * Mix in event emitter.
 */

Emitter(Analytics.prototype);

/**
 * Use a `plugin`.
 */

Analytics.prototype.use = function (
  plugin: (analytics: SegmentAnalytics) => void
): SegmentAnalytics {
  plugin(this);
  return this;
};

/**
 * Define a new `Integration`.
 */

Analytics.prototype.addIntegration = function (
  Integration: (options: SegmentOpts) => void
): SegmentAnalytics {
  var name = Integration.prototype.name;
  if (!name) throw new TypeError('attempted to add an invalid integration');
  this.Integrations[name] = Integration;
  return this;
};

/**
 * Define a new `SourceMiddleware`
 */

Analytics.prototype.addSourceMiddleware = function (
  middleware: Function
): SegmentAnalytics {
  this._sourceMiddlewares.add(middleware);
  return this;
};

/**
 * Define a new `IntegrationMiddleware`
 * @deprecated
 */

Analytics.prototype.addIntegrationMiddleware = function (
  middleware: Function
): SegmentAnalytics {
  this._integrationMiddlewares.add(middleware);
  return this;
};

/**
 * Define a new `DestinationMiddleware`
 * Destination Middleware is chained after integration middleware
 */

Analytics.prototype.addDestinationMiddleware = function (
  integrationName: string,
  middlewares: Array<unknown>
): SegmentAnalytics {
  var self = this;
  middlewares.forEach(function (middleware) {
    if (!self._destinationMiddlewares[integrationName]) {
      self._destinationMiddlewares[
        integrationName
      ] = new DestinationMiddlewareChain();
    }

    self._destinationMiddlewares[integrationName].add(middleware);
  });
  return self;
};

/**
 * Initialize with the given integration `settings` and `options`.
 *
 * Aliased to `init` for convenience.
 */

Analytics.prototype.init = Analytics.prototype.initialize = function (
  settings?: IntegrationsSettings,
  options?: InitOptions
): void {
  this._containerId = settings.containerId.split('@')[0];
  this._destinationSource = settings.containerId.split('@')[1] || 'web';
  if (
    settings?.type &&
    SDK_TYPES.some((sdkType) => sdkType === settings.type)
  ) {
    this._typeSDK = settings.type;
  } else {
    this._typeSDK = SDK_TYPES[0];
  }

  if (SOURCES.indexOf(this._destinationSource) < 0) {
    this._destinationSource = 'web';
  }

  settings = {
    'Segment.io': {
      apiKey: this._containerId,
      unbundledIntegrations: [],
      retryQueue: true,
      addBundledMetadata: false,
      destinationSource: this._destinationSource,
      sdkType: this._typeSDK,
    },
  };

  options = options || {};

  this._options(options);
  this._readied = false;

  // clean unknown integrations from settings
  var self = this;
  each(function (_opts: unknown, name: string | number) {
    var Integration = self.Integrations[name];
    if (!Integration) delete settings[name];
  }, settings);

  // add integrations
  each(function (opts: unknown, name: string | number) {
    // Don't load disabled integrations
    if (options.integrations) {
      if (
        options.integrations[name] === false ||
        (options.integrations.All === false && !options.integrations[name])
      ) {
        return;
      }
    }

    var Integration = self.Integrations[name];
    var clonedOpts = {};
    extend(true, clonedOpts, opts); // deep clone opts
    var integration = new Integration(clonedOpts);
    self.log('initialize %o - %o', name, opts);
    self.add(integration);
  }, settings);

  var integrations = this._integrations;

  // load user now that options are set
  user.load();
  group.load();

  // make ready callback
  var readyCallCount = 0;
  var integrationCount = keys(integrations).length;
  var ready = function () {
    readyCallCount++;
    if (readyCallCount >= integrationCount) {
      self._readied = true;
      self.emit('ready');
    }
  };

  // init if no integrations
  if (integrationCount <= 0) {
    ready();
  }

  // initialize integrations, passing ready
  // create a list of any integrations that did not initialize - this will be passed with all events for replay support:
  this.failedInitializations = [];
  var initialPageSkipped = false;
  each(function (integration) {
    if (
      options.initialPageview &&
      integration.options.initialPageview === false
    ) {
      // We've assumed one initial pageview, so make sure we don't count the first page call.
      var page = integration.page;
      integration.page = function () {
        if (initialPageSkipped) {
          return page.apply(this, arguments);
        }
        initialPageSkipped = true;
        return;
      };
    }

    integration.analytics = self;

    integration.once('ready', ready);
    try {
      metrics.increment('analytics_js.integration.invoke', {
        method: 'initialize',
        integration_name: integration.name,
      });
      integration.initialize();
    } catch (e) {
      var integrationName = integration.name;
      metrics.increment('analytics_js.integration.invoke.error', {
        method: 'initialize',
        integration_name: integration.name,
      });
      self.failedInitializations.push(integrationName);
      self.log('Error initializing %s integration: %o', integrationName, e);
      // Mark integration as ready to prevent blocking of anyone listening to analytics.ready()

      integration.ready();
    }
  }, integrations);

  // backwards compat with angular plugin and used for init logic checks
  this.initialized = true;

  this.emit('initialize', settings, options);
  // return this;
};

/**
 * Set the user's `id`.
 */

Analytics.prototype.setAnonymousId = function (id: string): SegmentAnalytics {
  this.user().anonymousId(id);
  return this;
};

/**
 * Add an integration.
 */

Analytics.prototype.add = function (integration: {
  name: string | number;
}): SegmentAnalytics {
  this._integrations[integration.name] = integration;
  return this;
};

/**
 * Identify a user by optional `id` and `traits`.
 *
 * @param {string} [id=user.id()] User ID.
 * @param {Object} [traits=null] User traits.
 * @param {Object} [options=null]
 * @param {Function} [fn]
 * @return {Analytics}
 */

Analytics.prototype.identify = function (
  id?: string,
  traits?: unknown,
  options?: SegmentOpts,
  fn?: Function | SegmentOpts
): void {
  // Argument reshuffling.
  /* eslint-disable no-unused-expressions, no-sequences */
  if (is.fn(options)) (fn = options), (options = null);
  if (is.fn(traits)) (fn = traits), (options = null), (traits = null);
  if (is.object(id)) (options = traits), (traits = id), (id = user.id());
  /* eslint-enable no-unused-expressions, no-sequences */

  // clone traits before we manipulate so we don't do anything uncouth, and take
  // from `user` so that we carryover anonymous traits
  user.identify(id, traits);

  var msg = this.normalize({
    options: options,
    traits: user.traits(),
    userId: user.id(),
  });

  // Add the initialize integrations so the server-side ones can be disabled too
  if (this.options.integrations) {
    defaults(msg.integrations, this.options.integrations);
  }

  this._invoke('identify', new Identify(msg));

  // emit
  this.emit('identify', id, traits, options);
  this._callback(fn);

  // return this;
};

/**
 * Return the current user.
 *
 * @return {Object}
 */

Analytics.prototype.user = function (): object {
  return user;
};

/**
 * Identify a group by optional `id` and `traits`. Or, if no arguments are
 * supplied, return the current group.
 *
 * @param {string} [id=group.id()] Group ID.
 * @param {Object} [traits=null] Group traits.
 * @param {Object} [options=null]
 * @param {Function} [fn]
 * @return {Analytics|Object}
 */

Analytics.prototype.group = function (
  id: string,
  traits?: unknown,
  options?: unknown,
  fn?: unknown
): SegmentAnalytics {
  /* eslint-disable no-unused-expressions, no-sequences */
  if (!arguments.length) return group;
  if (is.fn(options)) (fn = options), (options = null);
  if (is.fn(traits)) (fn = traits), (options = null), (traits = null);
  if (is.object(id)) (options = traits), (traits = id), (id = group.id());
  /* eslint-enable no-unused-expressions, no-sequences */

  // grab from group again to make sure we're taking from the source
  group.identify(id, traits);

  var msg = this.normalize({
    options: options,
    traits: group.traits(),
    groupId: group.id(),
  });

  // Add the initialize integrations so the server-side ones can be disabled too
  if (this.options.integrations) {
    defaults(msg.integrations, this.options.integrations);
  }

  this._invoke('group', new Group(msg));

  this.emit('group', id, traits, options);
  this._callback(fn);
  return this;
};

/**
 * Track an `event` that a user has triggered with optional `properties`.
 *
 * @param {string} event
 * @param {Object} [properties=null]
 * @param {Object} [options=null]
 * @param {Function} [fn]
 * @return {Analytics}
 */

Analytics.prototype.track = function (
  event: string,
  properties?: unknown,
  options?: unknown,
  fn?: unknown
): void {
  // Argument reshuffling.
  /* eslint-disable no-unused-expressions, no-sequences */
  if (is.fn(options)) (fn = options), (options = null);
  if (is.fn(properties))
    (fn = properties), (options = null), (properties = null);
  /* eslint-enable no-unused-expressions, no-sequences */

  // figure out if the event is archived.
  var plan = this.options.plan || {};
  var events = plan.track || {};
  var planIntegrationOptions = {};

  // normalize
  var msg = this.normalize({
    properties: properties,
    options: options,
    event: event,
  });

  // plan.
  plan = events[event];
  if (plan) {
    this.log('plan %o - %o', event, plan);
    if (plan.enabled === false) {
      // Disabled events should always be sent to Segment.
      planIntegrationOptions = { All: false, 'Segment.io': true };
    } else {
      planIntegrationOptions = plan.integrations || {};
    }
  } else {
    var defaultPlan = events.__default || { enabled: true };
    if (!defaultPlan.enabled) {
      // Disabled events should always be sent to Segment.
      planIntegrationOptions = { All: false, 'Segment.io': true };
    }
  }

  // msg.context.ip = ip;
  // Add the initialize integrations so the server-side ones can be disabled too
  defaults(
    msg.integrations,
    this._mergeInitializeAndPlanIntegrations(planIntegrationOptions)
  );

  this._invoke('track', new Track(msg));

  this.emit('track', event, properties, options);
  this._callback(fn);

  // return this;
};

/**
 * Helper method to track an outbound link that would normally navigate away
 * from the page before the analytics calls were sent.
 *
 * BACKWARDS COMPATIBILITY: aliased to `trackClick`.
 *
 * @param {Element|Array} links
 * @param {string|Function} event
 * @param {Object|Function} properties (optional)
 * @return {Analytics}
 */

Analytics.prototype.trackClick = Analytics.prototype.trackLink = function (
  links: Element | Array<unknown>,
  event: any,
  properties?: any
): SegmentAnalytics {
  if (!links) return this;
  // always arrays, handles jquery
  if (type(links) === 'element') links = [links];

  var self = this;
  each(function (el) {
    console.log('el', el);
    if (type(el) !== 'element') {
      throw new TypeError('Must pass HTMLElement to `analytics.trackLink`.');
    }
    on(el, 'click', function (e) {
      var ev = is.fn(event) ? event(el) : event;
      var props = is.fn(properties) ? properties(el) : properties;
      var href =
        el.getAttribute('href') ||
        el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
        el.getAttribute('xlink:href');

      self.track(ev, props);

      if (href && el.target !== '_blank' && !isMeta(e)) {
        prevent(e);
        self._callback(function () {
          window.location.href = href;
        });
      }
    });
  }, links);

  return this;
};

/**
 * Helper method to track an outbound form that would normally navigate away
 * from the page before the analytics calls were sent.
 *
 * BACKWARDS COMPATIBILITY: aliased to `trackSubmit`.
 *
 * @param {Element|Array} forms
 * @param {string|Function} event
 * @param {Object|Function} properties (optional)
 * @return {Analytics}
 */

Analytics.prototype.trackSubmit = Analytics.prototype.trackForm = function (
  forms: Element | Array<unknown>,
  event: any,
  properties?: any
): SegmentAnalytics {
  if (!forms) return this;
  // always arrays, handles jquery
  if (type(forms) === 'element') forms = [forms];

  var self = this;
  each(function (el: { submit: () => void }) {
    if (type(el) !== 'element')
      throw new TypeError('Must pass HTMLElement to `analytics.trackForm`.');
    function handler(e) {
      prevent(e);

      var ev = is.fn(event) ? event(el) : event;
      var props = is.fn(properties) ? properties(el) : properties;
      self.track(ev, props);

      self._callback(function () {
        el.submit();
      });
    }

    // Support the events happening through jQuery or Zepto instead of through
    // the normal DOM API, because `el.submit` doesn't bubble up events...
    var $ = window.jQuery || window.Zepto;
    if ($) {
      $(el).submit(handler);
    } else {
      on(el, 'submit', handler);
    }
  }, forms);

  return this;
};

/**
 * Trigger a pageview, labeling the current page with an optional `category`,
 * `name` and `properties`.
 *
 * @param {string} [category]
 * @param {string} [name]
 * @param {Object|string} [properties] (or path)
 * @param {Object} [options]
 * @param {Function} [fn]
 * @return {Analytics}
 */

Analytics.prototype.page = function (
  category?: string,
  name?: string,
  properties?: any,
  options?: any,
  fn?: unknown
): void {
  // Argument reshuffling.
  /* eslint-disable no-unused-expressions, no-sequences */
  if (is.fn(options)) (fn = options), (options = null);
  if (is.fn(properties)) (fn = properties), (options = properties = null);
  if (is.fn(name)) (fn = name), (options = properties = name = null);

  if (type(category) === 'object')
    (options = name), (properties = category), (name = category = null);
  if (type(name) === 'object')
    (options = properties), (properties = name), (name = null);
  if (type(category) === 'string' && type(name) !== 'string')
    (name = category), (category = null);
  /* eslint-enable no-unused-expressions, no-sequences */

  properties = clone(properties) || {};

  if (category) properties.category = category;

  // Ensure properties has baseline spec properties.
  // TODO: Eventually move these entirely to `options.context.page`
  var defs = pageDefaults();
  defaults(properties, defs);

  // Mirror user overrides to `options.context.page` (but exclude custom properties)
  // (Any page defaults get applied in `this.normalize` for consistency.)
  // Weird, yeah--moving special props to `context.page` will fix this in the long term.
  var overrides = pick(keys(defs), properties);
  if (!is.empty(overrides)) {
    options = options || {};
    options.context = options.context || {};
    options.context.page = overrides;
  }

  var msg = this.normalize({
    properties: properties,
    category: category,
    options: options,
    name: name || defs.title,
  });

  // Add the initialize integrations so the server-side ones can be disabled too
  if (this.options.integrations) {
    defaults(msg.integrations, this.options.integrations);
  }

  this._invoke('page', new Page(msg));

  this.emit('page', category, name, properties, options);
  this._callback(fn);
  // return this;
};

/**
 * FIXME: BACKWARDS COMPATIBILITY: convert an old `pageview` to a `page` call.
 * @api private
 */

Analytics.prototype.pageview = function (url: string): SegmentAnalytics {
  const properties: { path?: string } = {};
  if (url) properties.path = url;
  this.page(properties);
  return this;
};

/**
 * Merge two previously unassociated user identities.
 *
 * @param {string} to
 * @param {string} from (optional)
 * @param {Object} options (optional)
 * @param {Function} fn (optional)
 * @return {Analytics}
 */

Analytics.prototype.alias = function (
  to: string,
  from?: string,
  options?: unknown,
  fn?: unknown
): SegmentAnalytics {
  // Argument reshuffling.
  /* eslint-disable no-unused-expressions, no-sequences */
  if (is.fn(options)) (fn = options), (options = null);
  if (is.fn(from)) (fn = from), (options = null), (from = null);
  if (is.object(from)) (options = from), (from = null);
  /* eslint-enable no-unused-expressions, no-sequences */

  var msg = this.normalize({
    options: options,
    previousId: from,
    userId: to,
  });

  // Add the initialize integrations so the server-side ones can be disabled too
  if (this.options.integrations) {
    defaults(msg.integrations, this.options.integrations);
  }

  this._invoke('alias', new Alias(msg));

  this.emit('alias', to, from, options);
  this._callback(fn);
  return this;
};

/**
 * Register a `fn` to be fired when all the analytics services are ready.
 */

Analytics.prototype.ready = function (fn: Function): SegmentAnalytics {
  if (is.fn(fn)) {
    if (this._readied) {
      nextTick(fn);
    } else {
      this.once('ready', fn);
    }
  }
  return this;
};

/**
 * Set the `timeout` (in milliseconds) used for callbacks.
 */

Analytics.prototype.timeout = function (timeout: number) {
  this._timeout = timeout;
};

/**
 * Enable or disable debug.
 */

Analytics.prototype.debug = function (str: string | boolean) {
  if (!arguments.length || str) {
    debug.enable('analytics:' + (str || '*'));
  } else {
    debug.disable();
  }
};

/**
 * Apply options.
 * @api private
 */

Analytics.prototype._options = function (
  options: InitOptions
): SegmentAnalytics {
  options = options || {};
  this.options = options;
  cookie.options(options.cookie);
  metrics.options(options.metrics);
  store.options(options.localStorage);
  user.options(options.user);
  group.options(options.group);
  return this;
};

/**
 * Callback a `fn` after our defined timeout period.
 * @api private
 */

Analytics.prototype._callback = function (fn: Function): SegmentAnalytics {
  if (is.fn(fn)) {
    this._timeout ? setTimeout(fn, this._timeout) : nextTick(fn);
  }
  return this;
};

/**
 * Call `method` with `facade` on all enabled integrations.
 *
 * @param {string} method
 * @param {Facade} facade
 * @return {Analytics}
 * @api private
 */

Analytics.prototype._invoke = function (
  method: string,
  facade: unknown
): SegmentAnalytics {
  var self = this;

  try {
    this._sourceMiddlewares.applyMiddlewares(
      extend(true, new Facade({}), facade),
      this._integrations,
      function (result) {
        // A nullified payload should not be sent.
        if (result === null) {
          self.log(
            'Payload with method "%s" was null and dropped by source a middleware.',
            method
          );
          return;
        }

        // Check if the payload is still a Facade. If not, convert it to one.
        if (!(result instanceof Facade)) {
          result = new Facade(result);
        }

        self.emit('invoke', result);
        metrics.increment('analytics_js.invoke', {
          method: method,
        });

        applyIntegrationMiddlewares(result);
      }
    );
  } catch (e) {
    metrics.increment('analytics_js.invoke.error', {
      method: method,
    });
    self.log(
      'Error invoking .%s method of %s integration: %o',
      method,
      name,
      e
    );
  }

  return this;

  function applyIntegrationMiddlewares(facade) {
    var failedInitializations = self.failedInitializations || [];
    each(function (integration, name) {
      var facadeCopy = extend(true, new Facade({}), facade);

      if (!facadeCopy.enabled(name)) return;
      // Check if an integration failed to initialize.
      // If so, do not process the message as the integration is in an unstable state.
      if (failedInitializations.indexOf(name) >= 0) {
        self.log(
          'Skipping invocation of .%s method of %s integration. Integration failed to initialize properly.',
          method,
          name
        );
      } else {
        try {
          // Apply any integration middlewares that exist, then invoke the integration with the result.
          self._integrationMiddlewares.applyMiddlewares(
            facadeCopy,
            integration.name,
            function (result) {
              // A nullified payload should not be sent to an integration.
              if (result === null) {
                self.log(
                  'Payload to integration "%s" was null and dropped by a middleware.',
                  name
                );
                return;
              }

              // Check if the payload is still a Facade. If not, convert it to one.
              if (!(result instanceof Facade)) {
                result = new Facade(result);
              }

              // apply destination middlewares
              // Apply any integration middlewares that exist, then invoke the integration with the result.
              if (self._destinationMiddlewares[integration.name]) {
                self._destinationMiddlewares[integration.name].applyMiddlewares(
                  facadeCopy,
                  integration.name,
                  function (result) {
                    // A nullified payload should not be sent to an integration.
                    if (result === null) {
                      self.log(
                        'Payload to destination "%s" was null and dropped by a middleware.',
                        name
                      );
                      return;
                    }

                    // Check if the payload is still a Facade. If not, convert it to one.
                    if (!(result instanceof Facade)) {
                      result = new Facade(result);
                    }

                    metrics.increment('analytics_js.integration.invoke', {
                      method: method,
                      integration_name: integration.name,
                    });

                    integration.invoke.call(integration, method, result);
                  }
                );
              } else {
                metrics.increment('analytics_js.integration.invoke', {
                  method: method,
                  integration_name: integration.name,
                });

                integration.invoke.call(integration, method, result);
              }
            }
          );
        } catch (e) {
          metrics.increment('analytics_js.integration.invoke.error', {
            method: method,
            integration_name: integration.name,
          });
          self.log(
            'Error invoking .%s method of %s integration: %o',
            method,
            name,
            e
          );
        }
      }
    }, self._integrations);
  }
};

/**
 * Push `args`.
 *
 * @param {Array} args
 * @api private
 */

Analytics.prototype.push = function (args: any[]) {
  var method = args.shift();
  if (!this[method]) return;
  this[method].apply(this, args);
};

/**
 * Reset group and user traits and id's.
 *
 * @api public
 */

Analytics.prototype.reset = function () {
  this.user().logout();
  this.group().logout();
};

/**
 * Parse the query string for callable methods.
 *
 * @api private
 */

Analytics.prototype._parseQuery = function (query: string): SegmentAnalytics {
  // Parse querystring to an object
  const parsed = url.parse(query);
  const q = parsed.query.split('&').reduce((acc, str) => {
    const [k, v] = str.split('=');
    acc[k] = decodeURI(v).replace('+', ' ');
    return acc;
  }, {});

  // Create traits and properties objects, populate from querysting params
  var traits = pickPrefix('aicactus_ajs_trait_', q);
  var props = pickPrefix('aicactus_ajs_prop_', q);
  // Trigger based on callable parameters in the URL
  if (q.aicactus_ajs_uid) this.identify(q.aicactus_ajs_uid, traits);
  if (q.aicactus_ajs_event) this.track(q.aicactus_ajs_event, props);
  if (q.aicactus_ajs_aid) user.anonymousId(q.aicactus_ajs_aid);
  return this;

  /**
   * Create a shallow copy of an input object containing only the properties
   * whose keys are specified by a prefix, stripped of that prefix
   *
   * @return {Object}
   * @api private
   */

  function pickPrefix(prefix: string, object: object) {
    var length = prefix.length;
    var sub;
    return Object.keys(object).reduce(function (acc, key) {
      if (key.substr(0, length) === prefix) {
        sub = key.substr(length);
        acc[sub] = object[key];
      }
      return acc;
    }, {});
  }
};

/**
 * Normalize the given `msg`.
 */

Analytics.prototype.normalize = function (msg: {
  context: { page };
  anonymousId: string;
}): object {
  msg = normalize(msg, keys(this._integrations));
  if (msg.anonymousId) user.anonymousId(msg.anonymousId);
  msg.anonymousId = user.anonymousId();

  // Ensure all outgoing requests include page data in their contexts.
  msg.context.page = defaults(msg.context.page || {}, pageDefaults());

  return msg;
};

/**
 * Merges the tracking plan and initialization integration options.
 *
 * @param  {Object} planIntegrations Tracking plan integrations.
 * @return {Object}                  The merged integrations.
 */
Analytics.prototype._mergeInitializeAndPlanIntegrations = function (
  planIntegrations: SegmentIntegration
): object {
  // Do nothing if there are no initialization integrations
  if (!this.options.integrations) {
    return planIntegrations;
  }

  // Clone the initialization integrations
  var integrations = extend({}, this.options.integrations);
  var integrationName: string;

  // Allow the tracking plan to disable integrations that were explicitly
  // enabled on initialization
  if (planIntegrations.All === false) {
    integrations = { All: false };
  }

  for (integrationName in planIntegrations) {
    if (planIntegrations.hasOwnProperty(integrationName)) {
      // Don't allow the tracking plan to re-enable disabled integrations
      if (this.options.integrations[integrationName] !== false) {
        integrations[integrationName] = planIntegrations[integrationName];
      }
    }
  }

  return integrations;
};

/**
 * No conflict support.
 */

Analytics.prototype.noConflict = function (): SegmentAnalytics {
  window.analytics = _analytics;
  return this;
};

/**
 * Begin of Aicactus custom
 * TODO: ===== AICACTUS
 */

Analytics.prototype.request = function (
  url: string,
  method: string = 'get',
  headers: any = {},
  obj: any = {}
) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.timeout = 2000;
    xhr.onreadystatechange = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(xhr.status);
        }
      }
    };
    xhr.ontimeout = function () {
      reject('timeout');
    };

    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    for (let k in headers) {
      xhr.setRequestHeader(k, headers[k]);
    }
    xhr.send(JSON.stringify(obj));
  });
};

Analytics.prototype.setContainerId = function (containerId) {
  this._containerId = containerId;
  return this;
};

Analytics.prototype.containerExistsInStore = function () {
  if (!store.get('aicactus')) {
    return false;
  }
  return true;
};

Analytics.prototype.loadContainerFromStore = function () {
  return store.get('aicactus');
};

Analytics.prototype.saveContainerToStore = function (container) {
  if (container.pages.length) {
    store.set('aicactus', container);
  }
};
Analytics.prototype.executeFunctionByName = function (functionName, context) {
  var args = Array.prototype.slice.call(arguments, 2);
  var namespaces = functionName.split('.');
  var func = namespaces.pop();

  for (var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(context, args);
};

Analytics.prototype.executeBaseMethod = function (base) {
  var self = this;

  switch (base.type) {
    case EVENT_TYPES_VALUE.identify:
      if (!user.id()) {
        self.executeFunctionByName(
          base.type,
          this,
          base.params.traits,
          base.params.options,
          base.params.callback
        );
      } else {
        self.executeFunctionByName(
          base.type,
          this,
          user.id(),
          base.params.traits,
          base.params.options,
          base.params.callback
        );
      }
      break;

    // case EVENT_TYPES_VALUE.page:
    //   self.executeFunctionByName(
    //     base.type,
    //     this,
    //     base.params.category,
    //     base.params.name,
    //     {},
    //     base.params.options,
    //     base.params.callback
    //   );
    //   break;
  }
};

Analytics.prototype.collectPageData = function (base) {
  var self = this;

  // the list of params will have custom fields
  // var keys = ['properties', 'traits', 'forms', 'links'];
  const keys = ['properties', 'traits', 'forms'];

  each(function (paramKey) {
    if (base.params[paramKey]) {
      if (is.object(base.params[paramKey])) {
        each(function (key, val) {
          var jsValPtr = 'javascript:';
          var xpValPtr = 'xpath:';
          var elemValPtr = 'element:';
          var isJS = typeof val === 'string' && val.indexOf(jsValPtr) === 0;
          var isXPath = typeof val === 'string' && val.indexOf(xpValPtr) === 0;
          console.log('isXPath', isXPath);
          var isElem = typeof val === 'string' && val.indexOf(elemValPtr) === 0;

          if (isJS) {
            var value = self.collectJSVariables(val.substring(jsValPtr.length));
            if (value) {
              base.params[paramKey][key] = value;
            }
          }
          if (isXPath) {
            var text = self.collectHTMLElement(val.substring(xpValPtr.length));
            base.params[paramKey][key] = text;
          }
          if (isElem) {
            var elem = self.collectHTMLElement(
              val.substring(elemValPtr.length),
              true
            );
            base.params[paramKey][key] = elem;
          }
        }, base.params[paramKey]);
      }
      if (is.string(base.params[paramKey])) {
        var elemValPtr = 'element:';
        var val = base.params[paramKey];
        var isElem = typeof val === 'string' && val.indexOf(elemValPtr) === 0;
        if (isElem) {
          var elem = self.collectHTMLElement(
            val.substring(elemValPtr.length),
            true
          );
          console.log('Analytics.prototype.collectPageData -> elem', elem);
          if (!is.element(elem)) {
            return;
          }
          base.params[paramKey] = elem;
        }
      }
    }
  }, keys);
};

Analytics.prototype.collectJSVariables = function (varStr) {
  var varArr = varStr.split('.');
  var json = window[varArr[0]] || {};
  // if has more than one variable
  if (varArr.length > 1) {
    var endVal = null;
    for (var i = 1; i < varArr.length; i++) {
      if (i === 1) {
        if (json[varArr[i]]) {
          endVal = json[varArr[i]];
        }
      } else {
        if (endVal[varArr[i]]) {
          endVal = endVal[varArr[i]];
        }
      }
    }
    return endVal;
  }
  // vice versa
  return json;
};

Analytics.prototype.collectHTMLElement = function (varStr, isElem) {
  function getElementByXpath(path) {
    return document.evaluate(
      path,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }
  var element = getElementByXpath(varStr);
  if (element) {
    if (isElem) {
      return element;
    }
    return element.textContent;
  }
  return null;
};

/**
 * Build method calls from events
 * @param {object} container
 */
Analytics.prototype.buildMethodCallsFromContainer = function (container) {
  var self = this;

  container.pages.forEach((page) => {
    const isMatchedPageURL = urlUtils.matchPage(page.url);
    if (isMatchedPageURL) {
      page.events.forEach((ev) => {
        self.collectPageData(ev);
        if (ev.type === 'page' && ev?.params?.actions) {
          const filteredTrackXHR =
            ev?.params?.actions?.filter((ac) => ac.type === 'trackXHR') || [];
          filteredTrackXHR.forEach(({ params }) => {});
        }

        self.executeBaseMethod(ev);
      });
    }
  });
};

Analytics.prototype.fetchContainerFromServer = function () {
  let self = this;

  return new Promise(function (resolve, reject) {
    let url = getTagsPagesURL(self._containerId);
    self.request(url).then(handleRes).catch(handleErrors);

    function handleRes(res) {
      resolve(JSON.parse(res));
    }
    function handleErrors(error) {
      reject(error);
    }
  });
};

Analytics.prototype.fetchAdNetworkContainer = async function () {
  const self = this;
  let url = getApiEndpointForInitAdNetwork(self._containerId);

  try {
    const res = await self.request(url, 'get');
    return JSON.parse(res);
  } catch (error) {
    return null;
  }
};

Analytics.prototype.fetchRecoContainer = async function ({
  visitorId,
  context = {},
}) {
  const self = this;
  let url = getApiEndpointForRecoSDKConfig(self._containerId);

  try {
    const res = await self.request(
      url,
      'post',
      {
        ['x-api-key']: 'x-api-key1111',
        ['X-User-ID']: visitorId,
      },
      {
        visitor_id: visitorId,
        context,
        decision_group: null,
      }
    );
    return JSON.parse(res);
  } catch (error) {
    return null;
  }
};

Analytics.prototype.getSearchData = async function (featureId, userId) {
  await delay(2000);
  const self = this;

  const storageData = store.get('aicactus_reco_features');

  async function checkSearchData() {
    if (storageData) {
      return storageData.features.find((feat) => feat.id === featureId);
    }
    const { anonymousId, context } = self.normalize({});
    const contextUserId = self?.user()?._getId() ?? null;

    let customContext = {
      ...context,
      timezone: getTimezone(),
    };
    if (contextUserId) {
      customContext = {
        ...customContext,
        user_id: contextUserId,
      };
    }

    if (userId?.length) {
      customContext = {
        ...customContext,
        user_id: userId,
      };
    }

    try {
      const res = await self.fetchRecoContainer({
        visitorId: anonymousId,
        context: customContext,
      });
      store.set('aicactus_reco_features', res);
      return res.features.find((feat) => feat.id === featureId);
    } catch (error) {
      await delay(500);
      checkSearchData();
    }
  }

  if (self._typeSDK === SDK_TYPES[1]) {
    return checkSearchData();
  }
};

interface IGetFeatureByIdOptions {
  [key: string]: any;
}

Analytics.prototype.getFeatureById = async function (
  featureId,
  type = FEATURE_TYPES.search,
  properties = {},
  userId = null,
  options: IGetFeatureByIdOptions = {}
) {
  const self = this;

  if (self._typeSDK === SDK_TYPES[1]) {
    const { anonymousId, context } = self.normalize({});
    const contextUserId = self?.user()?._getId() ?? null;

    const url = getApiEndpointForRecoSDKConfig(self._containerId);

    let customContext = {
      ...context,
      timezone: getTimezone(),
    };

    if (contextUserId) {
      customContext = {
        ...customContext,
        user_id: contextUserId,
      };
    }

    if (userId?.length) {
      customContext = {
        ...customContext,
        user_id: userId,
      };
    }

    if (type === FEATURE_TYPES.next && options?.productId) {
      const { page = {} } = context;
      customContext = {
        ...customContext,
        view: {
          id: options.productId,
          /**
           * type is product or create
           */
          type: 'product',
          title: page?.title ?? '',
          url: options?.url ?? '',
        },
      };
    }

    try {
      const res = await tryNTimes({
        promise: self.request(
          `${url}/${featureId}`,
          'post',
          {
            ['x-api-key']: 'x-api-key1111',
            ['X-User-ID']: anonymousId,
          },
          {
            visitor_id: anonymousId,
            context: customContext,
            type,
            properties,
          }
        ),
        interval: 500,
      });
      if (isJsonString(res)) {
        return JSON.parse(res);
      }
      return res;
    } catch (error) {
      const storageData = store.get('aicactus_reco_features');
      if (storageData.features) {
        const { features = [] } = storageData;
        return {
          data: features.find((feat) => feat.id === featureId),
        };
      }
    }
  }
};

/**
 * Method that SDK will call first
 */
Analytics.prototype.callMethodsFromContainer = async function (userId) {
  let self = this;

  function init(container) {
    // filter pages is active and is web | smartTV source
    const pagesIsActive = container.pages.filter(
      (page) => page?.status === 'active' && SOURCES.includes(page.source)
    );

    const pagesShouldTrack = pagesIsActive.reduce((acc, cur) => {
      const eventsAuto =
        cur?.events?.filter(
          (ev) => ev.collectType === 'auto' && ev.status === 'active'
        ) ?? [];
      if (eventsAuto.length) {
        return [
          ...acc,
          {
            ...cur,
            events: eventsAuto,
          },
        ];
      }
      return acc;
    }, []);

    const containerShouldTrack = {
      ...container,
      pages: pagesShouldTrack,
    };

    let allClickEvents = [];

    containerShouldTrack.pages.forEach(({ events = [] }) => {
      const filtered = events.filter(
        (ev) => ev.type === EVENT_TYPES_VALUE.trackClick
      );
      allClickEvents = [...allClickEvents, ...filtered];
    });

    // track click
    addDomEventHandlers({
      sdk: self,
      container: containerShouldTrack,
      trackEvents: allClickEvents,
    });

    // self.trackXHR(containerShouldTrack);

    /**
     * Check xem có phải là nextjs app
     * Nếu phải thì sẽ call .page() khi route change
     */
    self.checkNextApp(containerShouldTrack);

    /**
     * Filter page event
     */
    const pageEvent =
      containerShouldTrack.pages?.[0]?.events?.filter(
        (event) => event.type === 'page'
      ) ?? [];

    if (pageEvent?.length) {
      const {
        type,
        name,
        params: { category },
      } = pageEvent[0];
      // send page event request
      self.page(category, name);
    }

    self.buildMethodCallsFromContainer(containerShouldTrack);
  }

  function fetchContainerDMP() {
    self
      .fetchContainerFromServer()
      .then((res) => {
        const { container_status: status, pages = [] } = res;
        if (status === 'active') {
          if (pages.length) {
            init(res);
          }
        }
      })
      .catch(function (err) {
        throw new Error(err?.message ?? 'Something went wrong.');
      });
  }

  const { anonymousId, context, ...rest } = self.normalize({});

  async function fetchContainerRECO() {
    const res = await tryNTimes({
      promise: self.fetchRecoContainer({
        visitorId: anonymousId,
        context: userId
          ? {
              ...context,
              user_id: userId,
              timezone: getTimezone(),
            }
          : {
              ...context,
              timezone: getTimezone(),
            },
      }),
    });
    store.set('aicactus_reco_features', res);
    self.emit('RECO_READY');
  }

  async function fetchContainerAdnetwork() {
    const res = await tryNTimes({
      promise: self.fetchAdNetworkContainer(),
    });

    // bidToCore({
    //   sdk: self,
    //   initData: res,
    // });

    self.emit('ADNETWORK_READY', { sdk: self, initData: res });
    self._adNetworkInitData = res;
  }

  function initSDKWithType(initType = 'dmp') {
    const sdkType = {
      [SDK_TYPES[0]]: fetchContainerDMP,
      [SDK_TYPES[1]]: fetchContainerRECO,
      [SDK_TYPES[2]]: fetchContainerAdnetwork,
    };

    return sdkType?.[initType] ?? fetchContainerDMP;
  }

  initSDKWithType(self._typeSDK)();
};

/**
 * Track xhr
 */
Analytics.prototype.trackXHR = function (container) {
  const self = this;
  /**
   * Find page has url matched with current window location
   */
  const matchedContainer = container?.pages?.filter((page) =>
    urlUtils.matchPage(page.url)
  )?.[0];
  /**
   * Filter all track events
   */
  const hasTrackXHREvent = matchedContainer?.events?.filter(
    (ev) => ev.type === 'trackXHR'
  );

  /**
   * Listen xhr request
   */
  self.on('XHR_COMPLETED', ({ data, url }) => {
    if (hasTrackXHREvent) {
      /**
       * Check if xhr url is equal endpoint of event
       */
      const matchedEndpoint = hasTrackXHREvent.filter(
        (ev) => ev.endpoint === url
      )?.[0];
      if (matchedEndpoint) {
        /**
         * If event has actions
         */
        if (matchedEndpoint?.params?.actions) {
          each(function (action) {
            /**
             * If action type is track
             */
            if (action.type === 'track') {
              let props = {};
              /**
              
               * Get value of properties from xhr response data
               */
              each(function (val, key) {
                props[key] = __get(data, val, '');
              }, action.params.properties);

              // call SDK track
              self.executeFunctionByName(
                action.type,
                self,
                action.params.event,
                props,
                action.params.options,
                action.params.callback
              );
            }
          }, matchedEndpoint.params.actions);
        }
      }
    }
  });
};

/**
 * declare global
 */
declare global {
  interface Window {
    next: any;
  }
}

/**
 * Check if is next app then call analytics
 * when route change complete
 */
// TODO: check for SPA
Analytics.prototype.checkNextApp = function (container) {
  const isNextApp = window.next;
  const hasRoute = isNextApp && window.next.router;
  const self = this;

  if (hasRoute) {
    window.next.router.events.on(
      'routeChangeComplete',
      handleRouteChangeComplete
    );
  }

  function handleRouteChangeComplete(url) {
    const pageEvent =
      container.pages?.[0]?.events?.filter((event) => event.type === 'page') ??
      [];

    if (pageEvent?.length) {
      setTimeout(() => {
        const {
          type,
          name,
          params: { category },
        } = pageEvent[0];

        self.page(category, name);
      }, 500);
    }
  }
};

/**
 * End of Aicactus
 */

/**
 * Start of Ad network
 */
Analytics.prototype.requestAds = function (adUnits) {
  const self = this;
  if (!self._adNetworkInitData) {
    self.on('ADNETWORK_READY', (evt) => {
      findInventories(adUnits, evt.initData, self);
    });
  } else {
    findInventories(adUnits, self._adNetworkInitData, self);
  }

  function findInventories(adUnits, initData, self) {
    bidToCore({ sdk: self, initData, adUnits });
  }
};
/**
 * End of Ad network
 */

/*
 * Exports.
 */
module.exports = Analytics;

module.exports.cookie = cookie;
module.exports.memory = memory;
module.exports.store = store;
module.exports.metrics = metrics;
