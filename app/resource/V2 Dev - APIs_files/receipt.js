/**
 * A Single Receipt
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.receipt',
    ['$scope', '$routeParams', 'currentUser', 'models',
      function($scope, $routeParams, currentUser, models) {

    $scope.receipt_id = $routeParams.id;
    $scope.affiliate = currentUser.Affiliate;
    $scope.brand = currentUser.Brand;

    $scope.$on('UserLoaded', function(success) {
      if (success) {
        $scope.affiliate = currentUser.Affiliate;
        $scope.brand = currentUser.Brand;
      }
    });

    var model = models.get('invoice'),
        promise = model.getReceipt($scope.receipt_id);

    promise.success(function(receiptData) {
      // Standardize the payment_info (API sends multiple formats)
      var payment_info = receiptData.AffiliateReceipt.payment_info;
      if (payment_info) {
        if (_.size(payment_info) == 1) {
          payment_info = _.toArray(payment_info).pop();
        }

        // Affiliate ID shouldn't be displayed on the receipt if in payment_info
        delete(payment_info.affiliate_id);

        // Delete data with empty values
        _.each(payment_info, function(value, key) {
          if (value === '') {
            delete(payment_info[key]);
          }
        });
      }

      receiptData.AffiliateReceipt.payment_info = payment_info;
      $scope.receipt = receiptData.AffiliateReceipt;

      // Receipt might apply to multiple invoices, link to other referenced invoices
      $scope.receipt.invoices = [];
      if (receiptData.AffiliateInvoice && receiptData.AffiliateInvoice[0]) {
        _.each(receiptData.AffiliateInvoice[0], function(invoice) {
          $scope.receipt.invoices.push(invoice.id);
        });
      }
    });

    $scope.humanizeKey = function(key) {
      key = key.replace('_', ' ');
      key = key.replace(/\d/, '');

      return key;
    };

  }]);

})(this, jQuery);
