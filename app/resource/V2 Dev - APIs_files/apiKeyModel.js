/**
 * API model
 */

(function(root) {
  'use strict';

  var ApiKeyService = ['api', 'models', function(api, models) {
    // create models class
    var ApiKeyModel = models.getExtendable('base').extend({

      name: 'ApiKey',

      // constructor
      init: function() {
        this._super();
      },

      getKey : function() {
        return api.get('ApiKey/getUserApiKey');
      },

      generateKey : function() {
        return api.get('ApiKey/generateApiKey');
      },

      regenerateKey: function(existing_key) {
        return api.get('ApiKey/regenerateApiKey', {'existing_api_key' : existing_key});
      }
    });

    return ApiKeyModel;
  }];

  // scope to root
  root.Models.apiKey = ApiKeyService;

})(this);
