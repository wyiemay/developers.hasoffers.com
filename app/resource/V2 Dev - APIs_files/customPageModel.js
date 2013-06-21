/**
 * custom page model
 */

(function(root) {
  'use strict';

  var CustomPageService = ['api', 'models', function(api, models) {
    // create models class
    var CustomPageModel = models.getExtendable('base').extend({

      name: 'customPage',

      // constructor
      init: function() {
        this._super();
      },

      /**
       * gets a list of custom pages for this application
       * @return {angular:promise} angular promise object.
       */
      getPages : function() {
        return api.get('CustomMenuLink/findActive');
      },

      getPage : function(page_id) {
        return api.get('CustomPage/findById', {'id' : page_id});
      }
    });

    return CustomPageModel;
  }];

  // scope to root
  root.Models.customPage = CustomPageService;

})(this);
