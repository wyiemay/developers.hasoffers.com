/* Event directives for AngularStrap */
/* More directives available at http://mgcrea.github.com/angular-strap/ */
/* Modified to support data source watching */

(function(root, $, undefined) {
  'use strict';

  root.Application.directive('bsTypeahead',
    ['$parse', function($parse) {
      return {
        restrict: 'A',
        require: '?ngModel',
        link: function postLink(scope, element, attr, controller) {
          var getter = $parse(attr.bsTypeahead);

          element.attr('data-provide', 'typeahead');
          var input = element.typeahead({
            source: getter(scope),
            updater: function(value) {
              // If we have a controller (i.e. ngModelController)
              // then wire it up
              if (controller) {
                scope.$apply(function() {
                  controller.$setViewValue(value);
                });
              }
              return value;
            }
          });

          //  Warning: the property passed needs to be an array
          //   if you pass a function to bs-typeahead, Angular will yell at you
          //   because it doesn't know how to watch functions correctly
          scope.$watch(attr.bsTypeahead, function(_new) {
            input.data('typeahead').source = _new;
          });
        }
      };
    }]
  );

})(this, jQuery);
