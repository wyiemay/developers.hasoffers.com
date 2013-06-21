/**
 * Terms Of Service Model
 */

(function(root) {
  'use strict';

  var TermsService = ['api', 'models', function(api, models) {
    // create models class
    var TermsModel = models.getExtendable('base').extend({

      name: 'terms',

      // constructor
      init: function() {
        this._super();
      },

      /**
       * gets terms
       * @return {angular:promise} angular promise object.
       */
      getTerms : function() {
        return api.get('BrandDesign/getTermsAndConditions');
      }

    });

    return TermsModel;
  }];

  // scope to root
  root.Models.terms = TermsService;

})(this);
