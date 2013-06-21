/**
 * application level api calls
 */

(function(root, $, undefined) {
  'use strict';

  var ApplicationService = ['api', 'models', function(api, models) {
    // create models class
    var ApplicationModel = models.getExtendable('base').extend({

      name: 'Application',

      // constructor
      init: function() {
        this._super();
      },

      timezoneCache: null,

      findAllTimezones: function($q) {
        var $this = this,
          deferred = new $q.defer();

        if (! $this.timezoneCache) {
          api.get('Application/findAllTimezones').success(function(response) {
            $this.timezoneCache = response;
            deferred.resolve(root.angular.copy($this.timezoneCache));
          });
        } else {
          deferred.resolve(root.angular.copy($this.timezoneCache));
        }

        return deferred.promise;
      }
    });

    return ApplicationModel;
  }];

  // scope to root
  root.Models.Application = ApplicationService;

})(this, jQuery);
