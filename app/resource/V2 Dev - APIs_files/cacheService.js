/**
 * cache service.
 * Namespaced key-value cache registry
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.service('cache', function() {
      var Cache = function() {

         // object store for cache
        var data = {};

        // corresponding storage for timestamp each cache key was created
        var age = {};

        /**
         * Instatiate the cache namespace
         * @param {string} namespace  Cache namespace
         */
        var setupNamespace = function(namespace) {
          data[namespace] = data[namespace] || {};
          age[namespace] = age[namespace] || {};
        };

        /**
         * Returns cached value for `key` or null for a cache miss
         * Handles cache invalidation if the cache was last updated too long ago
         * @param {string} namespace       Cache namespace
         * @param {string} key             The cache key.
         * @param {int}    ageThreshold    Threshold in seconds for age of cache.
         *                                 Defaults to 10 seconds.
         * @return {mixed} Value in cache or null if none exists.
         */
        this.get = function(namespace, key, ageThreshold) {
          setupNamespace(namespace);

          if (!_.isNumber(age[namespace][key])) {
            return null;
          }

          // Default threshold is 10 seconds old
          if (_.isUndefined(ageThreshold)) {
            ageThreshold = 10;
          }

          var now = new Date().getTime();
          if ((now - age[namespace][key]) < (ageThreshold * 1000)) {
            if (_.isNull(data[namespace][key])) {
              return null;
            }

            return data[namespace][key];
          }

          return null;
        };

        /**
         * Write a value key pair to the cache
         * @param {string} namespace  Cache namespace
         * @param {string} key        Reference name in cache.
         * @param {mixed}  value      Value to store.
         */
        this.put = function(namespace, key, value) {
          setupNamespace(namespace);

          data[namespace][key] = value;
          age[namespace][key] = new Date().getTime();
        };
      };

      return new Cache();
    });
})(this, jQuery);
