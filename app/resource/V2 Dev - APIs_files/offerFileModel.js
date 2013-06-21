/**
 * offerFile model
 */

(function(root, $, undefined) {
  'use strict';

  var OfferFileService = ['api', 'models', function(api, models) {
    // create models class
    var OfferFileModel = models.getExtendable('base').extend({

      name: 'offerFile',

      // constructor
      init: function() {
        this._super();
      },

      getCreatives: function(params) {
        this.addDateFilter(params);

        this.convertContains(params);

        return api.get('OfferFile/findAll', params);
      },

      getOfferFileDefinition: function() {
        return {
          'entity' : 'OfferFile',
          'fields' : {
            'id'         : { 'type' : 'int'},
            'offer_id'   : {'type' : 'int'},
            'display'    : {'type' : 'string'},
            'interface'  : {'type' : 'enum', 'values' : ['advertiser', 'affiliate', 'network']},
            'account_id' : {'type' : 'int'},
            'type' : {
              'type' : 'enum',
              'values' : {
                'file'            : 'File',
                'image banner'    : 'Static Banner',
                'flash banner'    : 'Flash Banner',
                'email creative'  : 'HTML Email',
                'offer thumbnail' : 'Offer Thumbnail',
                'text ad'         : 'Text Creative',
                'html ad'         : 'HTML Creative',
                'hidden'          : 'Hidden'
              }
            },
            'filename'   : {'type' : 'string'},
            'width'      : {'type' : 'int'},
            'height'     : {'type' : 'int'},
            'code'       : {'type' : 'string'},
            'status'     : this.getStandardDef('status'),
            'is_private' : $.extend(this.getStandardDef('bool_yes'), {'nicename' : 'Private'}),
            'created'    : this.getStandardDef('created'),
            'modified'   : this.getStandardDef('modified'),
            'shared'     : this.getStandardDef('bool_yes'),
            'size'       : {'type' : 'int'},
            'url'        : {'type' : 'string'},
            'thumbnail'  : {'type' : 'string'}
          },
          'related_entities' : {
            'Offer' : {
              'fields' : {
                'id'   : {'type' : 'int'},
                'name' : {'type' : 'string'}
              }
            }
          }
        };
      },

      getCreativeCode : function(params) {
        return api.get('OfferFile/getCreativeCode', params);
      }


    });
    return OfferFileModel;
  }];

  // scope to root
  root.Models.offerFile = OfferFileService;

})(this, jQuery);
