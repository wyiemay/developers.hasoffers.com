/**
 * offer pixel model
 */

(function(root, $, undefined) {
  'use strict';

  var OfferPixelService = ['api', 'models', function(api, models) {
    // create models class
    var OfferPixelModel = models.getExtendable('base').extend({

      name: 'offerPixels',

      // constructor
      init: function() {
        this._super();
      },

      /**
       * gets offer pixel data
       * @param  {object} params api parameters.
       * @return {angular:promise}        angular promise object.
       */
      getOfferPixelData : function(params) {
        if (_.indexOf(params.fields, 'Offer.name') > -1) {
          params.contain = ['Offer'];
        }

        var offerPixels = api.get('OfferPixel/findAll', params);
        return offerPixels;
      },

      /**
       * deletes an offer pixel
       * @param  {object} params api parameters.
       * @return {angular:promise}        angular promise object.
       */
      deleteOfferPixel : function(params) {
        $.extend(params, {'field' : 'status', 'value' : 'deleted'});
        var offerPixel = api.get('OfferPixel/updateField', params);
        return offerPixel;
      },

      createOfferPixel : function(params) {
        return api.get('OfferPixel/create', {'data' : params});
      },

      /**
       * Gets an array of the allowed pixel types for the given offer.
       * If an offer is using iFrame tracking, all pixel types are allowed
       * If an offer is using image tracking, only image and postbacks are allowed
       * @param  {int} offer_id
       * @return {angular:promise}        angular promise object.
       */
      getAllowedTypes : function(offer_id) {
        return api.get('OfferPixel/getAllowedTypes', {'offer_id' : offer_id});
      },

      /**
       * static metadata for offer pixels
       * @return {object} field and related entity data.
       */
      getOfferPixelDefinition : function() {
        return {
          'entity'           : 'OfferPixel',
          'fields' : {
            'id'           : { 'type' : 'int', 'nicename' : 'ID'},
            'offer_id'     : {'type' : 'int'},
            'affiliate_id' : {'type' : 'int'},
            'type' : {'type' : 'enum', 'values' : {
              'code' : 'HTML / JavaScript Code',
              'image' : 'Image Pixel',
              'url' : 'Postback URL'
            }},
            'code'         : {'type' : 'string', 'nicename' : 'Code/URL'},
            'status' : {'type' : 'enum', 'values' : {
              'active'   : 'Active',
              'pending'  : 'Pending',
              'deleted'  : 'Deleted',
              'rejected' : 'Rejected'
            }},
            'goal_id'      : {'type' : 'int'}
          },
          'related_entities' : {
            'Offer' : {
              'groupable' : false,
              'fields' : {
                'id'   : {'type' : 'integer'},
                'name' : {'type' : 'string'}
              }
            }
          }
        };
      }

    });
    return OfferPixelModel;
  }];

  // scope to root
  root.Models.offerPixel = OfferPixelService;

})(this, jQuery);
