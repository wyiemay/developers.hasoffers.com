/*
 * affiliateUsers table controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.affiliateUsers',
    [
      '$scope',
      '$location',
      '$rootScope',
      'sessionStorageService',
      'currentUser',
      'models',
      'directiveRegistry',
      function($scope,
               $location,
               $rootScope,
               sessionStorageService,
               currentUser,
               models,
               directiveRegistry) {


    var model = models.get('affiliateUser'),
        sortFields = {'field': 'email', 'direction': 'asc'};

    var updateTable = function() {
      var params = {
        'filters' : {
          'status' : {
            'NOT_EQUAL_TO' : 'deleted'
          }
        },
        'fields' : [
          'id',
          'email',
          'first_name',
          'last_name',
          'title',
          'modified',
          'status'
        ],
        'sort'    : {},
        'page'    : $scope.table.paging.page,
        'limit'   : $scope.table.paging.pageSize
      };
      params.sort['AffiliateUser.' + $scope.table.sort.field] = $scope.table.sort.direction;

      $scope.incrementLoading();
      model.getAllAffiliateUsers(params).success(function(data) {
        $scope.decrementLoading();
        ($scope.table.addItems || $scope.table.drawTable)(data, params);
      });
    };

    var setupDesktop  = function() {
      directiveRegistry.onDirectivesReady('affiliateUsers', function() {
        $scope.table = directiveRegistry.get('affiliateUsers');
        $scope.table.sort = sortFields;

        $scope.table.$on('pagingChanged', function() {
          updateTable();
        });

        $scope.table.$on('sortRequested', function() {
          updateTable();
        });
        updateTable();
      });

      $scope.$parent.$on('userUpdated', function() {
        updateTable();
      });
    }

    var setupMobile = function() {
      directiveRegistry.onDirectivesReady(['usersTableMobile'], function() {
        $scope.table = directiveRegistry.get('usersTableMobile');
        $scope.table.sort = sortFields;

        updateTable();

        $scope.table.$on('moreItemsRequested', function() {
          updateTable();
        });
      });
    }

    if ($scope.isMobile) {
      setupMobile();
    } else {
      setupDesktop();
    }

  }]);

})(this, jQuery);
