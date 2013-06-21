/*
 * invoice model
 */

(function(root, $, undefined){
  'use strict';

  var InvoiceService = ['api', 'models', function(api, models) {
    var InvoiceModel = models.getExtendable('base').extend({

      name : 'invoice',

      init : function() {
        this._super();
      },

      /**
       * Gets Invoice Data
       *
       * @param {int} id  invoice id
       * @returns promise  object
       */
      getInvoice : function(id) {
        var params = {
          id : id,
          contain : ['InvoiceItem', 'Affiliate', 'PaymentMethod']
        };

        return api.get('AffiliateBilling/findInvoiceById', params);
      },

      /**
       * Gets Receipt Data
       *
       * @param {int} id  invoice id
       * @returns promise  object
       */
      getReceipt : function(id) {
        var params = {
          id : id,
          contain : ['Invoice']
        };

        return api.get('AffiliateBilling/findReceiptById', params);
      }
    });
    return InvoiceModel;
  }];

  root.Models.invoice = InvoiceService;
})(this, jQuery);