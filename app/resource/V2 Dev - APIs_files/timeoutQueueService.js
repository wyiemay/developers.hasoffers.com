/**
 * Timeout Queue Service.
 *
 * Will batch process to an API waiting a timeout before sending request
 * to make sure everything has been added to the queue before requesting.
 *
 * Originally written to support loading of attributes in a table of data
 * ie Offers table needs to display thumbnails - call to get thumbnails is a seperate API call
 *    enqueue an offer_id and the element where the thumbnail is rendered to
 *    in a TimeoutQueue configured to parse getThumbnail responses
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.service('timeoutQueue', ['cache', function(cache) {
      var TimeoutQueue = function(options) {
        var obj = {
          queue      : {},
          inProgress : {},
          timeout    : null,

          defaults : {
            namespace     : '',
            key           : '',
            defaultValue  : '',
            timeoutLength : 100,
            cacheTimeout  : 120,
            getPromise    : root.angular.noop,
            processData   : root.angular.noop,
            postProcess   : root.angular.noop
          },

          init : function() {
            this.options = $.extend({}, this.defaults, options);
          },

          enqueue : function(id, element) {
            if (!(element instanceof $)) {
              return;
            }

            // Check cache and set element text if we have cache
            var cached = this.cacheGet(id, this.options.cacheTimeout);

            if (cached !== null) {
              element.html(cached);
              this.options.postProcess.call(this);
              return;
            }

            // Add id to the queue
            this.queue[id] = element;

            // Use a timeout so stat requests can be batched
            // Clear the timeout if it already existed so we wait before processing the queue
            root.clearTimeout(this.timeout);

            // Set a new timeout to process the queue (if no new requests come in first)
            (function(_this){
              _this.timeout = root.setTimeout(function(){
                _this.process.apply(_this);
              }, _this.options.timeoutLength);
            })(this);
          },

          process : function() {
            var ids = _.keys(this.queue),
                _this = this;

            // Keep track of elements in progress
            this.inProgress = $.extend(this.inProgress, this.queue);

            // Reset the queue
            this.queue = {};
            var promise = this.options.getPromise.call(this.options.getPromise, ids);

            promise.success(function(data) {
              _this.options.processData.call(_this, data, ids);

              // Check all of the ids we expected to get back
              // - set cache to default value if we didn't get a value back
              // - update html of element
              // - remove from inProgress list
              _.each(ids, function(id) {
                var value = _this.cacheGet(id);

                // Update the cache if it has no value currently
                if (value === null) {
                  _this.cachePut(id, _this.options.defaultValue);
                  value = _this.options.defaultValue;
                }

                _this.inProgress[id].html(value);
                delete(_this.inProgress[id]);
              });

              _this.options.postProcess.call(_this);
              // cache.debug();
            });
          },

          cachePut : function(id, value) {
            cache.put(this.options.namespace, this.options.key+'_'+id, value);
          },

          cacheGet : function(id, ageThreshold) {
            return cache.get(this.options.namespace, this.options.key+'_'+id, ageThreshold);
          }
        };

        obj.init();
        return obj;
      };

      return {
        factory: function(options) {
          return new TimeoutQueue(options);
        }
      };
    }]
  );
})(this, jQuery);
