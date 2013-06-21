/*
* conversionReport model
*/

(function(root, $, undefined) {
  'use strict';

  var ConversionService = ['api', 'models', function(api, models) {
    var ConversionReportModel = models.getExtendable('reportsBase').extend({

      name: 'conversionReport',

      // constructor function
      init: function() {
        this._super();
      },

      // cached filterList when requested
      filterList: [],

      /**
       * getter to return definintion
       * @return {object} statsReport defintion.
       */
      getDefinition: function() {
        return root.angular.copy(this.conversionReportDefinition);
      },

      /**
       * getter to return options
       * @return {object} statsReports options.
       */

      getOptions: function() {
        return root.angular.copy(this.conversionReportsOptions);
      },

      /**
       * getter to return column order
       * @return {array} order of statsReports columns.
       */

      getColumnOrder: function() {
        return root.angular.copy(this.conversionReportsOrder);
      },


      getDownloadReportLink : function(params) {
        this.addDateFilter(params);
        return this.generateReportDownload('getConversions', params.data_start, params.data_end, params);
      },

      /**
       * Gets Stats Report data for grid
       * @param  {object} params api request parameters.
       * @return {object}        angular promise object.
       */
      getReportData: function(params) {
        this.addDateFilter(params);
        var conversionCall = api.get('Report/getConversions', params);
        return conversionCall;
      },

      /**
       * Getter for current report's default options
       * @return {array} field list.
       */
      getDefaultReport: function() {
        return root.angular.copy(this.conversionReportsDefaultReport);
      },

      /**
       * extends base method to add current rerport definition if not passed in
       * @param  {string} field      field to determine.
       * @param  {mixed} definition can pass in definition or leave undefined.
       * @return {string}            nicename for requested field.
       */
      determineNicename: function(field, definition) {
        definition = definition || this.getDefinition();
        return this._super(field, definition);
      },

      /**
       * returns stats report filter list
       * @return {array} list of filter options.
       */
      getFilterList: function() {
        var $this = this;
        if (_.size($this.filterList) === 0) {

          $this.filterList = [];
          _.each($this.reportFilterList, function(filter) {
            if (_.indexOf($this.conversionReportFilterList, filter.value) > -1) {
              $this.filterList.push(filter);
            }
          });
        }
        return root.angular.copy($this.filterList);
      },

      getColumnWidth: function(fieldName) {

      }
    });
    return ConversionReportModel;
  }];

  root.Models.conversionReport = ConversionService;

})(this, jQuery);
