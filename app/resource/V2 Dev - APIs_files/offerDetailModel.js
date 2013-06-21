/**
 * offer detail model
 */

(function(root, $, undefined) {
  'use strict';

  var OfferDetailService = ['api', 'models', function(api, models) {
    // create models class
    var OfferDetailModel = models.getExtendable('base').extend({

      name: 'offerDetail',

      // constructor
      init: function() {
        this._super();
      },

      /**
       * gets offer data
       * @param  {object} params   api request params.
       * @param  {object} $scope   angular scope object.
       * @param  {string} property property within scope to populate with data return.
       * @return {object}          angular promise object.
       */
      getOffer: function(params, $scope, property) {
        this.addDateFilter(params);

        this.convertContains(params);

        var offer = api.get('Offer/findById', params);
        if ($scope && property) {
          this.populateScope(offer, $scope, property);
        }
        return offer;
      },

      /**
       * gets thumbnail data
       * @param  {int} id    offer id.
       * @return {object}       angular promise object.
       */

      getThumbnail : function(id) {
        return api.get('Offer/getThumbnail', {'ids' : [id]});
      },

      getOfferUrls : function(offer_id) {

        var filters = {
          'offer_id' :  [offer_id]
        };

        return api.get('OfferUrl/findAll', {'filters' : filters});
      },

      /**
       * generates a tracking link
       * @param  {object} params api parameters.
       * @return {object}        angular promise.
       */
      generateTrackingLink : function(params) {
        if (_.isUndefined(params.affiliate_id)) {
          params.affiliate_id = root.Config.affiliate_id;
        }
        params.params = params.options;

        return api.get('Offer/generateTrackingLink', params);
      },

      getOfferApprovalQuestions : function(id) {
        return api.get('Offer/getApprovalQuestions', {'offer_id': id});
      },

      saveOfferApprovalAnswers : function(params) {
        return api.get('Offer/requestOfferAccess', params);
      },

      getRingRevenueLink : function(id) {
        return api.get('RingRevenue/createAffiliateLoginUrl', {'offer_id' : id, 'url_path' : '/home'});
      }
    });
    return OfferDetailModel;
  }];

  // scope to root
  root.Models.offerDetail = OfferDetailService;
})(this, jQuery);
