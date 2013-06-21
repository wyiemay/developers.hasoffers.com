/*
 * billing controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.billing',
    [
      '$scope',
      '$location',
      '$routeParams',
      '$q',
      'models',
      'api',
      'geographic',
      '$timeout',
      'currentUser',
      'directiveRegistry',
      function($scope,
               $location,
               $routeParams,
               $q,
               models,
               api,
               geographic,
               $timeout,
               currentUser,
               directiveRegistry) {


        var model = models.get('billing');

        $scope.account_balance = '';
        model.getAccountBalance($scope);

        $scope.affiliate = {};
        models.get('affiliate').getAffiliate($scope, 'affiliate');

        $scope.payout_to_date = '';
        $scope.payout_year = '';
        var payoutPromise = model.getPayoutTotals($scope);
        payoutPromise.success(function payoutPromiseSuccess() {
          $timeout(function() {
              root.angular.element('.quickstats p').textfill({maxFontPixels: 28});
            });
        });

        if (geographic.loaded) {
          $scope.countries = geographic.getCountries();
        } else {
          $scope.$on('geoInfoLoaded', function() {
            $scope.countries = geographic.getCountries();
          });
        }

        $scope.paymentReconciliationEnabled = false;
        currentUser.checkPreference('disable_payment_reconciliation',
                                    false,
                                    $scope,
                                    'paymentReconciliationEnabled');

        $scope.defaultPaymentMethod = '';
        var defaultPaymentMethodPromise = currentUser.checkPreference('affiliate_payment_method_default', null);
        defaultPaymentMethodPromise.then(angular.noop, function(value) {
          $scope.defaultPaymentMethod = value;
        });


        $scope.updateInvoiceTable = function() {
          var params = {
            'fields' : [
              'id',
              'datetime',
              'amount',
              'memo',
              'currency'
            ],
            'page'    : $scope.invoiceTable.paging.page,
            'limit'   : $scope.invoiceTable.paging.pageSize,
            'sort' : {
              'AffiliateInvoice.id' : 'desc'
            }
          };

          model.getPaymentHistory(params).success(function(data) {
            if ($scope.invoiceTable.addItems) {
              $scope.invoiceTable.addItems(data, params);
            } else {
              $scope.invoiceTable.drawTable(data, params);
            }
          });
        };


        directiveRegistry.onDirectivesReady('billingInvoices', function() {
          $scope.invoiceTable = directiveRegistry.get('billingInvoices');
          $scope.updateInvoiceTable();

          $scope.invoiceTable.$on('pagingChanged', function() {
            $scope.updateInvoiceTable();
          });

          $scope.invoiceTable.$on('moreItemsRequested', function() {
            $scope.updateInvoiceTable();
          });
        });

        $scope.mobile = {
          'pageState' : 'invoices'
        };



        var paymentMethods = {
          'check'          : 'Check',
          'direct_deposit' : 'Direct Deposit',
          'other'          : 'Other',
          'payoneer'       : 'Bank Transfers / Payoneer Prepaid Mastercard',
          'paypal'         : 'PayPal',
          'payquicker'     : 'PayQuicker',
          'wire'           : 'Wire'
        };

        var enabledPaymentMethods = function() {
          if (!currentUser.isLoaded) {
            return [];
          }

          var types = _.keys(paymentMethods),
              valid = [];

          _.each(types, function(value) {
            if (currentUser.getPreferenceValue('affiliate_payment_' + value + '_disabled') !== true) {
              valid.push(value);
            }
          });
          return valid;
        };

        /**
         * Get a simple object that can be used in an <select ng-options>
         * that maps API readable payment_method to human readable string
         * @param  object obj PaymentMethod object returned by API.
         */
        $scope.getPaymentMethodsMap = function(obj) {
          var returnObj = {},
              enabledMethods = enabledPaymentMethods();

          _.each(obj, function(value, key) {
            if (_.contains(enabledMethods, key.toLowerCase()) || _.contains(enabledMethods, 'direct_deposit')) {
              switch (key) {
                case 'DirectDeposit':
                  if (_.contains(enabledMethods, 'direct_deposit')) {
                    returnObj['Direct Deposit'] = 'direct_deposit';
                  }
                  break;
                case 'Paypal':
                  returnObj.PayPal = 'paypal';
                  break;
                default:
                  returnObj[key] = key.toLowerCase();
              }
            }
          });
          return returnObj;
        };

        /**
         * API->Human readable map of PayQuicker Methods
         * @type object
         */
        $scope.payQuickerMethodsMap = {
          m2m          : 'PayQuicker Account',
          m2papercheck : 'Paper Check',
          m2eft        : 'Electronic Funds Transfer (ETF/ACH)',
          advanced     : 'Advanced'
        };

        /**
         * Format API readale payment method string into human readable string
         * @param  string payment_method.
         * @return string.
         */
        $scope.formatPaymentMethod = function(payment_method) {
          return paymentMethods[payment_method] || payment_method;
        };

        // Store the state of the affiliate before edit mode entered so if the user cancels, we can revert
        $scope.original_affiliate = null;

        // Boolean if in billing details edit mode
        $scope.editMode = $routeParams.edit == 'true' ? true : false;

        if ($scope.editMode) {
          $scope.editMode = true;
        }

        // When $scope.affiliate is first populated, check if in blank state and set to edit mode
        $scope.$watch('affiliate', function(affiliate) {
          if (affiliate && $scope.isBillingDetailsBlankState(affiliate) && !$scope.editMode) {
            $scope.toggleEditMode();
          }
        });

        /**
         * Determining if we are in a "blank state" for billing details is tricky.
         * Right now, the API sets payment_method to 'check' by default so we have to check
         * if the payment_method is check and all of the fields within the check payment method are null
         *
         * @param  object   affiliate    Affiliate object to check for blank state.
         * @param  boolean  skipOriginal true to prevent an infinite loop when checking $scope.original_affiliate.
         * @return boolean.
         */
        $scope.isBillingDetailsBlankState = function(affiliate, skipOriginal) {
          if ($scope.defaultPaymentMethod === '') {
            return false;
          }

          if (!affiliate ||
              !affiliate.Affiliate ||
              !affiliate.PaymentMethod ||
              affiliate.Affiliate.payment_method != $scope.defaultPaymentMethod) {
            return false;
          }

          var parts = $scope.defaultPaymentMethod.split('_');
          var key = _.map(parts, function(part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
          }).join('');

          if (key == 'Payquicker') {
            key = 'PayQuicker';
          }

          var status = true;

          if (!affiliate.PaymentMethod[key]) {
            status = false;
          } else {
            _.each(affiliate.PaymentMethod[key], function(value, key) {
              if (!_.contains(['affiliate_id', 'modified', 'method'], key)) {
                if (!_.isEmpty(value) && value != 'NO' && value != '0') {
                  status = false;
                }
              }
            });
          }

          // There is a case where the user is in edit mode and switched to the check option
          // But they have a filled in payment_method originally. Look at the $scope.original_affiliate.
          if (!skipOriginal && $scope.editMode && status && $scope.original_affiliate !== null) {
            return $scope.isBillingDetailsBlankState($scope.original_affiliate, true);
          }

          return status;
        };

        /**
         * Toggle editMode
         * When turned on, store a clean copy of the affiliate object
         * When turned off, restore clean copy of the affiliate object
         */
        $scope.toggleEditMode = function() {
          $scope.editMode = !$scope.editMode;
          if ($scope.editMode) {
            $scope.original_affiliate = root.angular.copy($scope.affiliate);
          } else {
            if ($scope.original_affiliate) {
              $scope.affiliate = $scope.original_affiliate;
            }
            $scope.clearAlert('paymentMethodUpdateStatus');
          }
        };

        /**
         * Save the billing details details and update the Affiliate's payment_method
         */
        $scope.savePaymentMethod = function() {
          var method = '',
            data = {},
            alphanumericFields = [
              'account_number',
              'routing_number',
              'country'
            ];

          var clean_data = function(data) {
            var cleaned_data = {};
            _.each(data, function(value, key) {
              if (value) {
                if (_.contains(alphanumericFields, key)) {
                  value = (value + '').replace(/\W/g, '');
                }
                cleaned_data[key] = value;
              } else {
                cleaned_data[key] = '';
              }
            });
            return cleaned_data;
          };

          switch ($scope.affiliate.Affiliate.payment_method) {
            case 'wire':
              method = 'Affiliate/updatePaymentMethodWire';
              data = clean_data($scope.affiliate.PaymentMethod.Wire);
              break;
            case 'check':
              method = 'Affiliate/updatePaymentMethodCheck';
              data = clean_data($scope.affiliate.PaymentMethod.Check);
              break;
            case 'direct_deposit':
              method = 'Affiliate/updatePaymentMethodDirectDeposit';
              data = clean_data($scope.affiliate.PaymentMethod.DirectDeposit);
              break;
            case 'payoneer':
              method = 'Affiliate/updatePaymentMethodPayoneer';
              data = clean_data($scope.affiliate.PaymentMethod.Payoneer);
              break;
            case 'paypal':
              method = 'Affiliate/updatePaymentMethodPaypal';
              data = clean_data($scope.affiliate.PaymentMethod.Paypal);
              break;
            case 'payquicker':
              method = 'Affiliate/updatePaymentMethodPayQuicker';
              data = clean_data($scope.affiliate.PaymentMethod.PayQuicker);
              break;
            case 'other':
              method = 'Affiliate/updatePaymentMethodOther';
              data = clean_data($scope.affiliate.PaymentMethod.Other);
              break;
          }

          if (method !== '') {
            var params = {
                affiliate_id: root.Config.affiliate_id,
                data: data
              },
              update_params = {
                id: root.Config.affiliate_id,
                data: {
                  payment_method: $scope.affiliate.Affiliate.payment_method
                }
              };

            $q.all([
              api.get(method, params),
              api.get('Affiliate/update', update_params)
            ]).then(function() {
              $scope.addSuccess('paymentMethodUpdateStatus', 'Billing Details Updated');
              $scope.editMode = false;
              $scope.original_affiliate = null;
            }, function(response) {
              $scope.addError('paymentMethodUpdateStatus', response.errorMessage, response.errorDetails);
            });
          }
        };
  }]);
})(this, jQuery);
