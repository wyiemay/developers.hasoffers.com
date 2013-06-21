/*
* referralReport model
*/

(function(root, $, undefined) {
  'use strict';

  var ReferralService = ['api', 'models', function(api, models) {
    var ReferralReportModel = models.getExtendable('reportsBase').extend({

      name: 'referralReport',

      // constructor function
      init : function() {
        this._super();
      },

      // cached filterList when requested
      filterList: [],

      /**
       * getter to return definintion
       * @return {object} statsReport defintion.
       */
      getDefinition : function() {
        return root.angular.copy(this.referralReportDefinition);
      },

      /**
       * Gets Stats Report data for grid
       * @params options required for report data
       * @return {angular promise object}
       */

      getReportData : function(params) {
        return api.get('Report/getAffiliateCommissions', params);
      },

      getReferralList : function() {
        return api.get('Report/getAffiliateReferrals');
      },

      /**
       * extends base method to add current rerport definition if not passed in
       * @param  {string} field      field to determine.
       * @param  {mixed} definition can pass in definition or leave undefined.
       * @return {string}            nicename for requested field.
       */
      determineNicename : function(field, definition) {
        definition = definition || this.getDefinition();
        return this._super(field, definition);
      }
    });
    return ReferralReportModel;
  }];

  root.Models.referralReport = ReferralService;

})(this, jQuery);
