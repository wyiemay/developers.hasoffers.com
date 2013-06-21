/*
 * affiliate model
 */

(function(root, $, undefined) {
  'use strict';

  var AffiliateService = ['api', 'models', function(api, models) {
    var AffiliateModel = models.getExtendable('base').extend({

      name: 'affiliates',

      init: function() {
        this._super();
      },

      /*
       * Gets Affiliate data
       * @param $scope angular $scope
       * @param property $scope property to populate
       * @returns promise object
       */
      getAffiliate: function($scope, property) {
        var params = {
          id: root.Config.affiliate_id,
          contain: {
            0 : 'PaymentMethod',
            1 : 'AffiliateMeta'
          }
        };
        var affiliate = api.get('Affiliate/findById', params);

        if ($scope && property) {
          this.populateScope(affiliate, $scope, property, true);
        } else if ($scope) {
          affiliate.success(function(data) {
            $scope.affiliate = data.Affiliate;
            $scope.affiliate.PaymentMethod = data.PaymentMethod;
            $scope.affiliate.AffiliateMeta = data.AffiliateMeta;
          });
        }

        return affiliate;
      },

      updateAffiliate: function(params) {
        return api.get('Affiliate/update', params);
      }
    });
    return AffiliateModel;
  }];

  // scope to root
  root.Models.affiliate = AffiliateService;
})(this, jQuery);
