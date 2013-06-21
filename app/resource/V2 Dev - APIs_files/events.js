/* Event directives */

(function(root, $, undefined) {
  'use strict';

  root.Application.directive('ngFocus',
    ['$parse', function($parse) {
      return function(scope, element, attrs) {
        var fn = $parse(attrs.ngFocus);
        element.bind('focus', function(event) {
          if (!scope.$$phase) {
            scope.$apply(function() {
              fn(scope, {$event: event});
            });
          }
        });
      };
    }]
  );

  // handles blur events
  root.Application.directive('ngBlur',
    ['$parse', function($parse) {
      return function(scope, element, attrs) {
        var fn = $parse(attrs.ngBlur);
        element.bind('blur', function(event) {
          if (!scope.$$phase) {
            scope.$apply(function() {
              fn(scope, {$event: event});
            });
          }
        });
      };
    }]
  );

  // handles hover events
  root.Application.directive('ngHover',
    ['$parse', function($parse) {
      return function(scope, element, attrs) {
        var fn = $parse(attrs.ngHover);
        element.bind('hover', function(event) {
          if (!scope.$$phase) {
            scope.$apply(function() {
              fn(scope, {$event: event});
            });
          }
        });
      };
    }]
  );

  // handles 'enter' keypress events
  root.Application.directive('ngEnterkey',
    ['$parse', function($parse) {
      return function(scope, element, attrs) {
        var fn = $parse(attrs.ngEnterkey);
        element.bind('keydown', function(event) {
          if (event.which === 13) {
            scope.$apply(function() {
              fn(scope, {$event: event});
            });
          }
        });
      };
    }]
  );

})(this, jQuery);
