/* jqGrid directive */

(function(root, $, undefined) {
  'use strict';
  // handles jqGrid
  root.Application.directive('jqGrid',
    ['garbageCollection','directiveRegistry', function(garbageCollection, directiveRegistry) {
      return {
        restrict: 'E',
        transclude: false,

        // template lives in index.php.template in a ng-template
        templateUrl: 'grid-table-snippet.html',

        link: function($scope, element, attrs) {
          // set isInModal if necessary
          if (attrs.isInModal == 'true') {
            $scope.isInModal = true;
          }

          // pass gridname to parent
          $scope.gridName = _.uniqueId('gridContainer_');
          garbageCollection.add('#alertmod_' + $scope.gridName);

          // populates parent's parent controller scope
          // directivesReady with directive name
          $scope.directivesReady = $scope.directivesReady || [];
          $scope.directivesReady.push('jqGrid');

          directiveRegistry.register($scope, attrs.name || 'jqGrid');
          // wait for next call stack, run triggerInitialGridLoad on scope
          _.defer($.proxy($scope.triggerInitialGridLoad, this));

          // resize grid on window resize
          $(root).bind('resize', _.throttle(function() {
            var grid = $('.ui-jqgrid-btable:visible');
            if (grid) {
              grid.each(function() {
                var gridId = $(this).attr('id');
                var gridParentWidth = $('#gbox_' + gridId).parent().width();
                $(this).setGridWidth(gridParentWidth, true);
              });
            }
          }, 100));
        }
      };
    }]
  );

})(this, jQuery);
