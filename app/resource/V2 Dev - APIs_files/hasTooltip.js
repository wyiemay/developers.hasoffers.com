(function(root, $, undefined) {
  'use strict';

  root.Application.directive('hasTooltip',
    ['$parse', function($parse) {
      return {
        template: ['<div class="hasTooltipIcon" ' +
          'style="display: none;"><span ng-transclude></span></div>'].join(),
        restrict: 'E',
        transclude: true,
        replace: true,
        link: function(scope, element, attrs) {

          var options = {
            'showOn': attrs.showOn || 'hover',
            'name': attrs.name || _.uniqueId('hasTooltip_'),
            'parentScope': attrs.parentScope ? $parse(attrs.parentScope) : true
          };

          // TODO: finish this.

        }
      };
    }]
  );
})(this, jQuery);
