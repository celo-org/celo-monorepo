export default {
  setup: function(key, options = {}) {
    return new Promise((resolve) => resolve())
  },

  identify: function(userId, traits = {}) {},

  track: function(event, properties = {}) {},

  screen: function(name, properties = {}) {},

  group: function(groupId, traits = {}) {},

  alias: function(newId) {},

  reset: function() {},

  flush: function() {},

  enable: function() {},

  disable: function() {},
}

export const AnalyticsConstants = {
  enableAdvertisingTracking: false,
  flushAt: 1,
  recordScreenViews: false,
  shouldUseBluetooth: false,
  shouldUseLocationServices: false,
  trackApplicationLifecycleEvents: false,
  trackAttributionData: false,
  trackDeepLinks: false,
  debug: true,
}
