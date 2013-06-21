/**
 * Receipts Model
 */

(function(root, $, undefined) {
  'use strict';

  var ReceiptsService = ['api', 'models', function(api, models) {
    // create models class
    var ReceiptsModel = models.getExtendable('base').extend({

      name : 'receipts',

      // constructor
      init : function() {
        this._super();
      },

      /**
       * Gets Receipts for Affiliate User
       *
       * @returns promise  object
       */
      getReceipts : function() {
        var params = {
          'filters' : {
            'affiliate_id' : root.Config.affiliate_id
          },
          'contain' : ['Invoice']
        };

        return api.get('AffiliateBilling/findAllReceipts', params);
      },

      /**
       * Returns AffiliateReceipt entity definition
       *
       * @see http://www.hasoffers.com/wiki/AffiliateBilling:findAllReceipts
       * @see http://www.hasoffers.com/wiki/Api_Model:AffiliateReceipt
       * @return {object} definition meta data.
       */
      getDefinition: function() {
        return {
          'entity' : 'AffiliateReceipt',
          'nicename' : 'Receipt',
          'fields' : {
            'id'               : {'type' : 'integer'},
            'affiliate_id'     : {'type' : 'integer'},
            'amount'           : {'type' : 'currency'},
            'datetime'         : {'type' : 'timestamp'},
            'date'             : {'type' : 'string'},
            'memo'             : {'type' : 'string'},
            'notes'            : {'type' : 'string'},
            'transaction_id'   : {'type' : 'string'},
            'currency'         : {'type' : 'string'},
            'token_id'         : {'type' : 'string'},
            'payment_ref_id'   : {'type' : 'string'},
            'payment_info'     : {'type' : 'object'},
            'status' : {
              'type'   : 'enum',
              'values' : {
                'pending' : 'Pending',
                'success' : 'Success',
                'failed'  : 'Failed',
                'deleted' : 'Deleted'
              }
            },
            'method' : {
              'type'   : 'enum',
              'values' : {
                'check'          : 'Check',
                'direct_deposit' : 'Direct Deposit',
                'other'          : 'Other',
                'payoneer'       : 'Payoneer',
                'paypal'         : 'PayPal',
                'payquicker'     : 'PayQuicker',
                'wire'           : 'Wire'
              }
            }
          },
          'related_entities' : {
            'AffiliateInvoice' : {
              'nicename'  : 'Invoice',
              'groupable' : true,
              'fields' : {
                'id'           : {'type': 'integer'},
                'affiliate_id' : {'type': 'integer'},
                'start_date'   : {'type': 'timestamp'},
                'end_date'     : {'type': 'timestamp'},
                'status'       : {'type': 'enum', 'values': {'active': 'Active', 'deleted': 'Deleted'}},
                'memo'         : {'type': 'string'},
                'notes'        : {'type': 'string'},
                'is_paid'      : {'type': 'enum', 'values': {'0': 'Pending', '1': 'Paid'}},
                'receipt_id'   : {'type': 'integer'},
                'currency'     : {'type': 'string'},
                'datetime'     : {'type': 'timestamp'},
                'amount'       : {'type': 'currency'},
                'impressions'  : {'type': 'integer'},
                'clicks'       : {'type': 'integer'},
                'conversions'  : {'type': 'integer'},
                'actions'      : {'type': 'integer'},
                'revenue'      : {'type': 'currency'},
                'sale_amount'  : {'type': 'currency'}
              }
            }
          }
        };
      }
    });
    return ReceiptsModel;
  }];

  // scope to root
  root.Models.receipts = ReceiptsService;

})(this, jQuery);