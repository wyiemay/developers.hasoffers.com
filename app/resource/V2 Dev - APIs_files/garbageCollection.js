/**
 * garbageCollection service
 * certain directives leave dom remnants, this will remove those remnants automatically on the next routeChange
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.service('garbageCollection',
    ['$location', '$rootScope', function($location, $rootScope) {
      var queue = [],
        init = true;

      return {
        'add' : function(item) {
          queue.push(item);
          if (init) {
            init = false;
            $rootScope.$on('$routeChangeSuccess', function() {
              if (queue.length > 0) {
                _.each(queue, function(item) {
                  root.angular.element(item).remove();
                });
                queue = [];
              }
            });

          }
        }
      };
    }]
  );
})(this, jQuery);
