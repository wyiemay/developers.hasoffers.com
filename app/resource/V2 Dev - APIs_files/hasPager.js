/* A pager for a table */

// TODO(jack): Document me.

(function(root, undefined) {
  'use strict';
  var app = root.angular.module('hasOffers.hasTable');

  app.directive('hasPager', function() {

    return {
      'restrict'    : 'E',
      'replace'     : true,
      'require'     : '^hasTable',
      'templateUrl' : 'hasPager',
      'link'        : function($scope) {
        $scope.currentPage = Number($scope.paging.page) || 1;

        $scope.gridPageNumOptions = [10, 20, 50, 200];

        $scope.gridSetPageSize = function(rowCount) {
          $scope.paging.pageSize = rowCount;
          if (Math.floor($scope.paging.count / rowCount) < $scope.currentPage) {
            $scope.paging.page = 1;
          }
          notifyUpdate();
        };

        $scope.gridPageNext = function() {
          if ($scope.paging.page >= $scope.paging.pageCount) { return; }
          $scope.paging.page = Number($scope.paging.page) + 1;
          notifyUpdate();
        };

        $scope.gridPagePrev = function() {
          if ($scope.paging.page <= 1) { return; }
          $scope.paging.page = Number($scope.paging.page) - 1;
          notifyUpdate();
        };

        $scope.updatePageNum = function() {
          if (_.isNumber(parseInt($scope.currentPage, 10)) &&
              $scope.currentPage <= $scope.paging.pageCount &&
              $scope.currentPage > 0) {
            $scope.paging.page = $scope.currentPage;
            notifyUpdate();
          } else {
            $scope.currentPage = Number($scope.paging.page) || 1;
          }
        };

        $scope.$watch('paging.page', function() {
          $scope.currentPage = Number($scope.paging.page) || 1;
        });

        var notifyUpdate = function() {
          $scope.$parent.$broadcast('pagingChanged', $scope.paging);
          $scope.currentPage = Number($scope.paging.page) || 1;
        };
      }
    };
  });

})(this);
