/**
 * Billing Receipts Controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.receipts',
    ['$scope', 'models', 'directiveRegistry',
      function($scope, models, directiveRegistry) {
    var model = models.get('receipts');


    var updateTable = function() {
      var params = {
        'fields': [
          'id',
          'datetime',
          'status',
          'memo',
          'method',
          'amount',
          'currency_code'
        ],
        'page' : $scope.table.paging.page,
        'limit' : $scope.table.paging.pageSize
      };

      model.getReceipts(params).success(function(data) {
        // The api returns nested objects instead of arrays. Chrome loses any custom ordering in this case so we
        // have to sort the results ourselves.
        var sorted = _.chain(data)
          .map(function(row) {
            return row;
          })
          .sortBy(function(row) {
            return row.AffiliateInvoice.id;
          })
          .reverse()
          .value();

        if ($scope.table.drawTable) {
          $scope.table.drawTable(sorted, params);
        } else {
          $scope.table.addItems(sorted, params);
        }
      });
    };

    directiveRegistry.onDirectivesReady('billingPayments', function() {
      $scope.table = directiveRegistry.get('billingPayments');
      updateTable();

      $scope.table.$on('pagingChanged', function() {
        updateTable();
      });

      $scope.table.$on('moreItemsRequested', function() {
        updateTable();
      });
    });
  }]);

})(this, jQuery);
