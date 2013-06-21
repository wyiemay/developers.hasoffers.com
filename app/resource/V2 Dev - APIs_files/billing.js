/*
 * billing model
 */

(function(root, $, undefined) {
  'use strict';

  var BillingService = ['api', 'models', function(api, models) {
    var BillingModel = models.getExtendable('base').extend({

      name: 'billing',

      init: function() {
        this._super();
      },

      /**
       * Gets Payment History data
       *
       * @return promise  object
       */
      getPaymentHistory: function(params) {
        return api.get('AffiliateBilling/findAllInvoices', params);
      },

      /**
       * Get Account Balance
       * sets `$scope.account_balance`
       *
       * @param  {object} $scope   angular $scope.
       * @param  {object} params   api parameters.
       * @return promise  object
       */
      getAccountBalance: function($scope, params) {
        params = $.extend(params, {'id' : root.Config.affiliate_id});

        var promise = api.get('Affiliate/getAccountBalance', params);
        promise.success(function(data) {
          $scope.account_balance = data;
        });
        return promise;
      },

      /**
       * Fetches the alltime and this year payout totals
       * sets `$scope.payout_to_date`
       * sets `$scope.payout_year`
       *
       * @param   {object} $scope angular $scope.
       * @return promise  object
       */
      getPayoutTotals: function($scope) {
        var currentYear = moment().format('YYYY');

        var params = {
          affiliate_id: root.Config.affiliate_id,
          timeframes: [
            {
              label      : 'alltime',
              start_date : '2001-01-01',
              end_date   : currentYear + '-12-31'
            },
            {
              label      : 'this_year',
              start_date : currentYear + '-01-01',
              end_date   : currentYear + '-12-31'
            }
          ]
        };

        var promise = api.get('AffiliateBilling/getPayoutTotals', params);
        promise.success(function(data) {
          $scope.payout_to_date = data.alltime.total_payout;
          $scope.payout_year = data.this_year.total_payout;
        });
        return promise;
      },

      /**
       * Returns AffiliateInvoice entity definition
       *
       * @see http://www.hasoffers.com/wiki/AffiliateBilling:findAllInvoices
       * @see http://www.hasoffers.com/wiki/Api_Model:AffiliateInvoice
       * @return {object} definition meta data.
       */
      getPaymentHistoryDefinition: function() {
        return {
          'entity' : 'AffiliateInvoice',
          'fields' : {
            'id'           : {'type' : 'integer'},
            'affiliate_id' : {'type' : 'integer'},
            'start_date'   : {'type' : 'timestamp'},
            'end_date'     : {'type' : 'timestamp'},
            'status'       : {'type' : 'enum', 'values' : {'active' : 'Active', 'deleted' : 'Deleted'}},
            'memo'         : {'type' : 'string'},
            'notes'        : {'type' : 'string'},
            'is_paid'      : {'type' : 'enum', 'values' : {'0' : 'Pending', '1' : 'Paid'}},
            'receipt_id'   : {'type' : 'integer'},
            'currency'     : {'type' : 'string'},
            'datetime'     : {'type' : 'timestamp'},
            'amount'       : {'type' : 'currency'},
            'impressions'  : {'type' : 'integer'},
            'clicks'       : {'type' : 'integer'},
            'conversions'  : {'type' : 'integer'},
            'revenue'      : {'type' : 'currency'},
            'sale_amount'  : {'type' : 'currency'}
          }
        };
      }
    });
    return BillingModel;
  }];

  // scope to root
  root.Models.billing = BillingService;
})(this, jQuery);
