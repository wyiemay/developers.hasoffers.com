/*
 * Invoice controller
 */

(function(root, $, undefined){
  'use strict';

  root.Application.controller('Controllers.invoice',
    ['$scope', '$routeParams', 'currentUser', 'models',
      function($scope, $routeParams, currentUser, models) {


      $scope.invoice_id = $routeParams.id;
      $scope.affiliate = currentUser.Affiliate;
      $scope.brand = currentUser.Brand;

      $scope.$on('UserLoaded', function(success) {
        if (success) {
          $scope.affiliate = currentUser.Affiliate;
          $scope.brand = currentUser.Brand;
        }
      });

      $scope.paymentReconciliationEnabled = false;
      currentUser.checkPreference('disable_payment_reconciliation', false, $scope, 'paymentReconciliationEnabled');

      var promise = models.get('invoice').getInvoice($scope.invoice_id);
      promise.success(function(data) {
        if (!data) {
          $scope.addError('invoiceLoadStatus',
                          'Error loading invoice',
                          'The details for this invoice cannot be displayed');
          return;
        }

        $scope.invoice = data;
      });

      $scope.payoutTypeFromAbbr = function(abbr) {
        return root.Config.Enums.offerPayoutType[abbr] || '';
      };

      $scope.formatPayoutActions = function(actions, payout_type) {
        var plural = (actions === 0) ? '' : 's';

        switch(payout_type) {
          case 'cpc':
            return '{0}&nbsp;Click{1}'.format(actions, plural);

          case 'cpm':
            return '{0}&nbsp;Impression{1}'.format(actions, plural);

          case 'cpa_flat':
          case 'cpa_percentage':
          case 'cpa_both':
            return '{0}&nbsp;Conversion{1}'.format(actions, plural);
        }
      };

      $scope.print = function() {
        window.print();
      };

    }]);

})(this, jQuery);
