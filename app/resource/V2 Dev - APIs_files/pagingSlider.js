/* controls paging slider directives */

(function(root, $, undefined) {
  'use strict';

  root.Application.directive('hasCarousel',
    function() {
      return {
        restrict: 'E',
        link: function($scope, element, attrs) {

          var el,
            elId;

          $scope.unique_id = elId = _.uniqueId('hasCarousel_');

          if (attrs.watchvar) {
            $scope.$watch(attrs.watchvar, function(val) {
              if (val) {
                buildElement();
              }
            });
          } else {
            buildElement();
          }

          var buildElement = function() {
            el = $('#' + elId).first();
            el.carousel();
          };

          $scope.previousClick = function() {
            el.carousel('prev');
          };

          $scope.nextClick = function() {
            el.carousel('next');
          };

        }
      };
    }
  );

})(this, jQuery);
